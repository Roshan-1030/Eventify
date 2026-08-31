import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { doc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { Html5QrcodeScanner } from 'html5-qrcode';

const EventCard = ({ event }) => {
    const { state, setState } = useAppState();
    const navigate = useNavigate();
    const [showAttendees, setShowAttendees] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPayments, setShowPayments] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [selectedScreenshot, setSelectedScreenshot] = useState(null);

    // Edit Form State
    const [editData, setEditData] = useState({ ...event });

    const isRegistered = (event.attendees || []).some(a => String(a.id) === String(state.user?.id));
    const isAdmin = state.user?.role === 'admin';
    const eventPayments = (state.payments || []).filter(p => String(p.eventId) === String(event.id));
    const scannedPayments = eventPayments.filter(p => p.scanned);
    
    // De-duplicate attendees
    const uniqueAttendees = Array.from(new Map((event.attendees || []).map(a => [String(a.id || a.email), a])).values());

    useEffect(() => {
        let scanner = null;
        if (showScanner) {
            scanner = new Html5QrcodeScanner(`qr-reader-${event.id}`, { fps: 10, qrbox: { width: 220, height: 220 } }, false);
            scanner.render(async (decodedText) => {
                scanner.pause();
                await handleScanTicket(decodedText);
                setTimeout(() => scanner.resume(), 2000);
            }, () => {});
        }
        return () => { if (scanner) scanner.clear().catch(() => {}); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showScanner]);

    const handleScanTicket = async (ticketId) => {
        const pmt = eventPayments.find(p => String(p.id) === String(ticketId));
        if (!pmt) {
            alert("❌ Invalid Ticket: Not found for this event.");
            return;
        }
        if (pmt.scanned) {
            alert(`⚠️ ALREADY ADMITTED: ${pmt.userName} has already been scanned!`);
            return;
        }
        try {
            await updateDoc(doc(db, "payments", pmt.id), { scanned: true, scannedAt: new Date().toISOString() });
            alert(`✅ SUCCESS! ${pmt.userName} is admitted to ${event.title}.`);
        } catch(e) { console.error(e); }
    };

    const handleToggleRegistration = async () => {
        if (!isAdmin) return;
        const newStatus = !event.registrationOpen;
        try {
            await updateDoc(doc(db, "events", String(event.id)), { registrationOpen: newStatus });
        } catch(e) { console.warn("Toggle failed on cloud, updating local state:", e); }
        setState(prev => ({
            ...prev,
            events: prev.events.map(ev => String(ev.id) === String(event.id) ? { ...ev, registrationOpen: newStatus } : ev)
        }));
    };

    const handleRegister = async () => {
        if (isAdmin || isRegistered) return;
        if (!event.registrationOpen) {
            alert("Registration is currently closed for this event.");
            return;
        }

        const newAttendee = { id: state.user.id, name: state.user.name, email: state.user.email };
        try {
            await updateDoc(doc(db, "events", String(event.id)), {
                attendees: arrayUnion(newAttendee)
            });
        } catch(e) { 
            console.warn("Cloud registration failed, using local state:", e);
        }
        setState(prev => ({
            ...prev,
            events: prev.events.map(ev => String(ev.id) === String(event.id) ? { ...ev, attendees: [...(ev.attendees || []), newAttendee] } : ev)
        }));
        alert("🎉 Registration Successful!");
    };

    const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
        try {
            await updateDoc(doc(db, "payments", paymentId), { status: newStatus });
        } catch(e) { console.error("Error updating payment status", e); }
        setState(prev => ({
            ...prev,
            payments: (prev.payments || []).map(p => String(p.id) === String(paymentId) ? { ...p, status: newStatus } : p)
        }));
    };

    const handleIssueTicket = async (paymentId) => {
        try {
            await updateDoc(doc(db, "payments", paymentId), { ticketIssued: true, status: 'verified' });
        } catch(e) { console.error("Error issuing ticket", e); }
        setState(prev => ({
            ...prev,
            payments: (prev.payments || []).map(p => String(p.id) === String(paymentId) ? { ...p, ticketIssued: true, status: 'verified' } : p)
        }));
        alert("🎟️ E-Ticket Officially Issued to the student!");
    };

    const handleDeleteEvent = async () => {
        if (!isAdmin) return;
        if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
            try {
                await deleteDoc(doc(db, "events", String(event.id)));
            } catch(e) { console.error("Delete failed on cloud:", e); }
            setState(prev => ({
                ...prev,
                events: prev.events.filter(ev => String(ev.id) !== String(event.id))
            }));
        }
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, "events", event.id), {
                title: editData.title,
                date: editData.date,
                description: editData.description,
                qrUrl: editData.qrUrl || "",
                image: editData.image || event.image
            });
            setShowEditModal(false);
        } catch(err) {
            console.error("Failed to update event details:", err);
            alert("Failed to save changes.");
        }
    };

    const handleEditImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 800;
                    const scale = maxWidth / img.width;
                    if (scale >= 1) { 
                       setEditData(prev => ({ ...prev, image: reader.result })); 
                       return; 
                    }
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setEditData(prev => ({ ...prev, image: canvas.toDataURL('image/jpeg', 0.7) }));
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const studentPayment = eventPayments.find(p => String(p.userId) === String(state.user?.id));

    return (
        <div className="event-card glass-panel">
            <div className="event-img-container">
                <img 
                    src={event.image || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20fill%3D%22%232a2a35%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22rgba%28255%2C255%2C255%2C0.5%29%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E'} 
                    alt={event.title} 
                    className="event-img"
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20fill%3D%22%232a2a35%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22rgba%28255%2C255%2C255%2C0.5%29%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
                    }} 
                />
                <div className="event-category-badge">{event.category || 'General'}</div>
                <div className="event-date-badge">{new Date(event.date).toLocaleDateString()}</div>
                {!event.registrationOpen && (
                    <div className="badge badge-danger" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, fontSize: '0.68rem' }}>
                        CLOSED
                    </div>
                )}
            </div>

            <div className="event-details">
                <h3>{event.title}</h3>
                <div className="event-location">
                    <span>📍 {event.location || 'College Campus'}</span>
                    {event.fee && Number(event.fee) > 0 && (
                        <span className="badge badge-accent" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>₹{event.fee}</span>
                    )}
                </div>
                <p className="event-description text-truncate" style={{ height: '3.4rem' }}>
                    {event.desc || event.description}
                </p>

                <div className="event-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/event/${event.id}`)}>
                        Details
                    </button>

                    {!isAdmin && (
                        <>
                            {isRegistered ? (
                                <>
                                    {studentPayment?.ticketIssued ? (
                                        <button className="btn btn-success btn-sm" onClick={() => navigate(`/ticket/${studentPayment.id}`)}>
                                            🎫 Ticket
                                        </button>
                                    ) : (
                                        <button className="btn btn-outline btn-sm disabled" disabled>
                                            Registered ✅
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button className="btn btn-primary btn-sm" onClick={handleRegister} disabled={!event.registrationOpen}>
                                    {event.registrationOpen ? "Register" : "Closed"}
                                </button>
                            )}
                        </>
                    )}

                    {isAdmin && (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowPayments(true)}>
                            💸 Payments ({eventPayments.length})
                        </button>
                    )}
                </div>

                {isAdmin && (
                    <div className="event-admin-controls">
                        <button className="btn btn-xs btn-outline admin-btn" onClick={handleToggleRegistration}>
                            {event.registrationOpen ? "🔒 Close" : "🔓 Open"}
                        </button>
                        <button className="btn btn-xs btn-outline admin-btn" onClick={() => setShowAttendees(true)}>
                            👥 {uniqueAttendees.length} RSVPs
                        </button>
                        <button className="btn btn-xs btn-outline admin-btn" onClick={() => setShowEditModal(true)}>
                            ✏️ Edit
                        </button>
                        <button className="btn btn-xs btn-success admin-btn" onClick={() => setShowScanner(true)}>
                            📷 Scanner
                        </button>
                        <button className="btn btn-xs btn-outline admin-btn" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDeleteEvent}>
                            🗑️ Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Attendees Modal */}
            {showAttendees && (
                <div className="modal-overlay" onClick={() => setShowAttendees(false)}>
                    <div className="glass-panel modal-content-panel" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 style={{ margin: 0 }}>Event RSVPs ({uniqueAttendees.length})</h2>
                            <button className="btn btn-sm btn-outline" style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }} onClick={() => setShowAttendees(false)}>✕</button>
                        </div>
                        <div className="flex flex-col gap-2" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {uniqueAttendees.length === 0 ? (
                                <p className="text-secondary text-center py-6">No students registered yet.</p>
                            ) : (
                                uniqueAttendees.map((student, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 rounded" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{student.name}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{student.email}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Payments Verification Modal */}
            {showPayments && (
                <div className="modal-overlay" onClick={() => setShowPayments(false)}>
                    <div className="glass-panel modal-content-panel" style={{ maxWidth: '820px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 style={{ margin: 0 }}>Payment Verification</h2>
                                <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem' }}>{event.title}</p>
                            </div>
                            <button className="btn btn-sm btn-outline" style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }} onClick={() => setShowPayments(false)}>✕</button>
                        </div>

                        <div className="table-container">
                            {eventPayments.length === 0 ? (
                                <div className="text-center p-8 text-secondary">No payments submitted for this event yet.</div>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Amount</th>
                                            <th>Proof</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {eventPayments.map(p => (
                                            <tr key={p.id}>
                                                <td>
                                                    <strong>{p.userName}</strong>
                                                </td>
                                                <td>₹{p.amount || '0'}</td>
                                                <td>
                                                    {p.screenshot ? (
                                                        <div 
                                                            style={{ width: '50px', height: '36px', background: '#eee', borderRadius: '4px', cursor: 'pointer', overflow: 'hidden' }} 
                                                            onClick={() => setSelectedScreenshot(p.screenshot)}
                                                        >
                                                            <img src={p.screenshot} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                    ) : (
                                                        <span className="text-secondary text-xs">None</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${p.status === 'verified' ? 'success' : (p.status === 'rejected' ? 'danger' : 'accent')}`}>
                                                        {p.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex gap-1 items-center flex-wrap">
                                                        {!p.ticketIssued && p.status === 'verified' && (
                                                            <button className="btn btn-primary btn-xs" onClick={() => handleIssueTicket(p.id)}>
                                                                🎟️ Issue Ticket
                                                            </button>
                                                        )}
                                                        {p.ticketIssued && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>ISSUED</span>}
                                                        {!p.ticketIssued && (
                                                            <>
                                                                <button className="btn btn-success btn-xs" onClick={() => handleUpdatePaymentStatus(p.id, 'verified')}>✓</button>
                                                                <button className="btn btn-danger btn-xs" onClick={() => handleUpdatePaymentStatus(p.id, 'rejected')}>✕</button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Ticket Scanner Modal */}
            {showScanner && (
                <div className="modal-overlay" onClick={() => setShowScanner(false)}>
                    <div className="glass-panel modal-content-panel" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 style={{ margin: 0 }}>📷 Scanner Station</h2>
                                <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem' }}>{event.title}</p>
                            </div>
                            <button className="btn btn-sm btn-outline" style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }} onClick={() => setShowScanner(false)}>✕</button>
                        </div>
                        
                        <div className="grid grid-2 gap-6">
                            <div>
                                <h3 style={{ fontSize: '1rem', textAlign: 'center', marginBottom: '0.75rem' }}>Scan Pass QR</h3>
                                <div id={`qr-reader-${event.id}`} style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Admitted ({scannedPayments.length})</h3>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(0,0,0,0.03)', borderRadius: '10px' }}>
                                    {scannedPayments.length === 0 ? (
                                        <p className="text-secondary text-center text-sm py-4">No tickets scanned yet.</p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {scannedPayments.map(p => (
                                                <div key={p.id} className="flex justify-between items-center p-2 rounded" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                                                    <div>
                                                        <strong style={{ fontSize: '0.85rem' }}>{p.userName}</strong>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>#{p.id.slice(0,8).toUpperCase()}</div>
                                                    </div>
                                                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>PRESENT</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Zoom Modal for Payment Proof */}
            {selectedScreenshot && (
                <div className="modal-overlay" style={{ zIndex: 100000 }} onClick={() => setSelectedScreenshot(null)}>
                    <div className="glass-panel text-center modal-content-panel" style={{ maxWidth: '600px', padding: '1.25rem' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-3">
                            <strong>Payment Proof Zoom</strong>
                            <button className="btn btn-sm btn-outline" onClick={() => setSelectedScreenshot(null)}>✕</button>
                        </div>
                        <img src={selectedScreenshot} alt="Payment Proof" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px' }} />
                    </div>
                </div>
            )}

            {/* Edit Event Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="glass-panel modal-content-panel" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 style={{ margin: 0 }}>Edit Event</h2>
                            <button className="btn btn-sm btn-outline" onClick={() => setShowEditModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleEditSave} className="flex flex-col gap-3">
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" className="form-control" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} required />
                            </div>
                            <div className="grid grid-2 gap-3">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" className="form-control" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>Replace Poster</label>
                                    <input type="file" className="form-control" accept="image/*" onChange={handleEditImageChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-control" rows="3" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} required />
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
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
