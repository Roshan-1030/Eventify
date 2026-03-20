import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const EventCard = ({ event }) => {
    const { state, setState } = useAppState();
    const navigate = useNavigate();
    const [showAttendees, setShowAttendees] = useState(false);
    
    const isRegistered = state.user?.role === 'student' && (event.attendees || []).some(a => String(a.id) === String(state.user.id));
    const isAdmin = state.user?.role === 'admin';

    const handleRegister = (e) => {
        e.stopPropagation();
        if (!state.user) return;
        
        const eventsCopy = [...state.events];
        const idx = eventsCopy.findIndex(ev => ev.id === event.id);
        const attendees = [...(eventsCopy[idx].attendees || [])];
        
        if (!attendees.some(a => String(a.id) === String(state.user.id))) {
            attendees.push({
                id: state.user.id,
                name: state.user.name,
                email: state.user.email
            });
            eventsCopy[idx] = { ...eventsCopy[idx], attendees };
            setState(prev => ({ ...prev, events: eventsCopy }));
            alert("Successfully registered for " + event.title);
        }
    };

    const handleUnregister = (e) => {
        e.stopPropagation();
        if (!state.user) return;
        if (!window.confirm("Are you sure you want to cancel your registration?")) return;

        const eventsCopy = [...state.events];
        const idx = eventsCopy.findIndex(ev => ev.id === event.id);
        const attendees = (eventsCopy[idx].attendees || []).filter(a => String(a.id) !== String(state.user.id));
        
        eventsCopy[idx] = { ...eventsCopy[idx], attendees };
        setState(prev => ({ ...prev, events: eventsCopy }));
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this event forever? This cannot be undone.")) return;
        setState(prev => ({ ...prev, events: prev.events.filter(ev => ev.id !== event.id) }));
    };

    const toggleRegistration = (e) => {
        e.stopPropagation();
        const eventsCopy = [...state.events];
        const idx = eventsCopy.findIndex(ev => ev.id === event.id);
        eventsCopy[idx] = { ...eventsCopy[idx], registrationOpen: !eventsCopy[idx].registrationOpen };
        setState(prev => ({ ...prev, events: eventsCopy }));
    };

    return (
        <>
            <div className="glass-panel event-card" onClick={() => navigate(`/event/${event.id}`)} style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
                <div className="event-img-container" style={{ position: 'relative', height: '180px' }}>
                    <span className="event-category-badge" style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>{event.category || 'Event'}</span>
                    <span className="event-date-badge" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}>📅 {event.date}</span>
                    <img src={event.image} alt={event.title} className="event-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.src = 'https://via.placeholder.com/300x180?text=Event'} />
                </div>
                <div className="event-details" style={{ padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{event.title}</h3>
                    <div className="event-location" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {event.location || 'College Campus'}</div>
                    <p className="event-description text-truncate" style={{ margin: '0.5rem 0', height: '3em', overflow: 'hidden' }}>{event.desc || event.description || ''}</p>
                    
                    <div className="event-actions" onClick={e => e.stopPropagation()}>
                        {isAdmin ? (
                            <div className="flex flex-col gap-2 mt-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`badge ${event.registrationOpen ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                                        {event.registrationOpen ? '● Registration Open' : '● Closed'}
                                    </span>
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>👥 {(event.attendees || []).length}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button className="btn btn-outline flex-1" style={{ padding: '0.4rem', fontSize: '0.75rem' }} onClick={toggleRegistration}>
                                        {event.registrationOpen ? 'Close Reg' : 'Open Reg'}
                                    </button>
                                    <button className="btn btn-outline flex-1" style={{ padding: '0.4rem', fontSize: '0.75rem' }} onClick={() => setShowAttendees(true)}>
                                        View All
                                    </button>
                                    <button className="btn btn-outline" style={{ padding: '0.4rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDelete}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ) : (
                            isRegistered ? (
                                <div className="flex flex-col gap-2">
                                    <button className="btn btn-outline w-100" disabled style={{ background: 'var(--success-gradient)', color: 'white', border: 'none' }}>✓ Registered</button>
                                    <button className="btn btn-link w-100 text-danger" style={{ fontSize: '0.8rem' }} onClick={handleUnregister}>Cancel Participation</button>
                                </div>
                            ) : (
                                event.registrationOpen ? (
                                    <button className="btn btn-primary w-100" onClick={handleRegister}>Register Now</button>
                                ) : (
                                    <button className="btn btn-outline w-100" disabled style={{ opacity: 0.6, borderColor: 'var(--danger)', color: 'var(--danger)' }}>Registration Closed</button>
                                )
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Attendees Modal */}
            {showAttendees && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAttendees(false)}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 pb-4 border-bottom">
                            <h2 style={{ margin: 0 }}>Attendees: {event.title}</h2>
                            <button className="btn" onClick={() => setShowAttendees(false)}>✕</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {(event.attendees || []).length === 0 ? (
                                <p className="text-secondary text-center py-8">No one has registered yet.</p>
                            ) : (
                                <table style={{ width: '100%', textAlign: 'left' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'var(--card-bg)' }}>
                                        <tr>
                                            <th style={{ padding: '0.5rem' }}>Name</th>
                                            <th style={{ padding: '0.5rem' }}>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {event.attendees.map(a => (
                                            <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{a.name}</td>
                                                <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>{a.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-top">
                            <button className="btn btn-outline w-100" onClick={() => setShowAttendees(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EventCard;
