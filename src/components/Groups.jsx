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
            name: newGroupName,
            description: newGroupDesc,
            members: [{ id: state.user.id, name: state.user.name, email: state.user.email, roleInGroup: 'admin' }],
            requests: [],
            messages: [],
            isMuted: false,
        };
        try {
            await addDoc(collection(db, "groups"), newGroup);
            setNewGroupName(''); setNewGroupDesc(''); setIsCreateModalOpen(false);
        } catch(e) { console.error(e); }
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
            if (!window.confirm("Remove member?")) return;
            updatedMembers.splice(mIdx, 1);
        }

        try {
            await updateDoc(doc(db, "groups", currentGroup.id), { members: updatedMembers });
        } catch(e) { console.error(e); }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !currentGroup) return;

        const newMessages = [...(currentGroup.messages || [])];
        newMessages.push({ userId: state.user.id, userName: state.user.name, text: chatInput, time: Date.now() });
        
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

    if (groupId && currentGroup) {
        const isGlobalAdmin = state.user.role === 'admin';
        const memberSelf = currentGroup.members.find(m => String(m.id) === String(state.user.id));
        const isGroupAdmin = isGlobalAdmin || memberSelf?.roleInGroup === 'admin' || memberSelf?.roleInGroup === 'co-admin';
        const isMember = !!memberSelf || isGlobalAdmin;

        if (!isMember) {
            return (
                <div className="text-center p-12 glass-panel">
                    <h1>Private Group</h1>
                    <p>Access restricted to <strong>{currentGroup.name}</strong> members.</p>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/groups')}>Back</button>
                </div>
            );
        }

        return (
            <div className="group-details">
                <div className="flex justify-between items-center mb-6">
                    <button className="btn btn-outline" onClick={() => navigate('/groups')}>← Back</button>
                    <div className="flex gap-2">
                        {isGroupAdmin && <button className={`btn btn-sm ${currentGroup.isMuted ? 'btn-success' : 'btn-outline'}`} onClick={toggleGroupMute}>{currentGroup.isMuted ? '🔊 Unmute Room' : '🔇 Mute Room'}</button>}
                        {isGlobalAdmin && <button className="btn btn-sm btn-outline text-danger" onClick={async () => { if(window.confirm('Delete group?')) { try { await deleteDoc(doc(db, "groups", currentGroup.id)); navigate('/groups'); } catch(e){} } }}>🗑️ Delete</button>}
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="glass-panel col-span-2 flex flex-col" style={{ height: '70vh', padding: '1.5rem' }}>
                        <div className="flex justify-between items-center pb-4 border-bottom">
                            <h2 style={{ margin: 0 }}>{currentGroup.name}</h2>
                            {currentGroup.isMuted && <span className="badge badge-danger">CHAT MUTED</span>}
                        </div>
                        
                        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', margin: '1rem 0', padding: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            {currentGroup.messages.map((msg, i) => (
                                <div key={i} className="mb-4" style={{ 
                                    borderLeft: msg.userId === state.user.id ? '3px solid var(--primary)' : '3px solid transparent', 
                                    paddingLeft: '1rem' 
                                }}>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <strong style={{ fontSize: '0.9rem', color: msg.userId === state.user.id ? 'var(--primary)' : 'inherit', cursor: (isGlobalAdmin && msg.userId !== state.user.id) ? 'pointer' : 'default' }} 
                                                 onClick={() => isGlobalAdmin && msg.userId !== state.user.id && setInspectedUser((state.users || []).find(u => u.id === msg.userId))}>
                                            {msg.userId === state.user.id ? 'You' : msg.userName} {(isGlobalAdmin && msg.userId !== state.user.id) && '🔍'}
                                        </strong>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.6 }}>{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div style={{ fontSize: '0.95rem', color: '#000000', lineHeight: '1.4' }}>{msg.text}</div>
                                </div>
                            ))}
                        </div>

                        {(!currentGroup.isMuted || isGroupAdmin) ? (
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input type="text" className="form-control" placeholder="Share something..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                                <button type="submit" className="btn btn-primary px-6">Send</button>
                            </form>
                        ) : <div className="text-center p-3 text-secondary italic">Chat is currently muted.</div>}
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="glass-panel">
                            <h3>Participants ({currentGroup.members.length})</h3>
                            <div className="mt-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {currentGroup.members.map(m => (
                                    <div key={m.id} className="flex items-start justify-between mb-3 pb-3 border-bottom">
                                        <div className="flex items-center gap-3">
                                            <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '0.7rem', cursor: (isGlobalAdmin && m.id !== state.user.id) ? 'pointer' : 'default' }} onClick={() => isGlobalAdmin && m.id !== state.user.id && setInspectedUser((state.users || []).find(u => u.id === m.id))}>
                                                {m.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{m.name} {m.roleInGroup === 'admin' && <span className="badge badge-admin ml-1" style={{ fontSize: '0.5rem' }}>Admin</span>} {m.roleInGroup === 'co-admin' && <span className="badge badge-primary ml-1" style={{ fontSize: '0.5rem' }}>Co-Admin</span>}</div>
                                            </div>
                                        </div>
                                        {isGroupAdmin && m.id !== state.user.id && m.roleInGroup !== 'admin' && (
                                            <div className="flex gap-1">
                                                <button className="btn btn-sm btn-outline btn-xs" onClick={() => handleMemberAction(m.id, m.roleInGroup === 'co-admin' ? 'demote' : 'promote')}>{m.roleInGroup === 'co-admin' ? '⬇' : '⬆'}</button>
                                                <button className="btn btn-sm btn-outline btn-xs text-danger" onClick={() => handleMemberAction(m.id, 'remove')}>✖</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {inspectedUser && (
                    <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setInspectedUser(null)}>
                        <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                            <div className="text-center">
                                <div className="avatar mx-auto mb-4" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>{inspectedUser.name.charAt(0)}</div>
                                <h2>{inspectedUser.name}</h2>
                                <p className="badge badge-primary">{inspectedUser.role.toUpperCase()}</p>
                                <div className="text-left mt-6 flex flex-col gap-2">
                                    <div><strong>Email:</strong> {inspectedUser.email}</div>
                                    <div><strong>Academic:</strong> {inspectedUser.branch} - {inspectedUser.year}</div>
                                </div>
                                <button className="btn btn-primary w-100 mt-6" onClick={() => setInspectedUser(null)}>Dismiss</button>
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
                <div><h1>Communities</h1><p>Active Room: <strong>{state.user.roomId}</strong></p></div>
                {state.user.role === 'admin' && <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>+ New Group</button>}
            </div>

            {isCreateModalOpen && (
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setIsCreateModalOpen(false)}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <h2>Launch New Group</h2>
                        <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
                            <div className="form-group"><label>Group Name</label><input type="text" className="form-control" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required /></div>
                            <div className="form-group"><label>Description</label><textarea className="form-control" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} /></div>
                            <button type="submit" className="btn btn-primary">Start Group</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid-cards">
                {roomGroups.length === 0 ? <p className="text-secondary">Explore new communities here.</p> : roomGroups.map(g => (
                    <div key={g.id} className="glass-panel" onClick={() => navigate(`/groups/${g.id}`)} style={{ cursor: 'pointer' }}>
                        <h3>{g.name}</h3>
                        <p className="text-truncate">{g.description}</p>
                        <div className="mt-4 pt-4 border-top flex justify-between items-center">
                            <span className="badge badge-primary">{g.members.length} Members</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Groups;
