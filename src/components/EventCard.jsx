import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const EventCard = ({ event }) => {
    const { state, setState } = useAppState();
    const navigate = useNavigate();
    const [showAttendees, setShowAttendees] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Edit Form State
    const [editData, setEditData] = useState({ ...event });

    const isRegistered = (event.attendees || []).some(a => String(a.id) === String(state.user.id));
    const isAdmin = state.user.role === 'admin';

    const handleToggleRegistration = () => {
        if (!isAdmin) return;
        const eventsCopy = [...state.events];
        const idx = eventsCopy.findIndex(e => e.id === event.id);
        eventsCopy[idx] = { ...eventsCopy[idx], registrationOpen: !eventsCopy[idx].registrationOpen };
        setState(prev => ({ ...prev, events: eventsCopy }));
    };

    const handleDeleteEvent = () => {
        if (!isAdmin) return;
        if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
            const eventsCopy = state.events.filter(e => e.id !== event.id);
            setState(prev => ({ ...prev, events: eventsCopy }));
        }
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        const eventsCopy = [...state.events];
        const idx = eventsCopy.findIndex(e => e.id === event.id);
        eventsCopy[idx] = { ...editData };
        setState(prev => ({ ...prev, events: eventsCopy }));
        setShowEditModal(false);
    };

    return (
        <div className="event-card glass-panel">
            <div className="event-img-container">
                <img src={event.image} alt={event.title} className="event-img" />
                <div className="event-category-badge">{event.category}</div>
                <div className="event-date-badge">{new Date(event.date).toLocaleDateString()}</div>
                {!event.registrationOpen && (
                    <div className="badge" style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--danger)', color: 'white', zIndex: 10 }}>REGISTRATION CLOSED</div>
                )}
            </div>

            <div className="event-details">
                <h3>{event.title}</h3>
                <div className="event-location" style={{ marginBottom: '1rem' }}>
                    <span>📍 {event.location || 'College Campus'}</span>
                </div>
                <p className="event-description text-truncate" style={{ height: '3.6rem', marginBottom: '1.5rem' }}>
                    {event.description}
                </p>

                <div className="event-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate(`/event/${event.id}`)}>Details</button>
                    {!isAdmin && (
                        <button className={`btn ${isRegistered ? 'btn-outline' : 'btn-success'}`} style={{ flex: 1, opacity: (!event.registrationOpen && !isRegistered) ? 0.5 : 1 }}>
                            {isRegistered ? "Unregister" : "Register Now"}
                        </button>
                    )}
                </div>

                {isAdmin && (
                    <div className="event-admin-controls">
                        <button className="btn btn-sm btn-outline admin-btn" onClick={handleToggleRegistration}>
                            {event.registrationOpen ? "Close Reg" : "Open Reg"}
                        </button>
                        <button className="btn btn-sm btn-outline admin-btn" onClick={() => setShowAttendees(true)}>👥 {event.attendees?.length || 0} RSVPs</button>
                        <button className="btn btn-sm btn-primary admin-btn" onClick={() => setShowEditModal(true)}>✏️ Edit Event</button>
                        <button className="btn btn-sm btn-outline admin-btn" onClick={handleDeleteEvent}>🗑️ Delete</button>
                    </div>
                )}
            </div>

            {/* Attendees Modal */}
            {showAttendees && (
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setShowAttendees(false)}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 style={{ margin: 0 }}>Attendees</h2>
                            <button className="btn" onClick={() => setShowAttendees(false)}>✕</button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {(!event.attendees || event.attendees.length === 0) ? (
                                <p className="text-secondary text-center">No students registered yet.</p>
                            ) : (
                                event.attendees.map((student, i) => (
                                    <div key={i} className="flex justify-between p-2 border-bottom">
                                        <strong>{student.name}</strong>
                                        <small>{student.email}</small>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setShowEditModal(false)}>
                    <div className="glass-panel" style={{ width: '95%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <h2>Edit Event</h2>
                        <form onSubmit={handleEditSave} className="mt-4">
                            <div className="form-group"><label>Title</label><input type="text" className="form-control" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} /></div>
                            <div className="form-group"><label>Date</label><input type="date" className="form-control" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} /></div>
                            <div className="form-group"><label>Description</label><textarea className="form-control" rows="3" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} /></div>
                            <div className="flex gap-2">
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventCard;
