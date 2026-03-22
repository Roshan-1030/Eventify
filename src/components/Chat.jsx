import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';

const Chat = () => {
    const { state, setState } = useAppState();
    const [msg, setMsg] = useState('');
    const chatRef = useRef(null);

    const roomChats = (state.chats || [])
        .filter(c => c.roomId === state.user.roomId)
        .sort((a,b) => (a.timestamp || a.id || 0) - (b.timestamp || b.id || 0));
    const isGlobalMuted = (state.mutedRooms || []).includes(state.user.roomId);
    const isAdmin = state.user.role === 'admin';

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
            text: msg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
        };

        try {
            await addDoc(collection(db, "chats"), newMsg);
            setMsg('');
        } catch(e) { console.error("Failed to send chat:", e); }
    };

    const toggleGlobalMute = () => {
        if (!isAdmin) return;
        setState(prev => {
            const muted = [...(prev.mutedRooms || [])];
            return { ...prev, mutedRooms: muted.includes(state.user.roomId) ? muted.filter(id => id !== state.user.roomId) : [...muted, state.user.roomId] };
        });
    };

    return (
        <div className="chat-container">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1>Room Discussion</h1>
                    <p style={{ margin: 0 }}>Room: <strong>{state.user.roomId}</strong></p>
                </div>
                {isAdmin && (
                    <button className={`btn btn-sm ${isGlobalMuted ? 'btn-success' : 'btn-outline'}`} onClick={toggleGlobalMute}>
                        {isGlobalMuted ? '🔊 Unmute Room' : '🔇 Mute Room'}
                    </button>
                )}
            </div>

            <div className="glass-panel" style={{ height: '70vh', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', padding: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }} ref={chatRef}>
                    {roomChats.length === 0 ? (
                        <div className="text-center p-12 text-secondary">Start the conversation...</div>
                    ) : (
                        roomChats.map((c, i) => (
                            <div key={i} className="mb-4" style={{ borderLeft: c.userId === state.user.id ? '3px solid var(--primary)' : '3px solid transparent', paddingLeft: '1rem' }}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <strong style={{ fontSize: '0.9rem', color: c.userId === state.user.id ? 'var(--primary)' : 'inherit' }}>{c.userName}</strong>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.6 }}>{c.time}</span>
                                </div>
                                <div style={{ fontSize: '0.95rem', color: '#000000', lineHeight: '1.4' }}>{c.text}</div>
                            </div>
                        ))
                    )}
                </div>

                {isGlobalMuted && !isAdmin ? (
                    <div className="text-center p-4 bg-danger text-white rounded-lg font-bold">⚠️ Discussion is muted by admin.</div>
                ) : (
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input type="text" className="form-control" placeholder="Write a message..." value={msg} onChange={e => setMsg(e.target.value)} />
                        <button type="submit" className="btn btn-primary px-6">Send</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Chat;
