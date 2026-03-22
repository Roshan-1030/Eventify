import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';

const Feedback = () => {
    const { state, setState } = useAppState();
    const [content, setContent] = useState('');
    
    const roomFeedbacks = (state.feedbacks || [])
        .filter(f => f.roomId === state.user.roomId)
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
            <h1>Event Feedback</h1>
            <p>Share your experiences for Room: <strong style={{ color: 'var(--primary)' }}>{state.user.roomId}</strong></p>

            <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                <div className="glass-panel flex-1" style={{ minWidth: '300px' }}>
                    <h2>Submit Feedback</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mt-4">
                            <textarea 
                                className="form-control" 
                                rows="4" 
                                placeholder="Tell us about what you loved or how we can improve..." 
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Submit Feedback</button>
                    </form>
                </div>

                <div className="glass-panel flex-1" style={{ minWidth: '300px' }}>
                    <h2>Recent Feedbacks</h2>
                    <div className="mt-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {roomFeedbacks.length === 0 ? (
                            <p className="text-secondary">No feedback submitted in this room yet.</p>
                        ) : (
                            roomFeedbacks.map(f => (
                                    <div key={f.id} className="feedback-item" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                                        <div className="flex justify-between mb-1">
                                            <strong>{f.author} <span className={`badge badge-${f.role}`} style={{ marginLeft: '8px', fontSize: '0.65rem' }}>{f.role}</span></strong>
                                            <div className="flex items-center gap-2">
                                                <small className="text-secondary">{new Date(f.date).toLocaleDateString()}</small>
                                                {state.user.role === 'admin' && (
                                                    <button className="btn btn-sm btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.1rem 0.4rem', fontSize: '0.6rem' }} onClick={async () => {
                                                        if(window.confirm('Delete this feedback?')) {
                                                            try { await deleteDoc(doc(db, "feedbacks", f.id)); } catch(e) {}
                                                        }
                                                    }}>Delete</button>
                                                )}
                                            </div>
                                        </div>
                                        <p style={{ margin: 0 }}>{f.content}</p>
                                    </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Feedback;
