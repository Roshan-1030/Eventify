import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../context/StateContext';

const Chat = () => {
    const { state, setState } = useAppState();
    const [msg, setMsg] = useState('');
    const chatRef = useRef(null);

    const roomChats = (state.chats || []).filter(c => c.roomId === state.user.roomId);
    const isGlobalMuted = (state.mutedRooms || []).includes(state.user.roomId);
    const isAdmin = state.user.role === 'admin';

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [roomChats]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!msg.trim()) return;
        if (isGlobalMuted && !isAdmin) return;

        const newMsg = {
            id: Date.now(),
            roomId: state.user.roomId,
            userId: state.user.id,
            userName: state.user.name,
            text: msg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setState(prev => ({ ...prev, chats: [...(prev.chats || []), newMsg] }));
        setMsg('');
    };

    const toggleGlobalMute = () => {
        if (!isAdmin) return;
        setState(prev => {
            const muted = [...(prev.mutedRooms || [])];
            return { ...prev, mutedRooms: muted.includes(state.user.roomId) ? muted.filter(id => id !== state.user.roomId) : [...muted, state.user.roomId] };
        });
    };

    const handleClearChat = () => {
        if (!isAdmin) return;
        if (window.confirm("Are you sure you want to clear all messages?")) {
            setState(prev => ({ ...prev, chats: (prev.chats || []).filter(c => c.roomId !== state.user.roomId) }));
        }
    };

    return (
        <div className="chat-container">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1>Room Discussion</h1>
                    <p style={{ margin: 0 }}>Engage with students and organizers in <strong>Room: {state.user.roomId}</strong></p>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <button className={`btn btn-sm ${isGlobalMuted ? 'btn-success' : 'btn-outline'}`} onClick={toggleGlobalMute}>
                            {isGlobalMuted ? '🔊 Unmute Room' : '🔇 Mute Room'}
                        </button>
                        <button className="btn btn-sm btn-outline text-danger" onClick={handleClearChat}>🗑️ Reset</button>
                    </div>
                )}
            </div>

            <div className="glass-panel" style={{ height: '70vh', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '15px' }} ref={chatRef}>
                    {roomChats.length === 0 ? (
                        <div className="text-center p-12 text-secondary">No messages yet.</div>
                    ) : (
                        roomChats.map((c, i) => (
                            <div key={i} className={`mb-4 flex flex-col ${c.userId === state.user.id ? 'items-end' : 'items-start'}`}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px' }}>{c.userName}</div>
                                <div className="p-3" style={{ 
                                    background: c.userId === state.user.id ? 'var(--primary-gradient)' : 'white', 
                                    color: c.userId === state.user.id ? 'white' : 'black', 
                                    borderRadius: '18px', 
                                    maxWidth: '75%', 
                                    width: 'fit-content', // Adjustable according to message size
                                    wordBreak: 'break-word',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', 
                                    border: '1px solid var(--border)' 
                                }}>
                                    {c.text}
                                    <div style={{ textAlign: 'right', fontSize: '0.65rem', marginTop: '4px', opacity: 0.8 }}>{c.time}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {isGlobalMuted && !isAdmin ? (
                    <div className="text-center p-4 bg-danger text-white rounded-lg font-bold">⚠️ Discussion is currently muted by admin.</div>
                ) : (
                    <form onSubmit={handleSend} className="flex gap-2 p-2 bg-white rounded-full border">
                        <input type="text" className="form-control" placeholder="Write something..." value={msg} onChange={e => setMsg(e.target.value)} style={{ border: 'none', background: 'transparent' }} />
                        <button type="submit" className="btn btn-primary" style={{ borderRadius: '50px' }}>Send</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Chat;
