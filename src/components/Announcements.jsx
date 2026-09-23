import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { formatDateTime } from '../utils/dateUtils';

const Announcements = () => {
    const { state, openUserProfile } = useAppState();
    const isStudent = state.user?.role === 'student';
    const roomAnnouncements = (state.announcements || [])
        .filter(a => a.roomId === state.user?.roomId)
        .sort((a,b) => new Date(b.date) - new Date(a.date));

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [type, setType] = useState('general');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedEvent, setSelectedEvent] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            alert("Please fill in both title and message.");
            return;
        }

        let finalTitle = title.trim();
        if (type === 'reminder') {
            if (!selectedEvent) {
                alert("Please select an event for the reminder.");
                return;
            }
            finalTitle = `[Reminder: ${selectedEvent}] ` + finalTitle;
        }

        const newAnn = {
            roomId: state.user.roomId,
            author: state.user.name,
            authorId: state.user.id,
            type,
            title: finalTitle,
            message: message.trim(),
            date: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "announcements"), newAnn);
            setTitle(''); setMessage(''); setType('general'); setSelectedEvent('');
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to post:", err);
            alert("Upload failed.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            await deleteDoc(doc(db, "announcements", id));
        } catch (err) { console.error(err); }
    };

    return (
        <div className="announcements-page">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ marginBottom: '0.35rem' }}>📢 Announcements</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        Official alerts and updates for Room: <strong style={{ color: 'var(--primary)' }}>{state.user?.roomId}</strong>
                    </p>
                </div>
                {!isStudent && (
                    <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                        + New Announcement
                    </button>
                )}
            </div>

            {/* Create Announcement Modal */}
            {isModalOpen && !isStudent && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="glass-panel modal-content-panel" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 style={{ margin: 0 }}>New Announcement</h2>
                            <button className="btn btn-sm btn-outline" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <div className="form-group">
                                <label>Message Type</label>
                                <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                                    <option value="general">📢 General Announcement (To All Students)</option>
                                    <option value="reminder">⏰ Event Reminder</option>
                                </select>
                            </div>
                            
                            {type === 'reminder' && (
                                <div className="form-group">
                                    <label>Select Event</label>
                                    <select className="form-control" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} required>
                                        <option value="">-- Choose an Event --</option>
                                        {state.events.filter(ev => ev.roomId === state.user.roomId).map(ev => (
                                            <option key={ev.id} value={ev.title}>{ev.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Title *</label>
                                <input type="text" className="form-control" placeholder="e.g. Venue Change or Schedule Update" value={title} onChange={e => setTitle(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label>Message *</label>
                                <textarea className="form-control" rows="4" placeholder="Write full details here..." value={message} onChange={e => setMessage(e.target.value)} required />
                            </div>

                            <div className="flex gap-2 mt-2">
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Send to Room</button>
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            {roomAnnouncements.length === 0 ? (
                <div className="glass-panel text-center" style={{ padding: '3rem 1.5rem' }}>
                    <p className="text-secondary" style={{ margin: 0 }}>No announcements posted in this room yet.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {roomAnnouncements.map(a => (
                        <div 
                            key={a.id} 
                            className="glass-panel" 
                            style={{ 
                                padding: '1.25rem', 
                                borderLeft: `4px solid ${a.type === 'reminder' ? 'var(--accent)' : 'var(--primary)'}` 
                            }}
                        >
                            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`badge ${a.type === 'reminder' ? 'badge-accent' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                                        {a.type === 'reminder' ? '⏰ Reminder' : '📢 General'}
                                    </span>
                                    {Date.now() - new Date(a.date).getTime() < 86400000 && (
                                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✨ New</span>
                                    )}
                                    <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                        {formatDateTime(a.date)}
                                        {a.author && (
                                            <span> • Posted by <span 
                                                className="clickable-user-name" 
                                                style={{ fontSize: '0.75rem', fontWeight: 700 }}
                                                onClick={() => openUserProfile({ id: a.authorId, name: a.author })}
                                                title="Click to view author contact & phone number"
                                            >
                                                {a.author} 👤
                                            </span></span>
                                        )}
                                    </small>
                                </div>
                                {!isStudent && (
                                    <button 
                                        className="btn btn-xs btn-outline" 
                                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} 
                                        onClick={() => handleDelete(a.id)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                            <h3 style={{ marginBottom: '0.4rem', fontSize: '1.15rem' }}>{a.title}</h3>
                            <p style={{ marginBottom: 0, color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                                {a.message}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Announcements;
