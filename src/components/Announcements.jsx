import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';

const Announcements = () => {
    const { state, setState } = useAppState();
    const isStudent = state.user?.role === 'student';
    const roomAnnouncements = (state.announcements || [])
        .filter(a => a.roomId === state.user.roomId)
        .sort((a,b) => new Date(b.date) - new Date(a.date));

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [type, setType] = useState('general');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedEvent, setSelectedEvent] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !message) {
            alert("Please fill in both title and message.");
            return;
        }

        let finalTitle = title;
        if (type === 'reminder') {
            if (!selectedEvent) {
                alert("Please select an event for the reminder.");
                return;
            }
            finalTitle = `[Reminder: ${selectedEvent}] ` + title;
        }

        const newAnn = {
            id: Date.now(),
            roomId: state.user.roomId,
            type,
            title: finalTitle,
            message,
            date: new Date().toISOString()
        };

        setState(prev => ({
            ...prev,
            announcements: [...(prev.announcements || []), newAnn]
        }));

        setTitle(''); setMessage(''); setType('general'); setSelectedEvent('');
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (!window.confirm('Delete this announcement?')) return;
        setState(prev => ({
            ...prev,
            announcements: prev.announcements.filter(a => a.id !== id)
        }));
    };

    return (
        <div className="announcements-page">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1>📢 Announcements</h1>
                    <p>Stay updated with the latest news and event reminders.</p>
                </div>
                {!isStudent && <button className="btn btn-primary" onClick={() => setIsModalOpen(!isModalOpen)}>+ New Announcement</button>}
            </div>

            {roomAnnouncements.length === 0 ? (
                <div className="glass-panel text-center text-secondary"><p>No announcements yet.</p></div>
            ) : (
                <div className="grid-cards" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    {roomAnnouncements.map(a => (
                        <div key={a.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid var(${a.type === 'reminder' ? '--accent' : '--primary'})` }}>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="badge" style={{ background: `var(${a.type === 'reminder' ? '--accent' : '--primary'})`, color: 'white' }}>
                                        {a.type === 'reminder' ? '⏰ Reminder' : '📢 General'}
                                    </span>
                                    <small className="text-secondary">{new Date(a.date).toLocaleString()}</small>
                                </div>
                                {!isStudent && <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(a.id)}>Delete</button>}
                            </div>
                            <h3 style={{ marginBottom: '0.5rem' }}>{a.title}</h3>
                            <p style={{ marginBottom: 0, color: 'var(--text-primary)' }}>{a.message}</p>
                        </div>
                    ))}
                </div>
            )}

            {!isStudent && isModalOpen && (
                <div className="glass-panel mt-8">
                    <h2>Send Announcement / Reminder</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mt-4">
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
                            <label>Announcement Title</label>
                            <input type="text" className="form-control" placeholder="e.g. Schedule Change" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label>Message</label>
                            <textarea className="form-control" rows="4" placeholder="Write your message here..." value={message} onChange={e => setMessage(e.target.value)} required />
                        </div>

                        <div className="flex gap-2">
                            <button type="submit" className="btn btn-primary">Send to Room</button>
                            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Announcements;
