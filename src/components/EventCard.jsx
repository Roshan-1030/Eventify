import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { doc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { Html5QrcodeScanner } from 'html5-qrcode';

const EventCard = ({ event }) => {
    const { state, setState, openUserProfile } = useAppState();
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
    const isPaidEvent = Boolean(
        event && 
        event.isPaid !== false && 
        event.isPaid !== 'false' && 
        event.fee && 
        Number(event.fee) > 0 && 
        (event.isPaid === true || event.isPaid === 'true' || event.isPaid === undefined)
    );
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

    const handleOpenEditModal = () => {
        setEditData({
            ...event,
            title: event.title || '',
            date: event.date || '',
            description: event.description || event.desc || '',
            isPaid: isPaidEvent,
            fee: event.fee && Number(event.fee) > 0 ? String(event.fee) : '50',
            qrUrl: event.qrUrl || '',
            image: event.image || ''
        });
        setShowEditModal(true);
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            const isPaid = Boolean(editData.isPaid === true || (editData.fee && Number(editData.fee) > 0));
            const updatedFields = {
                title: editData.title,
                date: editData.date,
                description: editData.description,
                desc: editData.description,
                isPaid: isPaid,
                fee: isPaid ? String(editData.fee || "0") : "0",
                qrUrl: isPaid ? (editData.qrUrl || "") : "",
                image: editData.image || event.image
            };
            await updateDoc(doc(db, "events", event.id), updatedFields);
            setState(prev => ({
                ...prev,
                events: prev.events.map(ev => String(ev.id) === String(event.id) ? { ...ev, ...updatedFields } : ev)
            }));
            setShowEditModal(false);
            alert("✅ Event Updated Successfully!");
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

    const handleEditQrChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 500;
                    const scale = maxWidth / img.width;
                    if (scale >= 1) {
                        setEditData(prev => ({ ...prev, qrUrl: reader.result }));
                        return;
                    }
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setEditData(prev => ({ ...prev, qrUrl: canvas.toDataURL('image/jpeg', 0.8) }));
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
                    {isPaidEvent ? (
                        <span className="badge badge-accent" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>₹{event.fee}</span>
                    ) : (
                        <span className="badge badge-outline" style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--success)', borderColor: 'var(--success)' }}>Free</span>
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
                                    {isPaidEvent ? (
                                        <>
                                            {studentPayment?.ticketIssued ? (
                                                <button className="btn btn-success btn-sm" onClick={() => navigate(`/ticket/${studentPayment.id}`)}>
                                                    🎫 Ticket
                                                </button>
                                            ) : studentPayment ? (
                                                <button className="btn btn-outline btn-sm" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={() => navigate(`/payment/${event.id}`)}>
                                                    ⏳ Verifying
                                                </button>
                                            ) : (
                                                <button className="btn btn-success btn-sm" onClick={() => navigate(`/payment/${event.id}`)}>
                                                    💳 Pay ₹{event.fee}
                                                </button>
                                            )}
                                        </>
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

                    {isAdmin && isPaidEvent && (
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
                        <button className="btn btn-xs btn-outline admin-btn" onClick={handleOpenEditModal}>
                            ✏️ Edit
                        </button>
                        {isPaidEvent && (
                            <button className="btn btn-xs btn-success admin-btn" onClick={() => setShowScanner(true)}>
                                📷 Scanner
                            </button>
                        )}
                        <button className="btn btn-xs btn-outline admin-btn" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDeleteEvent}>
                            🗑️ Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Attendees Modal */}
            {showAttendees && createPortal(
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
                                        <div 
                                            className="clickable-user-name"
                                            style={{ fontWeight: 800, fontSize: '0.9rem' }}
                                            onClick={() => openUserProfile(student)}
                                            title="Click to view contact profile & phone number"
                                        >
                                            {student.name} 👤
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{student.email}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Payments Verification Modal */}
            {showPayments && createPortal(
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
                                                    <strong 
                                                        className="clickable-user-name"
                                                        onClick={() => openUserProfile({ id: p.userId, name: p.userName })}
                                                        title="Click to view contact profile & phone number"
                                                    >
                                                        {p.userName} 👤
                                                    </strong>
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
                </div>,
                document.body
            )}

            {/* Ticket Scanner Modal */}
            {showScanner && createPortal(
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
                                                        <strong 
                                                            className="clickable-user-name"
                                                            style={{ fontSize: '0.85rem' }}
                                                            onClick={() => openUserProfile({ id: p.userId, name: p.userName })}
                                                            title="Click to view contact profile & phone number"
                                                        >
                                                            {p.userName} 👤
                                                        </strong>
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
                </div>,
                document.body
            )}

            {/* Zoom Modal for Payment Proof */}
            {selectedScreenshot && createPortal(
                <div className="modal-overlay" style={{ zIndex: 100000 }} onClick={() => setSelectedScreenshot(null)}>
                    <div className="glass-panel text-center modal-content-panel" style={{ maxWidth: '600px', padding: '1.25rem' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-3">
                            <strong>Payment Proof Zoom</strong>
                            <button className="btn btn-sm btn-outline" onClick={() => setSelectedScreenshot(null)}>✕</button>
                        </div>
                        <img src={selectedScreenshot} alt="Payment Proof" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px' }} />
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Event Modal */}
            {showEditModal && createPortal(
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div 
                        className="glass-panel modal-content-panel" 
                        style={{ 
                            maxWidth: '560px', 
                            width: '100%', 
                            maxHeight: '92dvh', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            padding: '1.25rem' 
                        }} 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-3" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Edit Event</h2>
                                <p className="text-secondary" style={{ margin: 0, fontSize: '0.8rem' }}>Modify event information & pricing</p>
                            </div>
                            <button 
                                className="btn btn-sm btn-outline" 
                                style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }} 
                                onClick={() => setShowEditModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, paddingBottom: '0.75rem' }}>
                                <div className="form-group mb-0">
                                    <label>Event Title</label>
                                    <input type="text" className="form-control" value={editData.title || ''} onChange={e => setEditData({...editData, title: e.target.value})} required />
                                </div>
                                
                                <div className="grid grid-2 gap-3">
                                    <div className="form-group mb-0">
                                        <label>Date</label>
                                        <input type="date" className="form-control" value={editData.date || ''} onChange={e => setEditData({...editData, date: e.target.value})} required />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label>Replace Poster</label>
                                        <input type="file" className="form-control" accept="image/*" onChange={handleEditImageChange} />
                                    </div>
                                </div>

                                <div className="form-group mb-0">
                                    <label>Description</label>
                                    <textarea className="form-control" rows="3" value={editData.description || ''} onChange={e => setEditData({...editData, description: e.target.value})} required />
                                </div>

                                <div className="form-group mb-0" style={{ padding: '0.85rem', background: 'rgba(37, 99, 235, 0.04)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary)' }}>
                                    <label style={{ color: 'var(--primary)', fontWeight: 800, marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>Payment Option</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: editData.isPaid ? '0.75rem' : '0' }}>
                                        <button 
                                            type="button" 
                                            className={`btn btn-xs ${!editData.isPaid ? 'btn-primary' : 'btn-outline'}`}
                                            onClick={() => setEditData({ ...editData, isPaid: false, fee: '0' })}
                                        >
                                            🟢 Free Event
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`btn btn-xs ${editData.isPaid ? 'btn-primary' : 'btn-outline'}`}
                                            onClick={() => setEditData({ ...editData, isPaid: true, fee: editData.fee && Number(editData.fee) > 0 ? editData.fee : '50' })}
                                        >
                                            💳 Paid Event
                                        </button>
                                    </div>
                                    
                                    {editData.isPaid && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                                            <div className="form-group mb-0">
                                                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Entry Fee in ₹ *</label>
                                                <input 
                                                    type="number" 
                                                    className="form-control" 
                                                    placeholder="e.g. 50"
                                                    value={editData.fee || ''} 
                                                    onChange={e => setEditData({ ...editData, fee: e.target.value })} 
                                                    min="1" 
                                                    required
                                                />
                                            </div>
                                            
                                            <div className="form-group mb-0">
                                                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Payment QR Code (UPI / Scanner)</label>
                                                <input 
                                                    type="file" 
                                                    className="form-control" 
                                                    accept="image/*" 
                                                    onChange={handleEditQrChange} 
                                                />
                                                
                                                {editData.qrUrl ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', padding: '0.5rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                        <img 
                                                            src={editData.qrUrl} 
                                                            alt="Payment QR Preview" 
                                                            style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff' }} 
                                                        />
                                                        <div style={{ flex: 1, fontSize: '0.78rem' }}>
                                                            <strong style={{ color: 'var(--success)' }}>✓ QR Code Attached</strong>
                                                            <div style={{ color: 'var(--text-secondary)' }}>Students will scan this to pay</div>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-xs btn-outline" 
                                                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                                            onClick={() => setEditData(prev => ({ ...prev, qrUrl: '' }))}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-secondary mb-0 mt-1" style={{ fontSize: '0.74rem' }}>
                                                        ℹ️ Upload UPI QR image so students can pay when registering.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Prominent, Sticky Action Bar for Mobile & Desktop */}
                            <div 
                                style={{ 
                                    marginTop: 'auto', 
                                    paddingTop: '0.85rem', 
                                    borderTop: '1px solid var(--border)', 
                                    display: 'flex', 
                                    gap: '0.75rem', 
                                    background: 'var(--card-bg)',
                                    position: 'sticky',
                                    bottom: 0,
                                    zIndex: 10
                                }}
                            >
                                <button type="submit" className="btn btn-primary" style={{ flex: 2, minHeight: '46px', fontWeight: 800 }}>
                                    💾 Save Changes
                                </button>
                                <button type="button" className="btn btn-outline" style={{ flex: 1, minHeight: '46px', fontWeight: 700 }} onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default EventCard;
