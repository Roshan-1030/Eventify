import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const Groups = () => {
    const { state, setState } = useAppState();
    const { groupId: routeGroupId } = useParams();
    const navigate = useNavigate();
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [chatInput, setChatInput] = useState('');
    const chatRef = useRef(null);

    const groupId = routeGroupId ? parseInt(routeGroupId) : null;
    const roomGroups = (state.groups || []).filter(g => g.roomId === state.user.roomId);
    const currentGroup = groupId ? (state.groups || []).find(g => g.id === groupId) : null;

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [currentGroup?.messages]);

    const handleCreateGroup = (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return alert('Group name is required');
        const newGroup = {
            id: Date.now(),
            roomId: state.user.roomId,
            name: newGroupName,
            description: newGroupDesc,
            members: [{ id: state.user.id, name: state.user.name, email: state.user.email }],
            requests: [],
            messages: [],
            isMuted: false,
            otherAdmins: []
        };
        setState(prev => ({ ...prev, groups: [...(prev.groups || []), newGroup] }));
        setNewGroupName(''); setNewGroupDesc(''); setIsCreateModalOpen(false);
    };

    const handleJoinGroup = (id) => {
        const groupsCopy = [...state.groups];
        const idx = groupsCopy.findIndex(g => g.id === id);
        if (idx === -1) return;
        const g = { ...groupsCopy[idx], requests: [...(groupsCopy[idx].requests || [])] };
        if (g.requests.some(r => r.id === state.user.id)) return alert('Request already sent.');
        g.requests.push({ id: state.user.id, name: state.user.name, email: state.user.email });
        groupsCopy[idx] = g;
        setState(prev => ({ ...prev, groups: groupsCopy }));
        alert('Join request sent!');
    };

    const handleDeleteGroup = (id, name) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete the group "${name}"? This will clear all its messages and members.`)) return;
        setState(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== id) }));
        if (groupId === id) navigate('/groups');
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !currentGroup) return;
        const groupsCopy = [...state.groups];
        const idx = groupsCopy.findIndex(g => g.id === currentGroup.id);
        const g = { ...groupsCopy[idx], messages: [...(groupsCopy[idx].messages || [])] };
        g.messages.push({ userId: state.user.id, userName: state.user.name, text: chatInput, time: Date.now() });
        groupsCopy[idx] = g;
        setState(prev => ({ ...prev, groups: groupsCopy }));
        setChatInput('');
    };

    const handleRequest = (userId, accept) => {
        const groupsCopy = [...state.groups];
        const idx = groupsCopy.findIndex(g => g.id === currentGroup.id);
        const g = { ...groupsCopy[idx], members: [...groupsCopy[idx].members], requests: [...groupsCopy[idx].requests] };
        const req = g.requests.find(r => r.id === userId);
        g.requests = g.requests.filter(r => r.id !== userId);
        if (accept && req) g.members.push(req);
        groupsCopy[idx] = g;
        setState(prev => ({ ...prev, groups: groupsCopy }));
    };

    if (groupId && currentGroup) {
        const isGlobalAdmin = state.user.role === 'admin';
        const isGroupAdmin = isGlobalAdmin || (currentGroup.otherAdmins || []).includes(state.user.id);
        const isMember = currentGroup.members.some(m => String(m.id) === String(state.user.id));

        if (!isMember && !isGroupAdmin) {
            return (
                <div className="text-center p-12 glass-panel">
                    <h1>Private Group</h1>
                    <p>You must be a member of <strong>{currentGroup.name}</strong> to view this content.</p>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/groups')}>Back to Groups</button>
                </div>
            );
        }

        return (
            <div className="group-details">
                <div className="flex justify-between items-center mb-6">
                    <button className="btn btn-outline" onClick={() => navigate('/groups')}>← All Groups</button>
                    <div className="flex gap-2">
                        {isGlobalAdmin && <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDeleteGroup(currentGroup.id, currentGroup.name)}>🗑️ Delete Group</button>}
                        <button className="btn btn-outline" onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Invite link copied!'); }}>🔗 Invite</button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div className="glass-panel col-span-2" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '70vh' }}>
                        <div className="flex justify-between items-center mb-2">
                            <h2 style={{ margin: 0 }}>{currentGroup.name} Discussion</h2>
                            <span className="badge badge-success">● Live</span>
                        </div>
                        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', margin: '1rem 0', padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(0,0,0,0.02)' }}>
                            {(currentGroup.messages || []).length === 0 ? <p className="text-center text-secondary py-12">No messages in this group yet. Be the first!</p> : (
                                currentGroup.messages.map((msg, i) => (
                                    <div key={i} className="mb-4" style={{ textAlign: msg.userId === state.user.id ? 'right' : 'left' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px' }}>{msg.userName}</div>
                                        <div style={{ display: 'inline-block', padding: '0.8rem 1.2rem', borderRadius: '18px', background: msg.userId === state.user.id ? 'var(--primary-gradient)' : '#ffffff', color: msg.userId === state.user.id ? 'white' : 'black', maxWidth: '85%', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: msg.userId === state.user.id ? 'none' : '1px solid var(--border)' }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {(!currentGroup.isMuted || isGroupAdmin) ? (
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input type="text" className="form-control" placeholder="Type a message..." value={chatInput} onChange={e => setChatInput(e.target.value)} style={{ borderRadius: '99px', padding: '0.8rem 1.5rem' }} />
                                <button type="submit" className="btn btn-primary" style={{ borderRadius: '99px', padding: '0 1.5rem' }}>Send</button>
                            </form>
                        ) : <div className="text-center p-3 bg-danger text-white rounded-lg">This group is currently muted.</div>}
                    </div>

                    <div className="flex flex-col gap-6">
                        {isGroupAdmin && currentGroup.requests?.length > 0 && (
                            <div className="glass-panel" style={{ border: '2.5px solid var(--accent)', padding: '1.5rem' }}>
                                <h3 className="mb-4">Access Requests ({currentGroup.requests.length})</h3>
                                {currentGroup.requests.map(req => (
                                    <div key={req.id} className="flex justify-between items-center mb-2 p-3" style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '10px' }}>
                                        <span style={{ fontWeight: 800 }}>{req.name}</span>
                                        <div className="flex gap-2">
                                            <button className="btn btn-sm btn-outline text-success" onClick={() => handleRequest(req.id, true)}>✔</button>
                                            <button className="btn btn-sm btn-outline text-danger" onClick={() => handleRequest(req.id, false)}>✖</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3>Group Members ({currentGroup.members.length})</h3>
                            <div className="mt-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {currentGroup.members.map(m => (
                                    <div key={m.id} className="flex items-center gap-3 mb-3 p-2" style={{ borderBottom: '1px solid var(--border)' }}>
                                        <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}>{m.name.charAt(0)}</div>
                                        <div>
                                            <div style={{ fontWeight: 800 }}>{m.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="groups-page">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h1>Room Communities</h1>
                    <p>Join organized student groups in Room <strong>{state.user.roomId}</strong></p>
                </div>
                {state.user.role === 'admin' && <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(!isCreateModalOpen)}>+ Start New Group</button>}
            </div>

            {isCreateModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsCreateModalOpen(false)}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <h2>Create New Group</h2>
                        <form onSubmit={handleCreateGroup} className="flex flex-col gap-4 mt-4">
                            <div className="form-group"><label>Group Name *</label><input type="text" className="form-control" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Science Club" required /></div>
                            <div className="form-group"><label>Brief Description</label><textarea className="form-control" rows="3" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} placeholder="What is this group for?" /></div>
                            <div className="flex gap-2 mt-4 pt-4 border-top">
                                <button type="submit" className="btn btn-primary flex-1">Create Group</button>
                                <button type="button" className="btn btn-outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid-cards">
                {roomGroups.length === 0 ? <p className="text-secondary p-12 glass-panel text-center">No communities formed in this room yet.</p> : roomGroups.map(g => (
                    <div key={g.id} className="glass-panel" style={{ padding: '1.5rem', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/groups/${g.id}`)}>
                        {state.user.role === 'admin' && (
                            <button className="btn btn-sm btn-outline" style={{ position: 'absolute', top: '15px', right: '15px', color: 'var(--danger)', borderColor: 'var(--danger)', zIndex: 10 }} onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(g.id, g.name);
                            }}>Delete</button>
                        )}
                        <div className="flex items-start gap-4">
                            <div className="avatar" style={{ width: '60px', height: '60px', background: 'var(--primary-gradient)', color: 'white', fontSize: '1.5rem' }}>{g.name.charAt(0)}</div>
                            <div className="flex-1">
                                <h3 style={{ margin: 0 }}>{g.name}</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800 }}>{g.members.length} Members Online</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} className="text-truncate">{g.description}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            {!g.members.some(m => String(m.id) === String(state.user.id)) && !g.requests?.some(r => r.id === state.user.id) ? (
                                <button className="btn btn-primary w-100" onClick={(e) => { e.stopPropagation(); handleJoinGroup(g.id); }}>Send Join Request</button>
                            ) : !g.members.some(m => String(m.id) === String(state.user.id)) ? (
                                <button className="btn btn-outline w-100" disabled>Pending Approval...</button>
                            ) : (
                                <button className="btn btn-outline w-100" style={{ borderStyle: 'dashed' }}>Enter Conversation</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Groups;
