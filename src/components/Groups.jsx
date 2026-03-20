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
    const [inspectedUser, setInspectedUser] = useState(null); // For admin profile inspection
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
            members: [{ id: state.user.id, name: state.user.name, email: state.user.email, roleInGroup: 'admin' }],
            requests: [],
            messages: [],
            isMuted: false,
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
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete the group "${name}"?`)) return;
        setState(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== id) }));
        if (groupId === id) navigate('/groups');
    };

    // Management Actions
    const handleMemberAction = (userId, action) => {
        if (!currentGroup) return;
        const groupsCopy = [...state.groups];
        const idx = groupsCopy.findIndex(g => g.id === currentGroup.id);
        const g = { ...groupsCopy[idx], members: [...groupsCopy[idx].members] };
        
        const mIdx = g.members.findIndex(m => String(m.id) === String(userId));
        if (mIdx === -1) return;

        if (action === 'promote') {
            g.members[mIdx] = { ...g.members[mIdx], roleInGroup: 'co-admin' };
        } else if (action === 'demote') {
            g.members[mIdx] = { ...g.members[mIdx], roleInGroup: 'student' };
        } else if (action === 'remove') {
            if (!window.confirm("Remove this member from the group?")) return;
            g.members.splice(mIdx, 1);
        }

        groupsCopy[idx] = g;
        setState(prev => ({ ...prev, groups: groupsCopy }));
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
        if (accept && req) g.members.push({ ...req, roleInGroup: 'student' });
        groupsCopy[idx] = g;
        setState(prev => ({ ...prev, groups: groupsCopy }));
    };

    const toggleGroupMute = () => {
        const groupsCopy = [...state.groups];
        const idx = groupsCopy.findIndex(g => g.id === currentGroup.id);
        groupsCopy[idx] = { ...groupsCopy[idx], isMuted: !groupsCopy[idx].isMuted };
        setState(prev => ({ ...prev, groups: groupsCopy }));
    };

    if (groupId && currentGroup) {
        const isGlobalAdmin = state.user.role === 'admin';
        const memberSelf = currentGroup.members.find(m => String(m.id) === String(state.user.id));
        const isGroupAdmin = isGlobalAdmin || memberSelf?.roleInGroup === 'admin' || memberSelf?.roleInGroup === 'co-admin';
        const isMember = !!memberSelf || isGlobalAdmin;

        if (!isMember) {
            return (
                <div className="text-center p-12 glass-panel">
                    <h1>Private Group</h1>
                    <p>Contact an admin to join <strong>{currentGroup.name}</strong>.</p>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/groups')}>Back to Groups</button>
                </div>
            );
        }

        return (
            <div className="group-details">
                <div className="flex justify-between items-center mb-6">
                    <button className="btn btn-outline" onClick={() => navigate('/groups')}>← All Groups</button>
                    <div className="flex gap-2">
                        {isGroupAdmin && <button className={`btn btn-sm ${currentGroup.isMuted ? 'btn-success' : 'btn-outline'}`} onClick={toggleGroupMute}>{currentGroup.isMuted ? '🔊 Unmute Room' : '🔇 Mute Room'}</button>}
                        {isGlobalAdmin && <button className="btn btn-sm btn-outline text-danger" onClick={() => handleDeleteGroup(currentGroup.id, currentGroup.name)}>🗑️ Delete</button>}
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="glass-panel col-span-2 flex flex-col" style={{ height: '70vh', padding: '1.5rem' }}>
                        <div className="flex justify-between items-center pb-4 border-bottom">
                            <h2 style={{ margin: 0 }}>{currentGroup.name}</h2>
                            {currentGroup.isMuted && <span className="badge badge-danger">MUTED BY ADMIN</span>}
                        </div>
                        
                        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', margin: '1rem 0', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                            {currentGroup.messages.map((msg, i) => (
                                <div key={i} className={`mb-4 flex flex-col ${msg.userId === state.user.id ? 'items-end' : 'items-start'}`}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '2px', cursor: (isGlobalAdmin && msg.userId !== state.user.id) ? 'pointer' : 'default' }} 
                                         onClick={() => isGlobalAdmin && msg.userId !== state.user.id && setInspectedUser((state.users || []).find(u => u.id === msg.userId))}>
                                        {msg.userName} {isGlobalAdmin && msg.userId !== state.user.id && '🔍'}
                                    </div>
                                    <div className="p-3 rounded-lg" style={{ maxWidth: '80%', background: msg.userId === state.user.id ? 'var(--primary-gradient)' : 'white', color: msg.userId === state.user.id ? 'white' : 'black', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {(!currentGroup.isMuted || isGroupAdmin) ? (
                            <form onSubmit={handleSendMessage} className="flex gap-2 p-2 bg-white rounded-full border">
                                <input type="text" className="form-control" placeholder="Type a message..." value={chatInput} onChange={e => setChatInput(e.target.value)} style={{ border: 'none', background: 'transparent' }} />
                                <button type="submit" className="btn btn-primary" style={{ borderRadius: '50px' }}>Send</button>
                            </form>
                        ) : <div className="text-center p-3 text-secondary italic">This group chat is muted by the administrator.</div>}
                    </div>

                    <div className="flex flex-col gap-6">
                        {isGroupAdmin && currentGroup.requests?.length > 0 && (
                            <div className="glass-panel text-sm">
                                <h3 className="mb-4">Pending Requests</h3>
                                {currentGroup.requests.map(req => (
                                    <div key={req.id} className="flex justify-between items-center mb-2 p-3 bg-light rounded">
                                        <strong>{req.name}</strong>
                                        <div className="flex gap-1">
                                            <button className="btn btn-sm btn-primary" onClick={() => handleRequest(req.id, true)}>✔</button>
                                            <button className="btn btn-sm btn-outline" onClick={() => handleRequest(req.id, false)}>✖</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="glass-panel">
                            <h3>Group Members ({currentGroup.members.length})</h3>
                            <div className="mt-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {currentGroup.members.map(m => (
                                    <div key={m.id} className="flex items-start justify-between mb-3 pb-3 border-bottom">
                                        <div className="flex items-center gap-3">
                                            <div className="avatar" style={{ width: '35px', height: '35px', fontSize: '0.8rem', cursor: (isGlobalAdmin && m.id !== state.user.id) ? 'pointer' : 'default' }} onClick={() => isGlobalAdmin && m.id !== state.user.id && setInspectedUser((state.users || []).find(u => u.id === m.id))}>
                                                {m.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{m.name} {m.roleInGroup === 'admin' && <span className="badge badge-admin ml-1" style={{ fontSize: '0.6rem' }}>Admin</span>} {m.roleInGroup === 'co-admin' && <span className="badge badge-primary ml-1" style={{ fontSize: '0.6rem' }}>Co-Admin</span>}</div>
                                                <div style={{ fontSize: '0.7rem' }} className="text-secondary">{m.email}</div>
                                            </div>
                                        </div>
                                        {isGroupAdmin && m.id !== state.user.id && m.roleInGroup !== 'admin' && (
                                            <div className="flex gap-1">
                                                {m.roleInGroup !== 'co-admin' ? (
                                                    <button className="btn btn-sm btn-outline text-success" title="Promote to Co-Admin" onClick={() => handleMemberAction(m.id, 'promote')}>⬆</button>
                                                ) : (
                                                    <button className="btn btn-sm btn-outline text-warning" title="Revoke Co-Admin" onClick={() => handleMemberAction(m.id, 'demote')}>⬇</button>
                                                )}
                                                <button className="btn btn-sm btn-outline text-danger" title="Remove Member" onClick={() => handleMemberAction(m.id, 'remove')}>✖</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Inspector Modal */}
                {inspectedUser && (
                    <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setInspectedUser(null)}>
                        <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                            <div className="text-center">
                                <div className="avatar mx-auto mb-4" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>{inspectedUser.name.charAt(0)}</div>
                                <h2>{inspectedUser.name}</h2>
                                <p className="badge badge-primary mb-6">{inspectedUser.role.toUpperCase()}</p>
                                
                                <div className="text-left flex flex-col gap-3 mt-4" style={{ padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                                    <div><strong>Email:</strong> {inspectedUser.email}</div>
                                    <div><strong>Branch:</strong> {inspectedUser.branch || 'N/A'}</div>
                                    <div><strong>Year:</strong> {inspectedUser.year || 'N/A'} Year</div>
                                    <div><strong>Status:</strong> <span className="text-success">Active Member</span></div>
                                </div>
                                <button className="btn btn-outline w-100 mt-6" onClick={() => setInspectedUser(null)}>Close Profile</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="groups-page">
            <div className="flex justify-between items-center mb-6">
                <div><h1>Room Communities</h1><p>Room: <strong>{state.user.roomId}</strong></p></div>
                {state.user.role === 'admin' && <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>+ Define Group</button>}
            </div>

            {isCreateModalOpen && (
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setIsCreateModalOpen(false)}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <h2>Establish New Community</h2>
                        <form onSubmit={handleCreateGroup} className="flex flex-col gap-4 mt-4">
                            <div className="form-group"><label>Title</label><input type="text" className="form-control" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required /></div>
                            <div className="form-group"><label>Description</label><textarea className="form-control" rows="3" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} /></div>
                            <div className="flex gap-2">
                                <button type="submit" className="btn btn-primary flex-1">Launch Group</button>
                                <button type="button" className="btn btn-outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid-cards">
                {roomGroups.length === 0 ? <p className="text-secondary">No groups available.</p> : roomGroups.map(g => (
                    <div key={g.id} className="glass-panel" style={{ cursor: 'pointer' }} onClick={() => navigate(`/groups/${g.id}`)}>
                        <h3>{g.name}</h3>
                        <p className="text-truncate">{g.description}</p>
                        <div className="flex justify-between items-center mt-4 pt-4 border-top">
                            <span className="badge badge-primary">{g.members.length} Members</span>
                            {g.isMuted && <span className="badge badge-danger">Chat Muted</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Groups;
