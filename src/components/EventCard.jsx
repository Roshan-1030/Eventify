import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { doc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

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

    const isRegistered = (event.attendees || []).some(a => String(a.id) === String(state.user.id));
    const isAdmin = state.user.role === 'admin';
    const eventPayments = (state.payments || []).filter(p => String(p.eventId) === String(event.id));
    const scannedPayments = eventPayments.filter(p => p.scanned);
    
    // De-duplicate attendees just in case multiple legacy versions of their ID string existed
    const uniqueAttendees = Array.from(new Map((event.attendees || []).map(a => [String(a.id || a.email), a])).values());

    useEffect(() => {
        let scanner = null;
        if (showScanner) {
            scanner = new Html5QrcodeScanner(`qr-reader-${event.id}`, { fps: 10, qrbox: { width: 250, height: 250 } }, false);
            scanner.render(async (decodedText) => {
                scanner.pause();
                await handleScanTicket(decodedText);
                setTimeout(() => scanner.resume(), 2000);
            }, () => {});
        }
        return () => { if (scanner) scanner.clear().catch(e => {}); }
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
        try {
            await updateDoc(doc(db, "events", event.id), { registrationOpen: !event.registrationOpen });
        } catch(e) { console.error("Toggle failed:", e); }
    };

    const handleRegister = async () => {
        if (isAdmin || isRegistered) return;
        if (!event.registrationOpen) {
            alert("Registration is currently closed for this event.");
            return;
        }

        const newAttendee = { id: state.user.id, name: state.user.name, email: state.user.email };
        try {
            await updateDoc(doc(db, "events", event.id), {
                attendees: arrayUnion(newAttendee)
            });
        } catch(e) { 
            console.error(e);
            alert("Failed to register. Please try again.");
        }
    };

    const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
        try {
            await updateDoc(doc(db, "payments", paymentId), { status: newStatus });
        } catch(e) { console.error("Error updating payment status", e); }
    };

    const handleIssueTicket = async (paymentId) => {
        try {
            await updateDoc(doc(db, "payments", paymentId), { ticketIssued: true, status: 'verified' });
            alert("E-Ticket Officially Issued to the student!");
        } catch(e) { console.error("Error issuing ticket", e); }
    };

    const handleDeleteEvent = async () => {
        if (!isAdmin) return;
        if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
            try {
                await deleteDoc(doc(db, "events", event.id));
            } catch(e) { console.error("Delete failed:", e); }
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

    const handleEditQrChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 400;
                    const scale = maxWidth / img.width;
                    if (scale >= 1) { 
                       setEditData(prev => ({ ...prev, qrUrl: reader.result })); 
                       return; 
                    }
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setEditData(prev => ({ ...prev, qrUrl: canvas.toDataURL('image/jpeg', 0.7) }));
                };
            };
            reader.readAsDataURL(file);
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
                    const maxWidth = 800; // compress image
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
                        <button className={`btn ${isRegistered ? 'btn-outline' : 'btn-success'}`} style={{ flex: 1, cursor: isRegistered ? 'default' : 'pointer' }} onClick={handleRegister} disabled={isRegistered}>
                            {isRegistered ? "Registered ✅" : "Register Now"}
                        </button>
                    )}
                    {isAdmin && (
                        <button className="btn btn-success" style={{ flex: 1 }} onClick={() => setShowPayments(true)}>💸 Payments ({eventPayments.length})</button>
                    )}
                </div>

                {isAdmin && (
                    <div className="event-admin-controls">
                        <button className="btn btn-sm btn-outline admin-btn" onClick={handleToggleRegistration}>{event.registrationOpen ? "Close Reg" : "Open Reg"}</button>
                        <button className="btn btn-sm btn-outline admin-btn" onClick={() => setShowAttendees(true)}>👥 {uniqueAttendees.length} RSVPs</button>
                        <button className="btn btn-sm btn-primary admin-btn" onClick={() => setShowEditModal(true)}>✏️ Edit</button>
                        <button className="btn btn-sm btn-success admin-btn" onClick={() => setShowScanner(true)}>📷 Scan Tickets</button>
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
                            {uniqueAttendees.length === 0 ? <p className="text-secondary text-center">No students registered yet.</p> :
                                uniqueAttendees.map((student, i) => (
                                    <div key={i} className="flex justify-between p-2 border-bottom"><strong>{student.name}</strong><small>{student.email}</small></div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Payments Verification Modal */}
            {showPayments && (
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setShowPayments(false)}>
                    <div className="glass-panel" style={{ width: '95%', maxWidth: '800px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 style={{ margin: 0 }}>Payment Verification</h2>
                                <p className="text-secondary" style={{ margin: 0 }}>Review student transaction screenshots for <strong>{event.title}</strong></p>
                            </div>
                            <button className="btn" onClick={() => setShowPayments(false)}>✕</button>
                        </div>

                        <div className="payment-list mt-4">
                            {eventPayments.length === 0 ? <div className="text-center p-12 bg-main rounded-lg italic">No payments submitted for this event yet.</div> : (
                                <table className="w-100" style={{ borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr className="text-left border-bottom">
                                            <th className="p-2">Student</th>
                                            <th className="p-2">Amount</th>
                                            <th className="p-2">Screenshot</th>
                                            <th className="p-2">Status</th>
                                            <th className="p-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {eventPayments.map(p => (
                                            <tr key={p.id} className="border-bottom">
                                                <td className="p-2"><strong>{p.userName}</strong></td>
                                                <td className="p-2">₹{p.amount || '0'}</td>
                                                <td className="p-2">
                                                    <div style={{ width: '60px', height: '40px', background: '#eee', borderRadius: '4px', cursor: 'pointer', overflow: 'hidden' }} onClick={() => setSelectedScreenshot(p.screenshot)}>
                                                        <img src={p.screenshot} alt="Payment Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                </td>
                                                <td className="p-2"><span className={`badge badge-${p.status === 'verified' ? 'success' : (p.status === 'rejected' ? 'danger' : 'accent')}`}>{p.status.toUpperCase()}</span></td>
                                                <td className="p-2 flex gap-1 items-center flex-wrap">
                                                    {!p.ticketIssued && p.status === 'verified' && (
                                                        <button className="btn btn-sm btn-primary btn-xs" onClick={() => handleIssueTicket(p.id)}>🎟️ Issue Ticket</button>
                                                    )}
                                                    {p.ticketIssued && <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>TICKET ISSUED</span>}
                                                    {!p.ticketIssued && (
                                                        <>
                                                            <button className="btn btn-sm btn-outline btn-xs btn-success" onClick={() => handleUpdatePaymentStatus(p.id, 'verified')}>✓</button>
                                                            <button className="btn btn-sm btn-outline btn-xs btn-danger" onClick={() => handleUpdatePaymentStatus(p.id, 'rejected')}>✖</button>
                                                        </>
                                                    )}
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
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setShowScanner(false)}>
                    <div className="glass-panel" style={{ width: '95%', maxWidth: '800px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 style={{ margin: 0 }}>📷 Scanner Station</h2>
                                <p className="text-secondary" style={{ margin: 0 }}>Admitting attendees for: <strong>{event.title}</strong></p>
                            </div>
                            <button className="btn" onClick={() => setShowScanner(false)}>✕</button>
                        </div>
                        
                        <div className="grid grid-2 gap-8">
                            <div>
                                <h3 className="mb-4 text-center">Scan E-Ticket QR</h3>
                                <div id={`qr-reader-${event.id}`} style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
                            </div>
                            <div>
                                <h3 className="mb-4">Admitted & Present ({scannedPayments.length})</h3>
                                <div className="border p-4 rounded-lg bg-main" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                    {scannedPayments.length === 0 ? <p className="text-secondary italic text-center text-sm py-4">No tickets scanned yet.</p> : (
                                        <div className="flex flex-col gap-2">
                                            {scannedPayments.map(p => (
                                                <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border">
                                                    <div>
                                                        <strong>{p.userName}</strong>
                                                        <div className="text-secondary text-xs" style={{ fontFamily: 'monospace' }}>#{p.id.slice(0,8).toUpperCase()}</div>
                                                    </div>
                                                    <span className="badge badge-success px-2 py-1 text-xs">PRESENT</span>
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

            {/* Screenshot Preview Modal (Zoom) */}
            {selectedScreenshot && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 100000 }} onClick={() => setSelectedScreenshot(null)}>
                    <div className="glass-panel text-center" style={{ maxWidth: '90vw', maxHeight: '90vh', padding: '1rem' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <strong>Payment Proof Zoom</strong>
                            <button className="btn" onClick={() => setSelectedScreenshot(null)}>✕ Close</button>
                        </div>
                        <img src={selectedScreenshot} alt="Full Proof" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        <div className="mt-4"><button className="btn btn-primary" onClick={() => setSelectedScreenshot(null)}>Dismiss Preview</button></div>
                    </div>
                </div>
            )}

            {/* Edit Event Modal */}
            {showEditModal && (
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setShowEditModal(false)}>
                    <div className="glass-panel" style={{ width: '95%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <h2>Edit Event Details</h2>
                        <form onSubmit={handleEditSave} className="mt-4">
                            <div className="form-group"><label>Title</label><input type="text" className="form-control" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} /></div>
                            <div className="grid grid-2 gap-4">
                                <div className="form-group"><label>Date</label><input type="date" className="form-control" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} /></div>
                                <div className="form-group"><label>Event Poster Image</label><input type="file" className="form-control" accept="image/*" onChange={handleEditImageChange} /></div>
                            </div>
                            {editData.image && (
                                <div className="mb-4" style={{ height: '120px', overflow: 'hidden', borderRadius: '8px' }}>
                                    <img src={editData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                            <div className="form-group"><label>Description</label><textarea className="form-control" rows="3" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} /></div>
                            
                            <div className="form-group p-4 bg-main rounded-lg" style={{ border: '1px dashed var(--border)' }}>
                                <label style={{ fontWeight: 700, color: 'var(--primary)' }}>Payment Settings</label>
                                <div className="mt-2 flex items-center gap-4">
                                    <div style={{ flex: 1 }}>
                                        <label>Update Payment QR</label>
                                        <input type="file" className="form-control" accept="image/*" onChange={handleEditQrChange} />
                                    </div>
                                    {editData.qrUrl && (
                                        <div style={{ width: '80px', height: '80px', border: '1px solid #ddd', padding: '4px', background: 'white' }}>
                                            <img src={editData.qrUrl} alt="QuickView" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
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
