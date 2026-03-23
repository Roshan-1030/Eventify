import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../firebase/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useState } from 'react';

const EventDetails = () => {
    const { id } = useParams();
    const { state, setState } = useAppState();
    const navigate = useNavigate();
    
    const event = state.events.find(e => String(e.id) === String(id));
    const isRegistered = (event?.attendees || []).some(a => String(a.id) === String(state.user.id));
    const existingPayment = (state.payments || []).find(p => String(p.eventId) === String(event?.id) && String(p.userId) === String(state.user.id));

    if (!event) {
        return (
            <div className="glass-panel text-center">
                <h2>Event Not Found</h2>
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
            alert("Registration Successful!");
        } catch(e) {
            console.error("Failed to register:", e);
            alert("Error registering for event.");
        }
    };
    
    // Ensure accurate singular headcount
    const uniqueAttendeesCount = new Set((event.attendees || []).map(a => String(a.id || a.email))).size;

    return (
        <div className="event-details-page">
            <button className="btn btn-outline mb-4" onClick={() => navigate(-1)}>← Back</button>
            
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="hero-image-container" style={{ position: 'relative', height: '400px' }}>
                    <img src={event.image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20fill%3D%22%232a2a35%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22rgba%28255%2C255%2C255%2C0.5%29%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%20Provided%3C%2Ftext%3E%3C%2Fsvg%3E'} />
                    <div className="hero-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                    <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem', color: 'white' }}>
                        <span className="badge badge-success mb-2" style={{ display: 'inline-block' }}>{event.category}</span>
                        <h1 className="responsive-title" style={{ color: 'white', marginBottom: '0.5rem' }}>{event.title}</h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>📍 {event.location} | 📅 {event.date} | ⏰ {event.time || 'All Day'}</p>
                    </div>
                </div>

                <div className="p-8" style={{ padding: '3rem' }}>
                    <div className="grid grid-2 mb-8" style={{ gap: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
                        <div>
                            <h3>Event Description</h3>
                            <p className="text-secondary" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>{event.desc || event.description}</p>
                        </div>
                        <div className="glass-panel" style={{ background: 'var(--bg-main)' }}>
                            <p><strong>Organizer Details</strong></p>
                            <p><strong>Coordinator:</strong> {event.headCoordinator || 'Admin'}</p>
                            <p><strong>Registration Status:</strong> {event.registrationOpen ? 'Open' : 'Closed'}</p>
                            <p><strong>Attendees:</strong> {uniqueAttendeesCount} registered</p>
                            
                            {state.user?.role === 'student' && (
                                <div className="flex flex-col gap-3 mt-6">
                                    <button className={`btn w-100 ${isRegistered ? 'btn-outline disabled' : 'btn-primary'}`} 
                                            disabled={isRegistered || (!event.registrationOpen)}
                                            onClick={handleRegister}>
                                        {isRegistered ? "Registered ✅" : "Register Now"}
                                    </button>
                                    
                                    {!existingPayment && isRegistered && (
                                        <button className="btn btn-success w-100" 
                                                style={{ padding: '1.2rem', fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(40, 167, 69, 0.2)' }}
                                                onClick={() => navigate(`/payment/${event.id}`)}>
                                            💳 Complete Event Payment (₹{event.fee || '0'})
                                        </button>
                                    )}
                                    {existingPayment && isRegistered && (
                                        <div className="p-2 mt-4 text-center">
                                            {existingPayment.ticketIssued ? (
                                                <div className="flex flex-col gap-4 items-center">
                                                    <div className="p-4 rounded-xl w-100" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--success)', color: 'var(--success)' }}>
                                                        <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>✅ Seat Confirmed!</h3>
                                                        <p className="mb-0 text-sm">Official e-ticket has been issued for <strong>{existingPayment.userName}</strong>.</p>
                                                    </div>
                                                    
                                                    <button className="btn btn-primary w-100 btn-lg" 
                                                            style={{ padding: '1.2rem', gap: '0.75rem', fontSize: '1.2rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}
                                                            onClick={() => navigate(`/ticket/${existingPayment.id}`)}>
                                                        🎫 Open Official E-Ticket
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-6 rounded-xl text-center" style={{ background: 'var(--accent)', color: 'white' }}>
                                                    <div className="font-bold py-2 mb-2" style={{ fontSize: '1.2rem' }}>⏳ Verification in Progress</div>
                                                    <p className="mb-0" style={{ fontSize: '0.9rem', opacity: 0.9 }}>Admin is currently reviewing your payment screenshot. You'll get your ticket shortly!</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {state.user?.role === 'admin' && (
                                <div className="mt-8 pt-6 border-top">
                                    <h4 style={{ color: 'var(--primary)' }}>🛠️ Admin: Payment Info</h4>
                                    <div className="flex items-center gap-4 mt-4 p-4 bg-white rounded-lg shadow-sm">
                                        {event.qrUrl ? (
                                            <img src={event.qrUrl} alt="Event QR" style={{ width: '100px', height: '100px', objectFit: 'contain', border: '1px solid #eee' }} />
                                        ) : (
                                            <div className="text-secondary italic" style={{ width: '100px' }}>No QR uploaded</div>
                                        )}
                                        <div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{event.fee || '0'}</div>
                                            <small className="text-secondary text-xs uppercase">Event Entry Fee</small>
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
