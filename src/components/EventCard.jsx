import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const EventCard = ({ event }) => {
    const { state, setState } = useAppState();
    const navigate = useNavigate();
    const isRegistered = state.user?.role === 'student' && (event.attendees || []).some(a => String(a.id) === String(state.user.id));

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

    return (
        <div className="glass-panel event-card" onClick={() => navigate(`/event/${event.id}`)} style={{ cursor: 'pointer' }}>
            <div className="event-img-container">
                <span className="event-category-badge">{event.category || 'Event'}</span>
                <span className="event-date-badge">📅 {event.date}</span>
                <img src={event.image} alt={event.title} className="event-img" onError={(e) => e.target.src = 'https://via.placeholder.com/300x180?text=Event'} />
            </div>
            <div className="event-details" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{event.title}</h3>
                <div className="event-location">📍 {event.location || 'College Campus'}</div>
                <p className="event-description text-truncate" style={{ margin: '0.5rem 0' }}>{event.desc || event.description || ''}</p>
                <div className="event-actions" onClick={e => e.stopPropagation()}>
                    {state.user?.role === 'admin' ? (
                        <div className="flex justify-between items-center" style={{ marginTop: '0.25rem' }}>
                            <span className={`badge ${event.registrationOpen ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                                {event.registrationOpen ? '● OPEN' : '● CLOSED'}
                            </span>
                            <span className="badge" style={{ background: 'var(--text-primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                                👥 {(event.attendees || []).length}
                            </span>
                        </div>
                    ) : (
                        isRegistered ? (
                            <>
                                <button className="btn btn-outline w-100" disabled>✓ Registered</button>
                                <button className="btn btn-danger w-100 mt-2" onClick={handleUnregister}>Cancel Registration</button>
                            </>
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
    );
};

export default EventCard;
