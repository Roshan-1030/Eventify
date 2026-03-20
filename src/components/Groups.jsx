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
                <div className="text-center p-6 glass-panel">
                    <h1>Private Group</h1>
                    <p>You must be a member of <strong>{currentGroup.name}</strong> to view this content.</p>
                    <button className="btn btn-outline mt-4" onClick={() => navigate('/groups')}>Go Back</button>
                </div>
            );
        }

        return (
            <div className="group-details">
                <div className="flex justify-between items-center mb-6">
                    <button className="btn btn-outline" onClick={() => navigate('/groups')}>← Back</button>
                    <div className="flex gap-2">
                        <button className="btn btn-outline" onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }}>🔗 Invite</button>
                    </div>
                </div>

                <div className="grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '70vh' }}>
                        <h2>{currentGroup.name} Chat</h2>
                        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', margin: '1rem 0', padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(0,0,0,0.02)' }}>
                            {(currentGroup.messages || []).length === 0 ? <p className="text-center text-secondary">No messages yet.</p> : (
                                currentGroup.messages.map((msg, i) => (
                                    <div key={i} className="mb-3" style={{ textAlign: msg.userId === state.user.id ? 'right' : 'left' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{msg.userName}</div>
                                        <div style={{ display: 'inline-block', padding: '0.6rem 1rem', borderRadius: '12px', background: msg.userId === state.user.id ? 'var(--primary)' : '#e2e8f0', color: msg.userId === state.user.id ? 'white' : 'black', maxWidth: '80%' }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {(!currentGroup.isMuted || isGroupAdmin) ? (
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input type="text" className="form-control" placeholder="Type a message..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                                <button type="submit" className="btn btn-primary">Send</button>
                            </form>
                        ) : <div className="text-center p-2 bg-danger text-white" style={{ borderRadius: '8px' }}>Muted</div>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {isGroupAdmin && currentGroup.requests?.length > 0 && (
                            <div className="glass-panel" style={{ border: '2px solid var(--accent)', padding: '1.5rem' }}>
                                <h3>Requests ({currentGroup.requests.length})</h3>
                                {currentGroup.requests.map(req => (
                                    <div key={req.id} className="flex justify-between items-center mb-2 p-2" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{req.name}</span>
                                        <div className="flex gap-1">
                                            <button className="btn btn-sm" onClick={() => handleRequest(req.id, true)}>✔</button>
                                            <button className="btn btn-sm btn-outline" onClick={() => handleRequest(req.id, false)}>✖</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3>Members ({currentGroup.members.length})</h3>
                            <div className="mt-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {currentGroup.members.map(m => (
                                    <div key={m.id} className="flex items-center gap-2 mb-3 p-2 border-bottom">
                                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>{m.name.charAt(0)}</div>
                                        <strong>{m.name}</strong>
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
            <div className="flex justify-between items-center mb-6">
                <h1>Groups</h1>
                {state.user.role === 'admin' && <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(!isCreateModalOpen)}>+ Create New Group</button>}
            </div>

            {isCreateModalOpen && (
                <div className="glass-panel mb-8">
                    <h2>Create New Group</h2>
                    <form onSubmit={handleCreateGroup}>
                        <div className="form-group"><label>Name</label><input type="text" className="form-control" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required /></div>
                        <div className="form-group"><label>Description</label><textarea className="form-control" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} /></div>
                        <div className="flex gap-2">
                            <button type="submit" className="btn btn-primary">Create</button>
                            <button type="button" className="btn btn-outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid-cards">
                {roomGroups.length === 0 ? <p className="text-secondary">No groups found.</p> : roomGroups.map(g => (
                    <div key={g.id} className="glass-panel" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => navigate(`/groups/${g.id}`)}>
                        <div className="flex items-start gap-4">
                            <div className="avatar" style={{ width: '50px', height: '50px', background: 'var(--primary)', color: 'white' }}>{g.name.charAt(0)}</div>
                            <div>
                                <h3 style={{ margin: 0 }}>{g.name}</h3>
                                <p style={{ fontSize: '0.85rem' }}>{g.members.length} Members</p>
                                <p style={{ opacity: 0.8 }}>{g.description}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            {!g.members.some(m => String(m.id) === String(state.user.id)) && !g.requests?.some(r => r.id === state.user.id) && (
                                <button className="btn btn-primary w-100" onClick={(e) => { e.stopPropagation(); handleJoinGroup(g.id); }}>Join Group</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Groups;
