import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';

const Feedback = () => {
    const { state } = useAppState();
    const [content, setContent] = useState('');
    
    const roomFeedbacks = (state.feedbacks || [])
        .filter(f => f.roomId === state.user?.roomId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const text = content.trim();
        if (!text) return alert("Feedback cannot be empty");

        const newFeedback = {
            roomId: state.user.roomId,
            author: state.user.name,
            role: state.user.role,
            content: text,
            date: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "feedbacks"), newFeedback);
            setContent('');
        } catch(e) { console.error("Feedback failed:", e); }
    };

    return (
        <div className="feedback-page">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ marginBottom: '0.35rem' }}>Event Feedback</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        Reviews and student thoughts for Room: <strong style={{ color: 'var(--primary)' }}>{state.user?.roomId}</strong>
                    </p>
                </div>
            </div>

            <div className="grid grid-2 gap-6">
                <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Submit Feedback</h2>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <div className="form-group mb-0">
                            <textarea 
                                className="form-control" 
                                rows="4" 
                                placeholder="Tell us about what you loved or how events can be improved..." 
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100 mt-2">Submit Feedback</button>
                    </form>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Reviews ({roomFeedbacks.length})</h2>
                    <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                        {roomFeedbacks.length === 0 ? (
                            <p className="text-secondary text-center py-8">No feedback submitted in this room yet.</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {roomFeedbacks.map(f => (
                                    <div key={f.id} className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)' }}>
                                        <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <strong style={{ fontSize: '0.88rem' }}>{f.author}</strong>
                                                <span className={`badge badge-${f.role}`} style={{ fontSize: '0.62rem' }}>{f.role}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <small className="text-secondary" style={{ fontSize: '0.72rem' }}>{new Date(f.date).toLocaleDateString()}</small>
                                                {state.user?.role === 'admin' && (
                                                    <button 
                                                        className="btn btn-xs btn-outline" 
                                                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.1rem 0.35rem', fontSize: '0.65rem' }} 
                                                        onClick={async () => {
                                                            if (window.confirm('Delete this feedback review?')) {
                                                                try { await deleteDoc(doc(db, "feedbacks", f.id)); } catch(e) {}
                                                            }
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                                            {f.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Feedback;
