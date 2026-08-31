import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const Groups = () => {
    const { state, setState } = useAppState();
    const { groupId: routeGroupId } = useParams();
    const navigate = useNavigate();
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [inspectedUser, setInspectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'members'
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

                {/* Mobile View Tab Switcher (Chat vs Members) */}
                <div className="flex gap-2 mb-4" style={{ display: 'flex' }}>
                    <button 
                        className={`btn btn-sm ${activeTab === 'chat' ? 'btn-primary' : 'btn-outline'}`} 
                        onClick={() => setActiveTab('chat')}
                        style={{ flex: 1 }}
                    >
                        💬 Messages ({messagesList.length})
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
                                            <strong style={{ fontSize: '0.85rem', color: msg.userId === state.user.id ? 'var(--primary)' : 'inherit', cursor: (isGlobalAdmin && msg.userId !== state.user.id) ? 'pointer' : 'default' }} 
                                                     onClick={() => isGlobalAdmin && msg.userId !== state.user.id && setInspectedUser((state.users || []).find(u => u.id === msg.userId))}>
                                                {msg.userId === state.user.id ? 'You' : msg.userName} {(isGlobalAdmin && msg.userId !== state.user.id) && '🔍'}
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
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Send</button>
                            </form>
                        ) : (
                            <div className="text-center p-3 text-secondary" style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '8px', fontSize: '0.85rem' }}>
                                🔇 Chat is muted by group coordinators.
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
                                            <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '0.8rem', cursor: (isGlobalAdmin && m.id !== state.user.id) ? 'pointer' : 'default' }} onClick={() => isGlobalAdmin && m.id !== state.user.id && setInspectedUser((state.users || []).find(u => u.id === m.id))}>
                                                {m.name ? m.name.charAt(0) : 'U'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                                                    {m.name} 
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
                                                <strong>{req.name}</strong>
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

                {/* Inspect User Profile Modal */}
                {inspectedUser && (
                    <div className="modal-overlay" onClick={() => setInspectedUser(null)}>
                        <div className="glass-panel modal-content-panel" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                            <div className="text-center">
                                <div className="avatar mx-auto mb-4" style={{ width: '70px', height: '70px', fontSize: '1.8rem' }}>
                                    {inspectedUser.name ? inspectedUser.name.charAt(0) : 'U'}
                                </div>
                                <h2 style={{ marginBottom: '0.25rem' }}>{inspectedUser.name}</h2>
                                <span className="badge badge-primary">{inspectedUser.role ? inspectedUser.role.toUpperCase() : 'STUDENT'}</span>
                                <div className="text-left mt-6 flex flex-col gap-2" style={{ fontSize: '0.9rem' }}>
                                    <div><strong>Email:</strong> {inspectedUser.email}</div>
                                    <div><strong>Academic:</strong> {inspectedUser.branch || 'N/A'} - {inspectedUser.year || 'N/A'}</div>
                                </div>
                                <button className="btn btn-primary w-100 mt-6" onClick={() => setInspectedUser(null)}>Dismiss</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
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

            {/* Groups Grid */}
            <div className="grid-cards">
                {roomGroups.length === 0 ? (
                    <div className="glass-panel text-center" style={{ padding: '3rem 1.5rem' }}>
                        <p className="text-secondary" style={{ margin: 0 }}>No community groups created in this room yet.</p>
                    </div>
                ) : (
                    roomGroups.map(g => {
                        const isMember = (g.members || []).some(m => String(m.id) === String(state.user.id)) || state.user?.role === 'admin';
                        const hasRequested = (g.requests || []).some(r => String(r.id) === String(state.user.id));
                        
                        return (
                            <div 
                                key={g.id} 
                                className="glass-panel group-card" 
                                onClick={() => isMember && navigate(`/groups/${g.id}`)} 
                                style={{ 
                                    cursor: isMember ? 'pointer' : 'default',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{g.name}</h3>
                                        {isMember && <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>✓ Member</span>}
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
                                            <button className="btn btn-xs btn-outline disabled" disabled>⏳ Pending</button>
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
