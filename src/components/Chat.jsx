import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

const Chat = () => {
    const { state } = useAppState();
    const [msg, setMsg] = useState('');
    const chatRef = useRef(null);

    const roomChats = (state.chats || [])
        .filter(c => c.roomId === state.user?.roomId)
        .sort((a,b) => (a.timestamp || a.id || 0) - (b.timestamp || b.id || 0));
    
    // Cloud-synced global mute state based on Admin's profile settings
    const roomAdminProfile = (state.users || []).find(u => u.role === 'admin' && u.roomId === state.user?.roomId);
    const isGlobalMuted = roomAdminProfile ? roomAdminProfile.isMuted === true : false;
    const isAdmin = state.user?.role === 'admin';

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [roomChats]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!msg.trim()) return;
        if (isGlobalMuted && !isAdmin) return;

        const newMsg = {
            roomId: state.user.roomId,
            userId: state.user.id,
            userName: state.user.name,
            text: msg.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
        };

        try {
            await addDoc(collection(db, "chats"), newMsg);
            setMsg('');
        } catch(e) { console.error("Failed to send chat:", e); }
    };

    const toggleGlobalMute = async () => {
        if (!isAdmin || !roomAdminProfile) return;
        try {
            await updateDoc(doc(db, "profiles", roomAdminProfile.id), {
                isMuted: !isGlobalMuted
            });
        } catch(e) { console.log("Failed to toggle mute:", e); }
    };

    return (
        <div className="chat-container">
            <div className="dashboard-header" style={{ marginBottom: '1.25rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.35rem' }}>Room Discussion</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        Live chat for Room: <strong style={{ color: 'var(--primary)' }}>{state.user?.roomId}</strong>
                    </p>
                </div>
                {isAdmin && (
                    <button className={`btn btn-sm ${isGlobalMuted ? 'btn-success' : 'btn-outline'}`} onClick={toggleGlobalMute}>
                        {isGlobalMuted ? '🔊 Unmute Room' : '🔇 Mute Room'}
                    </button>
                )}
            </div>

            <div className="glass-panel flex flex-col" style={{ height: 'calc(100vh - 240px)', minHeight: '420px', padding: '1.25rem' }}>
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', padding: '0.5rem' }} ref={chatRef}>
                    {roomChats.length === 0 ? (
                        <div className="text-center py-16 text-secondary" style={{ fontSize: '0.95rem' }}>
                            💬 Start the discussion in Room {state.user?.roomId}...
                        </div>
                    ) : (
                        roomChats.map((c, i) => (
                            <div 
                                key={i} 
                                className="mb-3" 
                                style={{ 
                                    borderLeft: c.userId === state.user.id ? '3px solid var(--primary)' : '3px solid transparent', 
                                    padding: '0.4rem 0.75rem',
                                    background: c.userId === state.user.id ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                                    borderRadius: '0 8px 8px 0'
                                }}
                            >
                                <div className="flex items-baseline gap-2 mb-1">
                                    <strong style={{ fontSize: '0.85rem', color: c.userId === state.user.id ? 'var(--primary)' : 'inherit' }}>
                                        {c.userId === state.user.id ? 'You' : c.userName}
                                    </strong>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{c.time}</span>
                                </div>
                                <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.45', wordBreak: 'break-word' }}>
                                    {c.text}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {isGlobalMuted && !isAdmin ? (
                    <div className="text-center p-3 rounded-lg font-bold" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '0.85rem' }}>
                        ⚠️ Discussion has been muted by the event administrator.
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="flex gap-2" style={{ marginTop: 'auto' }}>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Write a message..." 
                            value={msg} 
                            onChange={e => setMsg(e.target.value)} 
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Send</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Chat;
