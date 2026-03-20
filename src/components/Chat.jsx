import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../context/StateContext';

const Chat = () => {
    const { state, setState } = useAppState();
    const [inputText, setInputText] = useState('');
    const chatHistoryRef = useRef(null);
    
    // Find room-specific data to see if chat is muted
    // We'll store room-settings in the state or just inferred from the first admin found
    const roomChat = (state.chats || [])
        .filter(c => c.roomId === state.user.roomId)
        .sort((a,b) => new Date(a.date) - new Date(b.date));

    // For simplicity, we store mute status in the StateContext state or a specific roomState
    const isMuted = state.roomSettings?.[state.user.roomId]?.isChatMuted || false;

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [roomChat]);

    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        const text = inputText.trim();
        if (!text) return;
        if (isMuted && state.user.role !== 'admin') return alert('The chat is currently muted by admin.');

        const newMessage = {
            id: Date.now(),
            roomId: state.user.roomId,
            senderId: state.user.id,
            senderName: state.user.name,
            text: text,
            date: new Date().toISOString()
        };

        setState(prev => ({
            ...prev,
            chats: [...(prev.chats || []), newMessage]
        }));
        setInputText('');
    };

    const toggleMute = () => {
        const currentMute = state.roomSettings?.[state.user.roomId]?.isChatMuted || false;
        setState(prev => ({
            ...prev,
            roomSettings: {
                ...(prev.roomSettings || {}),
                [state.user.roomId]: {
                    ...(prev.roomSettings?.[state.user.roomId] || {}),
                    isChatMuted: !currentMute
                }
            }
        }));
    };

    return (
        <div className="chat-page">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1>💬 Room Discussion</h1>
                    <p>Chat with everyone in Room: <strong style={{ color: 'var(--primary)' }}>{state.user.roomId}</strong></p>
                </div>
                {state.user.role === 'admin' && (
                    <button className={`btn ${isMuted ? 'btn-danger' : 'btn-outline'}`} onClick={toggleMute}>
                        {isMuted ? '🔇 Unmute Room' : '🔈 Mute Room'}
                    </button>
                )}
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: '1.5rem' }}>
                {isMuted && <div className="text-center p-2 mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '12px', fontWeight: 'bold' }}>⚠️ Chat is currently MUTED. Only admins can send messages.</div>}
                
                <div 
                    id="chat-history" 
                    ref={chatHistoryRef}
                    style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                    {roomChat.length === 0 ? (
                        <div className="text-center text-secondary" style={{ margin: 'auto' }}>No messages yet. Start the conversation!</div>
                    ) : (
                        roomChat.map(c => {
                            const isMe = c.senderId === state.user.id;
                            return (
                                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                                        {isMe ? 'You' : c.senderName} 
                                        <span style={{ opacity: 0.6, marginLeft: '4px' }}>
                                            {new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </span>
                                    <div style={{
                                        maxWidth: '75%',
                                        padding: '0.8rem 1.2rem',
                                        borderRadius: '18px',
                                        background: isMe ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.4)',
                                        color: isMe ? 'white' : 'var(--text-primary)',
                                        border: '1px solid ' + (isMe ? 'transparent' : 'var(--border)'),
                                        borderBottomRightRadius: isMe ? '4px' : '18px',
                                        borderBottomLeftRadius: isMe ? '18px' : '4px',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                                        wordBreak: 'break-word'
                                    }}>
                                        {c.text}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <input 
                        type="text" 
                        className="form-control" 
                        style={{ flex: 1, borderRadius: '999px', padding: '1rem 1.5rem' }} 
                        placeholder={isMuted && state.user.role !== 'admin' ? "Chat is muted..." : "Type a message..."} 
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        disabled={isMuted && state.user.role !== 'admin'}
                    />
                    <button type="submit" className="btn btn-primary" style={{ borderRadius: '999px', padding: '1rem 2rem' }} disabled={isMuted && state.user.role !== 'admin'}>Send</button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
