import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const EventDetails = () => {
    const { id } = useParams();
    const { state } = useAppState();
    const navigate = useNavigate();
    
    const event = state.events.find(e => String(e.id) === String(id));

    if (!event) {
        return (
            <div className="glass-panel text-center">
                <h2>Event Not Found</h2>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="event-details-page">
            <button className="btn btn-outline mb-4" onClick={() => navigate(-1)}>← Back</button>
            
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="hero-image-container" style={{ position: 'relative', height: '400px' }}>
                    <img src={event.image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.src = 'https://via.placeholder.com/800x400?text=Event'} />
                    <div className="hero-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                    <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', color: 'white' }}>
                        <span className="badge badge-success mb-2" style={{ display: 'inline-block' }}>{event.category}</span>
                        <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>{event.title}</h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>📍 {event.location} | 📅 {event.date} | ⏰ {event.time || 'All Day'}</p>
                    </div>
                </div>

                <div className="p-8" style={{ padding: '3rem' }}>
                    <div className="event-info-grid mb-8" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
                        <div>
                            <h3>Event Description</h3>
                            <p className="text-secondary" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>{event.desc || event.description}</p>
                        </div>
                        <div className="glass-panel" style={{ background: 'var(--bg-main)' }}>
                            <h3>Organizer Details</h3>
                            <p><strong>Coordinator:</strong> {event.headCoordinator || 'Admin'}</p>
                            <p><strong>Registration Status:</strong> {event.registrationOpen ? 'Open' : 'Closed'}</p>
                            <p><strong>Attendees:</strong> {(event.attendees || []).length} registered</p>
                            {event.registrationOpen && state.user?.role === 'student' && (
                                <button className="btn btn-primary w-100 mt-4">Register Now</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
