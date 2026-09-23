import React, { useState, useRef } from 'react';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const Polls = () => {
    const { state, setState } = useAppState();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const isSubmittingRef = useRef(false);

    const roomGroups = (state.groups || []).filter(g => g.roomId === state.user?.roomId);
    
    // Deduplicate polls by ID and content, strictly excluding chat/group polls from public section
    const seenPollKeys = new Set();
    const roomPolls = (state.polls || []).filter(p => {
        if ((p.roomId || p.room_id) !== state.user?.roomId) return false;
        // Strictly exclude chat/community polls from the public poll section!
        if (p.groupId) return false;
        
        const idKey = String(p.id || p._id);
        if (seenPollKeys.has(idKey)) return false;
        seenPollKeys.add(idKey);

        // Deduplicate twin identical polls created simultaneously
        const contentKey = `content_public_${(p.question || '').trim().toLowerCase()}`;
        if (seenPollKeys.has(contentKey)) return false;
        seenPollKeys.add(contentKey);

        return true;
    });

    const handleAddOption = () => setOptions([...options, '']);
    const handleRemoveOption = (idx) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, i) => i !== idx));
    };
    const handleOptionChange = (idx, val) => {
        const newOpts = [...options];
        newOpts[idx] = val;
        setOptions(newOpts);
    };

    const handleSavePoll = async (e) => {
        e.preventDefault();
        if (isSubmittingRef.current || loading) return;
        isSubmittingRef.current = true;
        setLoading(true);
        setError('');

        const filteredOpts = options.filter(opt => opt.trim());
        if (!question.trim() || filteredOpts.length < 2) {
            setError("Please provide a question and at least 2 options!");
            setLoading(false);
            isSubmittingRef.current = false;
            return;
        }

        const trimmedQ = question.trim().toLowerCase();

        // Duplicate prevention: check if identical public poll was just created in the last 15 seconds
        const isDuplicate = (state.polls || []).some(p => 
            (p.roomId === state.user?.roomId) &&
            !p.groupId &&
            (p.question || '').trim().toLowerCase() === trimmedQ &&
            p.createdAt && (Date.now() - p.createdAt < 15000)
        );

        if (isDuplicate) {
            setIsModalOpen(false);
            setQuestion(''); setOptions(['', '']);
            setLoading(false);
            isSubmittingRef.current = false;
            return;
        }

        const newPoll = {
            roomId: state.user?.roomId || '',
            groupId: null,
            groupName: null,
            question: question.trim(),
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
            setQuestion(''); setOptions(['', '']); setIsModalOpen(false);
        } catch(e) { 
            console.error("Poll creation failed:", e);
            setError(`Failed to create poll: ${e.message}`);
        } finally {
            setLoading(false);
            isSubmittingRef.current = false;
        }
    };

    const handleVote = async (pollId, optionId) => {
        const userId = String(state.user?.id || '');
        if (!userId) {
            alert("Please log in to vote on polls.");
            return;
        }

        const poll = (state.polls || []).find(p => String(p.id) === String(pollId) || String(p._id) === String(pollId));
        if (!poll) return;

        // Restriction: Only members of this specific chat can vote!
        if (poll.groupId) {
            const targetGroup = (state.groups || []).find(g => String(g.id) === String(poll.groupId));
            const isMember = (targetGroup?.members || []).some(m => String(m.id) === userId) || state.user?.role === 'admin';
            if (!isMember) {
                alert(`Access restricted: Only members of "${targetGroup?.name || poll.groupName || 'this chat'}" can vote in this poll.`);
                return;
            }
        }

        const savedOption = localStorage.getItem(`poll_vote_${pollId}_${userId}`) || 
                            (poll.id ? localStorage.getItem(`poll_vote_${poll.id}_${userId}`) : null) ||
                            (poll._id ? localStorage.getItem(`poll_vote_${poll._id}_${userId}`) : null);

        const currentVotedOptionId = poll.userVotes?.[userId] !== undefined 
            ? Number(poll.userVotes[userId]) 
            : (savedOption ? Number(savedOption) : null);

        // Strict rule: Once voted, user CANNOT switch their vote!
        if (currentVotedOptionId !== null) {
            return;
        }

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

        // 1. Immediately save to localStorage
        try {
            localStorage.setItem(`poll_vote_${pollId}_${userId}`, String(optionId));
            if (poll.id) localStorage.setItem(`poll_vote_${poll.id}_${userId}`, String(optionId));
            if (poll._id) localStorage.setItem(`poll_vote_${poll._id}_${userId}`, String(optionId));
        } catch (e) {
            // ignore
        }

        // 2. Immediately update state so UI changes with 0 delay
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

        // 3. Sync to Firestore in background
        try {
            await updateDoc(doc(db, "polls", String(poll.id || poll._id || pollId)), {
                options: updatedOptions,
                votedBy: updatedVotedBy,
                userVotes: updatedUserVotes
            });
        } catch(e) { 
            console.warn("Cloud vote sync warning (local state preserved):", e); 
        }
    };

    const handleDeletePoll = async (id) => {
        if (!window.confirm("Are you sure you want to delete this poll?")) return;
        setState(prev => ({
            ...prev,
            polls: (prev.polls || []).filter(p => String(p.id) !== String(id) && String(p._id) !== String(id))
        }));
        try {
            await deleteDoc(doc(db, "polls", String(id)));
        } catch(e) { console.error("Deleting failed:", e); }
    };

    return (
        <div className="polls-page">
            <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.2rem', fontSize: '1.5rem' }}>Polls</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Room: {state.user?.roomId}
                    </p>
                </div>
                {state.user?.role === 'admin' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                        + New Poll
                    </button>
                )}
            </div>

            {/* Create Poll Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="glass-panel modal-content-panel" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Create Poll</h2>
                            <button className="btn btn-sm btn-outline" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        {error && <div className="p-3 mb-3 bg-danger text-white rounded font-bold" style={{ fontSize: '0.85rem' }}>{error}</div>}
                        <form onSubmit={handleSavePoll} className="flex flex-col gap-3">
                            <div className="form-group">
                                <label>Question *</label>
                                <input type="text" className="form-control" placeholder="e.g. Which keynote topic do you prefer?" value={question} onChange={e => setQuestion(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Options *</label>
                                {options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <input type="text" className="form-control" value={opt} onChange={e => handleOptionChange(idx, e.target.value)} placeholder={`Option ${idx + 1}`} required={idx < 2} />
                                        {options.length > 2 && (
                                            <button type="button" className="btn btn-sm btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleRemoveOption(idx)}>✕</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="btn btn-xs btn-outline mt-1" onClick={handleAddOption}>+ Add Option</button>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                                    {loading ? 'Publishing...' : 'Publish'}
                                </button>
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Polls Grid */}
            <div className="grid-cards">
                {roomPolls.length === 0 ? (
                    <div className="glass-panel text-center" style={{ padding: '3rem 1.5rem' }}>
                        <p className="text-secondary" style={{ margin: 0 }}>No active polls found in this room.</p>
                    </div>
                ) : (
                    roomPolls.slice().reverse().map(p => {
                        const totalVotes = (p.options || []).reduce((sum, opt) => sum + (opt.votes || 0), 0);
                        const userId = String(state.user?.id || '');
                        const savedVote = userId 
                            ? (localStorage.getItem(`poll_vote_${p.id}_${userId}`) || 
                               (p._id ? localStorage.getItem(`poll_vote_${p._id}_${userId}`) : null))
                            : null;

                        let userVotedOptionId = null;
                        if (userId && p.userVotes && p.userVotes[userId] !== undefined) {
                            userVotedOptionId = Number(p.userVotes[userId]);
                        } else if (savedVote) {
                            userVotedOptionId = Number(savedVote);
                        }

                        const userVoted = (p.votedBy || []).some(id => String(id) === userId) || userVotedOptionId !== null;
                        
                        return (
                            <div 
                                key={p.id} 
                                className="glass-panel poll-card" 
                                style={{ 
                                    padding: '1.25rem 1.35rem', 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    borderRadius: 'var(--radius-md, 10px)',
                                    border: userVoted ? '1px solid rgba(37, 99, 235, 0.35)' : '1px solid var(--border)'
                                }}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{p.question}</h3>
                                    </div>
                                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: userVoted ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                        {userVoted ? '✓ Vote submitted' : 'Select an option to vote'}
                                    </p>
                                    
                                    <div className="poll-options flex flex-col gap-2">
                                        {(p.options || []).map((opt, idx) => {
                                            const optId = opt.id ?? (idx + 1);
                                            const percentage = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                                            const isMyChoice = userVotedOptionId !== null && Number(userVotedOptionId) === Number(optId);

                                            return (
                                                <div 
                                                    key={optId} 
                                                    onClick={() => !userVoted && handleVote(p.id, optId)} 
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
                                                            {/* Minimal clean radio dot */}
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
                                                    
                                                    {/* Minimal progress bar */}
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
                                    {state.user?.role === 'admin' && (
                                        <button className="btn btn-xs btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.15rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleDeletePoll(p.id)}>
                                            Delete
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

export default Polls;
