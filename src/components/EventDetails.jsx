import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const EventDetails = () => {
    const { id } = useParams();
    const { state, setState } = useAppState();
    const navigate = useNavigate();
    
    const event = state.events.find(e => String(e.id) === String(id));
    const isRegistered = (event?.attendees || []).some(a => String(a.id) === String(state.user?.id));
    const existingPayment = (state.payments || []).find(p => String(p.eventId) === String(event?.id) && String(p.userId) === String(state.user?.id));

    if (!event) {
        return (
            <div className="glass-panel text-center" style={{ padding: '3rem 1.5rem' }}>
                <h2>Event Not Found</h2>
                <p className="text-secondary">This event might have been removed or is no longer available.</p>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Back to Dashboard</button>
            </div>
        );
    }

    const handleRegister = async () => {
        if (state.user?.role === 'admin' || isRegistered) return;
        if (!event.registrationOpen) {
            alert("Registration is currently closed for this event.");
            return;
        }

        const newAttendee = {
            id: state.user.id,
            name: state.user.name,
            email: state.user.email
        };

        try {
            await updateDoc(doc(db, "events", String(event.id)), {
                attendees: arrayUnion(newAttendee)
            });
        } catch(e) {
            console.warn("Failed cloud register, updating local state:", e);
        }
        setState(prev => ({
            ...prev,
            events: prev.events.map(ev => String(ev.id) === String(event.id) ? { ...ev, attendees: [...(ev.attendees || []), newAttendee] } : ev)
        }));
        alert("🎉 Registration Successful!");
    };
    
    const uniqueAttendeesCount = new Set((event.attendees || []).map(a => String(a.id || a.email))).size;

    return (
        <div className="event-details-page">
            <button className="btn btn-outline btn-sm mb-4" onClick={() => navigate(-1)} style={{ borderRadius: 'var(--radius-sm)' }}>
                ← Back
            </button>
            
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Hero Banner with Responsive Image */}
                <div className="hero-image-container">
                    <img 
                        src={event.image || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20fill%3D%22%232a2a35%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22rgba%28255%2C255%2C255%2C0.5%29%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%20Provided%3C%2Ftext%3E%3C%2Fsvg%3E'} 
                        alt={event.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                            e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20fill%3D%22%232a2a35%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22rgba%28255%2C255%2C255%2C0.5%29%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%20Provided%3C%2Ftext%3E%3C%2Fsvg%3E';
                        }} 
                    />
                    <div className="hero-overlay"></div>
                    <div className="hero-caption">
                        <span className="badge badge-success mb-2" style={{ fontSize: '0.75rem' }}>{event.category || 'Event'}</span>
                        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', margin: '0 0 0.4rem 0' }}>{event.title}</h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0, fontSize: '0.85rem' }}>
                            📍 {event.location || 'Campus'} &nbsp;|&nbsp; 📅 {event.date} &nbsp;|&nbsp; ⏰ {event.time || 'All Day'}
                        </p>
                    </div>
                </div>

                {/* Content Grid */}
                <div style={{ padding: 'clamp(1.25rem, 3vw, 2.5rem)' }}>
                    <div className="grid grid-2" style={{ gap: '2rem' }}>
                        {/* Description Section */}
                        <div>
                            <h2 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>About this Event</h2>
                            <p style={{ fontSize: '1rem', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                                {event.desc || event.description || "No description provided."}
                            </p>
                        </div>

                        {/* Organizer & Action Sidebar */}
                        <div className="glass-panel" style={{ background: 'var(--bg-main)', padding: '1.5rem', height: 'fit-content' }}>
                            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                Event Summary
                            </h3>
                            
                            <div className="flex flex-col gap-2 mb-4" style={{ fontSize: '0.9rem' }}>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Lead Coordinator:</span>
                                    <strong>{event.headCoordinator || 'Admin'}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Registration:</span>
                                    <span className={`badge badge-${event.registrationOpen ? 'success' : 'danger'}`}>
                                        {event.registrationOpen ? 'Open' : 'Closed'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Entry Fee:</span>
                                    <strong>{event.fee && Number(event.fee) > 0 ? `₹${event.fee}` : 'Free'}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">RSVPs:</span>
                                    <strong>{uniqueAttendeesCount} enrolled</strong>
                                </div>
                            </div>
                            
                            {/* Student Action Controls */}
                            {state.user?.role === 'student' && (
                                <div className="flex flex-col gap-3 mt-4 pt-4 border-top">
                                    <button 
                                        className={`btn w-100 ${isRegistered ? 'btn-outline disabled' : 'btn-primary'}`} 
                                        disabled={isRegistered || !event.registrationOpen}
                                        onClick={handleRegister}
                                    >
                                        {isRegistered ? "Registered ✅" : "Register Now"}
                                    </button>
                                    
                                    {!existingPayment && isRegistered && (
                                        <button 
                                            className="btn btn-success w-100" 
                                            onClick={() => navigate(`/payment/${event.id}`)}
                                        >
                                            💳 Complete Payment (₹{event.fee || '0'})
                                        </button>
                                    )}

                                    {existingPayment && isRegistered && (
                                        <div className="mt-2 text-center">
                                            {existingPayment.ticketIssued ? (
                                                <button 
                                                    className="btn btn-primary w-100" 
                                                    style={{ background: 'var(--success-gradient)' }}
                                                    onClick={() => navigate(`/ticket/${existingPayment.id}`)}
                                                >
                                                    🎫 View Official Pass
                                                </button>
                                            ) : (
                                                <div className="p-3 rounded-lg text-center" style={{ background: 'var(--accent)', color: '#ffffff', fontSize: '0.85rem' }}>
                                                    <strong>⏳ Verification in Progress</strong>
                                                    <div style={{ opacity: 0.9, marginTop: '2px' }}>Admin will verify payment shortly.</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Admin QR Info */}
                            {state.user?.role === 'admin' && (
                                <div className="mt-4 pt-4 border-top">
                                    <h4 style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Payment QR</h4>
                                    <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                                        {event.qrUrl ? (
                                            <img src={event.qrUrl} alt="QR" style={{ width: '60px', height: '60px', objectFit: 'contain', background: '#fff', borderRadius: '6px' }} />
                                        ) : (
                                            <div className="text-secondary" style={{ fontSize: '0.75rem' }}>No QR provided</div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 800 }}>₹{event.fee || '0'}</div>
                                            <small className="text-secondary text-xs">Event Fee</small>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
