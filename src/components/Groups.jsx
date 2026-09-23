import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const Groups = () => {
    const { state, setState, openUserProfile } = useAppState();
    const { groupId: routeGroupId } = useParams();
    const navigate = useNavigate();
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'polls' | 'members'
    const [groupFilter, setGroupFilter] = useState('all'); // 'all' | 'joined' | 'requested' | 'discover'
    const [searchTerm, setSearchTerm] = useState('');
    const [isGroupPollModalOpen, setIsGroupPollModalOpen] = useState(false);
    const [groupPollQuestion, setGroupPollQuestion] = useState('');
    const [groupPollOptions, setGroupPollOptions] = useState(['', '']);
    const [groupPollError, setGroupPollError] = useState('');
    const [isPollLoading, setIsPollLoading] = useState(false);
    const isPollSubmittingRef = useRef(false);
    const chatRef = useRef(null);

    const groupId = routeGroupId || null;
    const roomGroups = (state.groups || []).filter(g => g.roomId === state.user.roomId);
    const currentGroup = groupId ? (state.groups || []).find(g => String(g.id) === groupId) : null;

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [currentGroup?.messages]);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return alert('Group name is required');
        const newGroup = {
            roomId: state.user.roomId,
            name: newGroupName.trim(),
            description: newGroupDesc.trim(),
            members: [{ id: state.user.id, name: state.user.name, email: state.user.email, roleInGroup: 'admin' }],
            requests: [],
            messages: [],
            isMuted: false,
        };
        try {
            await addDoc(collection(db, "groups"), newGroup);
            setNewGroupName(''); 
            setNewGroupDesc(''); 
            setIsCreateModalOpen(false);
        } catch(e) { console.error("Create group error:", e); }
    };

    const handleMemberAction = async (userId, action) => {
        if (!currentGroup) return;
        
        const mIdx = currentGroup.members.findIndex(m => String(m.id) === String(userId));
        if (mIdx === -1) return;

        const updatedMembers = [...currentGroup.members];

        if (action === 'promote') {
            updatedMembers[mIdx] = { ...updatedMembers[mIdx], roleInGroup: 'co-admin' };
        } else if (action === 'demote') {
            updatedMembers[mIdx] = { ...updatedMembers[mIdx], roleInGroup: 'student' };
        } else if (action === 'remove') {
            if (!window.confirm("Remove this member from the group?")) return;
            updatedMembers.splice(mIdx, 1);
        }

        try {
            await updateDoc(doc(db, "groups", currentGroup.id), { members: updatedMembers });
        } catch(e) { console.error(e); }
    };

    const handleRequestJoin = async () => {
        if (!currentGroup) return;
        try {
            const newRequests = [...(currentGroup.requests || []), { id: state.user.id, name: state.user.name, email: state.user.email }];
            await updateDoc(doc(db, "groups", currentGroup.id), { requests: newRequests });
            alert("Join request sent successfully!");
        } catch(e) { console.error("Failed to request join:", e); }
    };

    const handleRequestAction = async (reqUser, action) => {
        if (!currentGroup) return;
        const filteredRequests = (currentGroup.requests || []).filter(r => r.id !== reqUser.id);
        const payload = { requests: filteredRequests };
        
        if (action === 'accept') {
            payload.members = [...(currentGroup.members || []), { ...reqUser, roleInGroup: 'student' }];
        }
        
        try {
            await updateDoc(doc(db, "groups", currentGroup.id), payload);
        } catch(e) { console.log("Action failed", e); }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !currentGroup) return;

        const newMessages = [...(currentGroup.messages || [])];
        newMessages.push({ userId: state.user.id, userName: state.user.name, text: chatInput.trim(), time: Date.now() });
        
        try {
            await updateDoc(doc(db, "groups", currentGroup.id), { messages: newMessages });
            setChatInput('');
        } catch(e) { console.error(e); }
    };

    const toggleGroupMute = async () => {
        try {
            await updateDoc(doc(db, "groups", currentGroup.id), { isMuted: !currentGroup.isMuted });
        } catch(e) { console.error(e); }
    };

    const handleDirectJoin = async (targetGroup) => {
        try {
            const newRequests = [...(targetGroup.requests || []), { id: state.user.id, name: state.user.name, email: state.user.email }];
            await updateDoc(doc(db, "groups", targetGroup.id), { requests: newRequests });
            alert(`Request sent to join ${targetGroup.name}!`);
        } catch(e) { console.error(e); }
    };

    const handleCancelRequest = async (targetGroup) => {
        if (!window.confirm(`Withdraw your join request for "${targetGroup.name}"?`)) return;
        try {
            const newRequests = (targetGroup.requests || []).filter(r => String(r.id) !== String(state.user?.id));
            await updateDoc(doc(db, "groups", targetGroup.id), { requests: newRequests });
            alert("Join request cancelled.");
        } catch(e) { console.error("Cancel request error:", e); }
    };

    const handleCreateGroupPoll = async (e) => {
        e.preventDefault();
        if (!currentGroup) return;
        if (isPollSubmittingRef.current || isPollLoading) return;
        isPollSubmittingRef.current = true;
        setIsPollLoading(true);
        setGroupPollError('');

        const filteredOpts = groupPollOptions.filter(o => o.trim());
        if (!groupPollQuestion.trim() || filteredOpts.length < 2) {
            setGroupPollError("Please provide a question and at least 2 options!");
            setIsPollLoading(false);
            isPollSubmittingRef.current = false;
            return;
        }

        const trimmedQ = groupPollQuestion.trim().toLowerCase();
        // Prevent duplicate creation within 15 seconds
        const isDuplicate = (state.polls || []).some(p => 
            String(p.groupId || '') === String(currentGroup.id) &&
            (p.question || '').trim().toLowerCase() === trimmedQ &&
            p.createdAt && (Date.now() - p.createdAt < 15000)
        );

        if (isDuplicate) {
            setIsGroupPollModalOpen(false);
            setGroupPollQuestion(''); setGroupPollOptions(['', '']);
            setIsPollLoading(false);
            isPollSubmittingRef.current = false;
            return;
        }

        const newPoll = {
            roomId: state.user?.roomId || currentGroup.roomId,
            groupId: String(currentGroup.id),
            groupName: currentGroup.name,
            question: groupPollQuestion.trim(),
            options: filteredOpts.map((text, idx) => ({ id: idx + 1, text: text.trim(), votes: 0 })),
            votedBy: [],
            userVotes: {},
            createdAt: Date.now()
        };

        try {
            const docRef = await addDoc(collection(db, "polls"), newPoll);
            setState(prev => {
                const alreadyExists = (prev.polls || []).some(p => String(p.id) === String(docRef.id) || String(p._id) === String(docRef.id));
                if (alreadyExists) return prev;
                return {
                    ...prev,
                    polls: [{ ...newPoll, id: docRef.id, _id: docRef.id }, ...(prev.polls || [])]
                };
            });

            // Post notification message in chat
            const newMsg = {
                userId: state.user.id,
                userName: state.user.name,
                text: `📊 Created a new group poll: "${groupPollQuestion.trim()}". Vote now in the Polls tab!`,
                time: Date.now()
            };
            const newMessages = [...(currentGroup.messages || []), newMsg];
            await updateDoc(doc(db, "groups", currentGroup.id), { messages: newMessages });

            setGroupPollQuestion('');
            setGroupPollOptions(['', '']);
            setIsGroupPollModalOpen(false);
            setActiveTab('polls');
        } catch(err) {
            console.error("Create group poll error:", err);
            setGroupPollError("Failed to create poll: " + err.message);
        } finally {
            setIsPollLoading(false);
            isPollSubmittingRef.current = false;
        }
    };

    const handleGroupPollVote = async (pollId, optionId) => {
        const userId = String(state.user?.id || '');
        if (!userId) return;

        const poll = (state.polls || []).find(p => String(p.id) === String(pollId) || String(p._id) === String(pollId));
        if (!poll) return;

        const savedOption = localStorage.getItem(`poll_vote_${pollId}_${userId}`) || 
                            (poll.id ? localStorage.getItem(`poll_vote_${poll.id}_${userId}`) : null);

        const currentVotedOptionId = poll.userVotes?.[userId] !== undefined 
            ? Number(poll.userVotes[userId]) 
            : (savedOption ? Number(savedOption) : null);

        // Strict rule: Once voted, user CANNOT switch their vote!
        if (currentVotedOptionId !== null) return;
        if (!window.confirm("Confirm your vote? Votes cannot be changed once submitted.")) return;

        const updatedOptions = (poll.options || []).map((opt, idx) => {
            const optId = opt.id ?? (idx + 1);
            let votes = opt.votes || 0;
            if (Number(optId) === Number(optionId)) {
                votes = votes + 1;
            }
            return { ...opt, id: optId, votes };
        });

        const updatedVotedBy = (poll.votedBy || []).some(id => String(id) === userId)
            ? (poll.votedBy || [])
            : [...(poll.votedBy || []), userId];

        const updatedUserVotes = {
            ...(poll.userVotes || {}),
            [userId]: Number(optionId)
        };

        try {
            localStorage.setItem(`poll_vote_${pollId}_${userId}`, String(optionId));
            if (poll.id) localStorage.setItem(`poll_vote_${poll.id}_${userId}`, String(optionId));
        } catch (e) {}

        setState(prev => ({
            ...prev,
            polls: (prev.polls || []).map(p => {
                if (String(p.id) === String(pollId) || String(p._id) === String(pollId)) {
                    return {
                        ...p,
                        options: updatedOptions,
                        votedBy: updatedVotedBy,
                        userVotes: updatedUserVotes
                    };
                }
                return p;
            })
        }));

        try {
            await updateDoc(doc(db, "polls", String(poll.id || poll._id || pollId)), {
                options: updatedOptions,
                votedBy: updatedVotedBy,
                userVotes: updatedUserVotes
            });
        } catch (err) {
            console.warn("Vote sync warning:", err);
        }
    };

    const formatTime = (t) => {
        if (!t) return '';
        if (typeof t === 'string' && (t.includes(':') && (t.includes('AM') || t.includes('PM')))) return t;
        const d = new Date(t);
        return isNaN(d.getTime()) ? String(t) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Detailed Group Chat Screen
    if (groupId && currentGroup) {
        const isGlobalAdmin = state.user?.role === 'admin';
        const membersList = currentGroup.members || [];
        const memberSelf = membersList.find(m => String(m.id) === String(state.user.id));
        const isGroupAdmin = isGlobalAdmin || memberSelf?.roleInGroup === 'admin' || memberSelf?.roleInGroup === 'co-admin';
        const isMember = !!memberSelf || isGlobalAdmin;

        if (!isMember) {
            const hasRequested = (currentGroup.requests || []).some(r => r.id === state.user.id);
            return (
                <div className="text-center p-8 glass-panel" style={{ maxWidth: '500px', margin: '2rem auto' }}>
                    <h1 style={{ color: 'var(--danger)' }}>Private Group</h1>
                    <p>Access restricted to <strong>{currentGroup.name}</strong> members.</p>
                    
                    {hasRequested ? (
                        <div className="p-3 bg-main rounded-lg border mt-4">
                            <span className="badge badge-success" style={{ fontSize: '0.9rem' }}>⏳ Request Pending</span>
                            <p className="mt-2 text-sm mb-0">Your join request has been sent to the group admins.</p>
                        </div>
                    ) : (
                        <button className="btn btn-primary mt-6 w-100" style={{ padding: '0.8rem', fontSize: '1rem', fontWeight: 700 }} onClick={handleRequestJoin}>
                            🙋‍♂️ Request to Join
                        </button>
                    )}
                    
                    <button className="btn btn-outline mt-3 w-100" onClick={() => navigate('/groups')}>← Back to Communities</button>
                </div>
            );
        }

        const messagesList = currentGroup.messages || [];
        
        // Deduplicate group polls by ID and content to prevent twin polls
        const seenGroupPollKeys = new Set();
        const groupPolls = (state.polls || []).filter(p => {
            if (String(p.groupId) !== String(currentGroup.id)) return false;
            
            const idKey = String(p.id || p._id);
            if (seenGroupPollKeys.has(idKey)) return false;
            seenGroupPollKeys.add(idKey);

            const contentKey = `content_${(p.question || '').trim().toLowerCase()}`;
            if (seenGroupPollKeys.has(contentKey)) return false;
            seenGroupPollKeys.add(contentKey);

            return true;
        });

        return (
            <div className="group-details">
                {/* Group Header */}
                <div className="dashboard-header" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate('/groups')} style={{ borderRadius: 'var(--radius-sm)' }}>
                            ← Back
                        </button>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.6rem)' }}>{currentGroup.name}</h2>
                            <small className="text-secondary">{membersList.length} members {currentGroup.isMuted && '• 🔇 Muted'}</small>
                        </div>
                    </div>
                    <div className="header-actions">
                        {isGroupAdmin && (
                            <button className="btn btn-xs btn-primary" onClick={() => setIsGroupPollModalOpen(true)}>
                                + New Poll
                            </button>
                        )}
                        {isGroupAdmin && (
                            <button className={`btn btn-xs ${currentGroup.isMuted ? 'btn-success' : 'btn-outline'}`} onClick={toggleGroupMute}>
                                {currentGroup.isMuted ? '🔊 Unmute' : '🔇 Mute'}
                            </button>
                        )}
                        {isGlobalAdmin && (
                            <button className="btn btn-xs btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={async () => { 
                                if (window.confirm('Delete this community group?')) { 
                                    try { 
                                        await deleteDoc(doc(db, "groups", currentGroup.id)); 
                                        navigate('/groups'); 
                                    } catch(e){} 
                                } 
                            }}>
                                🗑️ Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile / Desktop View Tab Switcher (Chat vs Polls vs Members) */}
                <div className="flex gap-2 mb-4" style={{ display: 'flex' }}>
                    <button 
                        className={`btn btn-sm ${activeTab === 'chat' ? 'btn-primary' : 'btn-outline'}`} 
                        onClick={() => setActiveTab('chat')}
                        style={{ flex: 1 }}
                    >
                        💬 Chat ({messagesList.length})
                    </button>
                    <button 
                        className={`btn btn-sm ${activeTab === 'polls' ? 'btn-primary' : 'btn-outline'}`} 
                        onClick={() => setActiveTab('polls')}
                        style={{ flex: 1 }}
                    >
                        📊 Polls ({groupPolls.length})
                    </button>
                    <button 
                        className={`btn btn-sm ${activeTab === 'members' ? 'btn-primary' : 'btn-outline'}`} 
                        onClick={() => setActiveTab('members')}
                        style={{ flex: 1 }}
                    >
                        👥 Members ({membersList.length}) {(currentGroup.requests || []).length > 0 && `• ${(currentGroup.requests || []).length} req`}
                    </button>
                </div>

                {/* Main Content Area */}
                {activeTab === 'chat' ? (
                    <div className="glass-panel flex flex-col" style={{ height: 'calc(100vh - 270px)', minHeight: '400px', padding: '1.25rem' }}>
                        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', padding: '0.5rem' }}>
                            {messagesList.length === 0 ? (
                                <p className="text-secondary text-center py-12">No messages yet. Say hello to the community!</p>
                            ) : (
                                messagesList.map((msg, i) => (
                                    <div key={i} className="mb-3" style={{ 
                                        borderLeft: msg.userId === state.user.id ? '3px solid var(--primary)' : '3px solid transparent', 
                                        paddingLeft: '0.75rem',
                                        background: msg.userId === state.user.id ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                                        borderRadius: '0 8px 8px 0',
                                        padding: '0.4rem 0.75rem'
                                    }}>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <strong 
                                                className="clickable-user-name" 
                                                style={{ fontSize: '0.85rem', color: msg.userId === state.user.id ? 'var(--primary)' : 'inherit' }} 
                                                onClick={() => openUserProfile({ id: msg.userId, name: msg.userName })}
                                                title="Click to view contact profile & phone number"
                                            >
                                                {msg.userId === state.user.id ? 'You' : msg.userName} 👤
                                            </strong>
                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{formatTime(msg.time)}</span>
                                        </div>
                                        <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.45', wordBreak: 'break-word' }}>{msg.text}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        {(!currentGroup.isMuted || isGroupAdmin) ? (
                            <form onSubmit={handleSendMessage} className="flex gap-2" style={{ marginTop: 'auto' }}>
                                <input type="text" className="form-control" placeholder="Type your message..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                                {isGroupAdmin && (
                                    <button 
                                        type="button" 
                                        className="btn btn-outline" 
                                        onClick={() => setIsGroupPollModalOpen(true)}
                                        title="Create a poll in this chat"
                                        style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                    >
                                        📊 Poll
                                    </button>
                                )}
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Send</button>
                            </form>
                        ) : (
                            <div className="text-center p-3 text-secondary" style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '8px', fontSize: '0.85rem' }}>
                                🔇 Chat is muted by group coordinators.
                            </div>
                        )}
                    </div>
                ) : activeTab === 'polls' ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Polls for <strong>{currentGroup.name}</strong> members only
                            </p>
                            {isGroupAdmin && (
                                <button className="btn btn-primary btn-sm" onClick={() => setIsGroupPollModalOpen(true)}>
                                    + Create Poll
                                </button>
                            )}
                        </div>

                        {groupPolls.length === 0 ? (
                            <div className="glass-panel text-center" style={{ padding: '3.5rem 1.5rem' }}>
                                <p className="text-secondary" style={{ margin: 0 }}>No polls created in this chat yet.</p>
                                {isGroupAdmin && (
                                    <button className="btn btn-outline btn-sm mt-3" onClick={() => setIsGroupPollModalOpen(true)}>
                                        + Launch First Poll
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {groupPolls.map(p => {
                                    const totalVotes = (p.options || []).reduce((sum, opt) => sum + (opt.votes || 0), 0);
                                    const userId = String(state.user?.id || '');
                                    const savedVote = userId ? localStorage.getItem(`poll_vote_${p.id}_${userId}`) : null;
                                    const userVotedOptionId = p.userVotes?.[userId] !== undefined ? Number(p.userVotes[userId]) : (savedVote ? Number(savedVote) : null);
                                    const userVoted = (p.votedBy || []).some(id => String(id) === userId) || userVotedOptionId !== null;

                                    return (
                                        <div 
                                            key={p.id}
                                            className="glass-panel"
                                            style={{
                                                padding: '1.25rem',
                                                borderRadius: 'var(--radius-md, 10px)',
                                                border: userVoted ? '1px solid rgba(37, 99, 235, 0.35)' : '1px solid var(--border)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{p.question}</h4>
                                                </div>
                                                <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: userVoted ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                                    {userVoted ? '✓ Vote submitted' : 'Select an option to vote'}
                                                </p>

                                                <div className="flex flex-col gap-2">
                                                    {(p.options || []).map((opt, idx) => {
                                                        const optId = opt.id ?? (idx + 1);
                                                        const percentage = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                                                        const isMyChoice = userVotedOptionId !== null && Number(userVotedOptionId) === Number(optId);

                                                        return (
                                                            <div
                                                                key={optId}
                                                                onClick={() => !userVoted && handleGroupPollVote(p.id, optId)}
                                                                style={{
                                                                    cursor: userVoted ? 'default' : 'pointer',
                                                                    padding: '0.65rem 0.85rem',
                                                                    borderRadius: '8px',
                                                                    background: isMyChoice ? 'rgba(37, 99, 235, 0.06)' : 'rgba(0,0,0,0.02)',
                                                                    border: isMyChoice ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                                                                    transition: 'all 0.15s ease',
                                                                    userSelect: 'none'
                                                                }}
                                                            >
                                                                <div className="flex items-center justify-between mb-1.5" style={{ fontSize: '0.85rem' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                        <div style={{ 
                                                                            width: '14px', 
                                                                            height: '14px', 
                                                                            borderRadius: '50%', 
                                                                            border: isMyChoice ? '1.5px solid var(--primary)' : '1.5px solid var(--border)', 
                                                                            display: 'flex', 
                                                                            alignItems: 'center', 
                                                                            justifyContent: 'center',
                                                                            flexShrink: 0
                                                                        }}>
                                                                            {isMyChoice && (
                                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                                                                            )}
                                                                        </div>
                                                                        <span style={{ fontWeight: isMyChoice ? 700 : 500, color: isMyChoice ? 'var(--primary)' : 'inherit' }}>
                                                                            {opt.text}
                                                                        </span>
                                                                        {isMyChoice && (
                                                                            <span style={{ 
                                                                                fontSize: '0.65rem', 
                                                                                fontWeight: 700, 
                                                                                padding: '0.1rem 0.4rem', 
                                                                                borderRadius: '4px', 
                                                                                background: 'rgba(37, 99, 235, 0.12)', 
                                                                                color: 'var(--primary)' 
                                                                            }}>
                                                                                You
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isMyChoice ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                                                        {percentage}%
                                                                    </span>
                                                                </div>

                                                                <div style={{ height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                                                    <div style={{ 
                                                                        width: `${percentage}%`, 
                                                                        height: '100%', 
                                                                        background: isMyChoice ? 'var(--primary)' : '#94a3b8', 
                                                                        transition: 'width 0.4s ease',
                                                                        borderRadius: '2px'
                                                                    }} />
                                                                </div>

                                                                {userVoted && (
                                                                    <div style={{ marginTop: '0.25rem', textAlign: 'right' }}>
                                                                        <small className="text-secondary" style={{ fontSize: '0.68rem' }}>
                                                                            {opt.votes || 0} {opt.votes === 1 ? 'vote' : 'votes'}
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-3 mt-3 border-top" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                                                {isGroupAdmin && (
                                                    <button 
                                                        className="btn btn-xs btn-outline" 
                                                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.15rem 0.5rem', fontSize: '0.7rem' }} 
                                                        onClick={async () => {
                                                            if (!window.confirm("Delete this poll?")) return;
                                                            setState(prev => ({ ...prev, polls: (prev.polls || []).filter(item => String(item.id) !== String(p.id)) }));
                                                            try { await deleteDoc(doc(db, "polls", String(p.id))); } catch(e){}
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Community Members ({membersList.length})</h3>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {membersList.map(m => (
                                    <div key={m.id} className="flex items-center justify-between mb-3 pb-3 border-bottom flex-wrap gap-2">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="avatar" 
                                                style={{ width: '34px', height: '34px', fontSize: '0.8rem', cursor: 'pointer' }} 
                                                onClick={() => openUserProfile({ id: m.id, name: m.name, email: m.email })}
                                                title="Click to view contact profile & phone number"
                                            >
                                                {m.name ? m.name.charAt(0) : 'U'}
                                            </div>
                                            <div>
                                                <div 
                                                    className="clickable-user-name"
                                                    style={{ fontWeight: 800, fontSize: '0.88rem' }}
                                                    onClick={() => openUserProfile({ id: m.id, name: m.name, email: m.email })}
                                                    title="Click to view contact profile & phone number"
                                                >
                                                    {m.name} 👤
                                                    {m.roleInGroup === 'admin' && <span className="badge badge-admin" style={{ marginLeft: '6px', fontSize: '0.6rem' }}>Admin</span>} 
                                                    {m.roleInGroup === 'co-admin' && <span className="badge badge-primary" style={{ marginLeft: '6px', fontSize: '0.6rem' }}>Co-Admin</span>}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.email}</div>
                                            </div>
                                        </div>
                                        {isGroupAdmin && m.id !== state.user.id && m.roleInGroup !== 'admin' && (
                                            <div className="flex gap-1">
                                                <button className="btn btn-xs btn-outline" onClick={() => handleMemberAction(m.id, m.roleInGroup === 'co-admin' ? 'demote' : 'promote')}>
                                                    {m.roleInGroup === 'co-admin' ? 'Demote ⬇' : 'Promote ⬆'}
                                                </button>
                                                <button className="btn btn-xs btn-outline text-danger" onClick={() => handleMemberAction(m.id, 'remove')}>
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {isGroupAdmin && (currentGroup.requests || []).length > 0 && (
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                                    Pending Requests ({(currentGroup.requests || []).length})
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {(currentGroup.requests || []).map(req => (
                                        <div key={req.id} className="flex items-center justify-between pb-3 border-bottom flex-wrap gap-2">
                                            <div>
                                                <strong 
                                                    className="clickable-user-name"
                                                    onClick={() => openUserProfile({ id: req.id, name: req.name, email: req.email })}
                                                    title="Click to view contact profile & phone number"
                                                >
                                                    {req.name} 👤
                                                </strong>
                                                <small className="text-secondary" style={{ display: 'block' }}>{req.email}</small>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="btn btn-xs btn-success" onClick={() => handleRequestAction(req, 'accept')}>✓ Accept</button>
                                                <button className="btn btn-xs btn-danger" onClick={() => handleRequestAction(req, 'reject')}>✕ Reject</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Group Poll Modal */}
                {isGroupPollModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsGroupPollModalOpen(false)}>
                        <div className="glass-panel modal-content-panel" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Poll for {currentGroup.name}</h2>
                                <button className="btn btn-sm btn-outline" onClick={() => setIsGroupPollModalOpen(false)}>✕</button>
                            </div>
                            {groupPollError && <div className="p-3 mb-3 bg-danger text-white rounded font-bold" style={{ fontSize: '0.85rem' }}>{groupPollError}</div>}
                            <form onSubmit={handleCreateGroupPoll} className="flex flex-col gap-3">
                                <div className="form-group">
                                    <label>Question *</label>
                                    <input type="text" className="form-control" placeholder="e.g. When should we meet?" value={groupPollQuestion} onChange={e => setGroupPollQuestion(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Options *</label>
                                    {groupPollOptions.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2 mb-2">
                                            <input type="text" className="form-control" value={opt} onChange={e => {
                                                const next = [...groupPollOptions];
                                                next[idx] = e.target.value;
                                                setGroupPollOptions(next);
                                            }} placeholder={`Option ${idx + 1}`} required={idx < 2} />
                                            {groupPollOptions.length > 2 && (
                                                <button type="button" className="btn btn-sm btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setGroupPollOptions(groupPollOptions.filter((_, i) => i !== idx))}>✕</button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" className="btn btn-xs btn-outline mt-1" onClick={() => setGroupPollOptions([...groupPollOptions, ''])}>+ Add Option</button>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button type="submit" className="btn btn-primary" disabled={isPollLoading} style={{ flex: 1 }}>
                                        {isPollLoading ? 'Publishing...' : 'Publish to Chat'}
                                    </button>
                                    <button type="button" className="btn btn-outline" onClick={() => setIsGroupPollModalOpen(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Categorize groups for the current user
    const memberGroups = roomGroups.filter(g => 
        (g.members || []).some(m => String(m.id) === String(state.user?.id)) || state.user?.role === 'admin'
    );
    const requestedGroups = roomGroups.filter(g => 
        !(g.members || []).some(m => String(m.id) === String(state.user?.id)) && 
        (g.requests || []).some(r => String(r.id) === String(state.user?.id))
    );
    const discoverGroups = roomGroups.filter(g => 
        !(g.members || []).some(m => String(m.id) === String(state.user?.id)) && 
        !(g.requests || []).some(r => String(r.id) === String(state.user?.id))
    );

    // Filter by active tab
    let filteredGroups = roomGroups;
    if (groupFilter === 'joined') {
        filteredGroups = memberGroups;
    } else if (groupFilter === 'requested') {
        filteredGroups = requestedGroups;
    } else if (groupFilter === 'discover') {
        filteredGroups = discoverGroups;
    }

    // Filter by search query
    if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        filteredGroups = filteredGroups.filter(g => 
            (g.name || '').toLowerCase().includes(query) || 
            (g.description || '').toLowerCase().includes(query)
        );
    }

    // Communities List View
    return (
        <div className="groups-page">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ marginBottom: '0.35rem' }}>Communities</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        Room Circles & Groups for <strong>{state.user?.roomId}</strong>
                    </p>
                </div>
                {state.user?.role === 'admin' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setIsCreateModalOpen(true)}>
                        + Launch New Group
                    </button>
                )}
            </div>

            {/* Create Group Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="glass-panel modal-content-panel" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 style={{ margin: 0 }}>Launch New Group</h2>
                            <button className="btn btn-sm btn-outline" onClick={() => setIsCreateModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
                            <div className="form-group">
                                <label>Group / Circle Name *</label>
                                <input type="text" className="form-control" placeholder="e.g. Robotics Club, Cultural Team" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-control" rows="3" placeholder="What is this community for?" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Start Group</button>
                                <button type="button" className="btn btn-outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Filter Tabs & Search */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <div className="flex gap-2 flex-wrap items-center">
                    <button 
                        type="button" 
                        className={`btn btn-sm ${groupFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setGroupFilter('all')}
                        style={{ borderRadius: '999px', padding: '0.45rem 1rem', fontWeight: 700 }}
                    >
                        All ({roomGroups.length})
                    </button>
                    
                    <button 
                        type="button" 
                        className={`btn btn-sm ${groupFilter === 'joined' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setGroupFilter('joined')}
                        style={{ borderRadius: '999px', padding: '0.45rem 1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                    >
                        <span>✓ My Groups</span>
                        <span style={{ 
                            background: groupFilter === 'joined' ? 'rgba(255,255,255,0.25)' : 'var(--primary)', 
                            color: '#fff', 
                            borderRadius: '999px', 
                            padding: '0.05rem 0.45rem', 
                            fontSize: '0.72rem' 
                        }}>
                            {memberGroups.length}
                        </span>
                    </button>

                    <button 
                        type="button" 
                        className={`btn btn-sm ${groupFilter === 'requested' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setGroupFilter('requested')}
                        style={{ borderRadius: '999px', padding: '0.45rem 1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                    >
                        <span>⏳ Requested</span>
                        {requestedGroups.length > 0 && (
                            <span style={{ 
                                background: groupFilter === 'requested' ? 'rgba(255,255,255,0.3)' : 'var(--accent, #f59e0b)', 
                                color: '#fff', 
                                borderRadius: '999px', 
                                padding: '0.05rem 0.45rem', 
                                fontSize: '0.72rem',
                                fontWeight: 800
                            }}>
                                {requestedGroups.length}
                            </span>
                        )}
                    </button>

                    <button 
                        type="button" 
                        className={`btn btn-sm ${groupFilter === 'discover' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setGroupFilter('discover')}
                        style={{ borderRadius: '999px', padding: '0.45rem 1rem', fontWeight: 700 }}
                    >
                        🔍 Discover ({discoverGroups.length})
                    </button>
                </div>

                <div style={{ minWidth: '220px', flex: '1', maxWidth: '300px' }}>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search groups..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.88rem' }}
                    />
                </div>
            </div>

            {/* Groups Grid */}
            <div className="grid-cards">
                {filteredGroups.length === 0 ? (
                    <div className="glass-panel text-center" style={{ padding: '3.5rem 1.5rem', gridColumn: '1 / -1' }}>
                        {groupFilter === 'joined' ? (
                            <div>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👥</div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>No Joined Groups Yet</h3>
                                <p className="text-secondary" style={{ marginBottom: '1.25rem' }}>
                                    You are not an active member of any groups in this room.
                                </p>
                                <button className="btn btn-primary btn-sm" onClick={() => setGroupFilter('discover')}>
                                    Browse Available Groups →
                                </button>
                            </div>
                        ) : groupFilter === 'requested' ? (
                            <div>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏳</div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>No Pending Requests</h3>
                                <p className="text-secondary" style={{ margin: 0 }}>
                                    You have not requested to join any groups in this room.
                                </p>
                            </div>
                        ) : groupFilter === 'discover' ? (
                            <div>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>All Caught Up!</h3>
                                <p className="text-secondary" style={{ margin: 0 }}>
                                    You have already joined or requested to join all available communities in this room.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-secondary" style={{ margin: 0 }}>No matching community groups found.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    filteredGroups.map(g => {
                        const isMember = (g.members || []).some(m => String(m.id) === String(state.user.id)) || state.user?.role === 'admin';
                        const hasRequested = !isMember && (g.requests || []).some(r => String(r.id) === String(state.user.id));
                        const memberInfo = (g.members || []).find(m => String(m.id) === String(state.user?.id));
                        
                        return (
                            <div 
                                key={g.id} 
                                className="glass-panel group-card" 
                                onClick={() => isMember && navigate(`/groups/${g.id}`)} 
                                style={{ 
                                    cursor: isMember ? 'pointer' : 'default',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    border: isMember 
                                        ? '1.5px solid rgba(34, 197, 94, 0.4)' 
                                        : hasRequested 
                                            ? '1.5px solid rgba(245, 158, 11, 0.45)' 
                                            : '1px solid var(--border)'
                                }}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{g.name}</h3>
                                        {isMember && (
                                            <span className="badge badge-success" style={{ fontSize: '0.68rem', flexShrink: 0 }}>
                                                {memberInfo?.roleInGroup === 'admin' ? '👑 Admin' : memberInfo?.roleInGroup === 'co-admin' ? '⭐ Co-Admin' : '✓ Member'}
                                            </span>
                                        )}
                                        {hasRequested && (
                                            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.68rem', flexShrink: 0 }}>
                                                ⏳ Requested
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-truncate" style={{ minHeight: '2.8rem', fontSize: '0.88rem' }}>
                                        {g.description || 'Community circle for event discussions.'}
                                    </p>
                                </div>
                                
                                <div className="mt-4 pt-3 border-top flex justify-between items-center">
                                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                                        {(g.members || []).length} Members
                                    </span>
                                    
                                    {!isMember && state.user?.role === 'student' && (
                                        hasRequested ? (
                                            <div className="flex gap-1.5 items-center">
                                                <button className="btn btn-xs btn-outline disabled" disabled style={{ opacity: 0.8 }}>
                                                    ⏳ Pending
                                                </button>
                                                <button 
                                                    className="btn btn-xs btn-outline" 
                                                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.7rem' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancelRequest(g);
                                                    }}
                                                    title="Cancel join request"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                className="btn btn-xs btn-primary" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDirectJoin(g);
                                                }}
                                            >
                                                Join Group
                                            </button>
                                        )
                                    )}
                                    
                                    {isMember && (
                                        <button className="btn btn-xs btn-outline" onClick={() => navigate(`/groups/${g.id}`)}>
                                            Enter Chat →
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Groups;
