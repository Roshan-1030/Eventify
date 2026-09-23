import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase.js';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import EventCard from './EventCard';

const AdminDashboard = () => {
    const { state, setState } = useAppState();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const isSubmittingRef = useRef(false);
    
    // Stats calculation & deduplicated events for this room
    const seenEventIds = new Set();
    const roomEvents = (state.events || []).filter(e => {
        if (e.roomId !== state.user.roomId) return false;
        const key = String(e.id || e._id);
        if (seenEventIds.has(key)) return false;
        seenEventIds.add(key);
        return true;
    });
    
    // Calculate total unique registrations across all events in this room
    const registrationSet = new Set();
    roomEvents.forEach(e => {
        (e.attendees || []).forEach(a => {
            registrationSet.add(`${e.id}_${a.id || a.email}`);
        });
    });
    const totalRegistrations = registrationSet.size;
    const roomStudentsCount = (state.users || []).filter(u => u.role === 'student' && u.roomId === state.user.roomId).length;
    const roomFeedbacksCount = (state.feedbacks || []).filter(fb => fb.roomId === state.user.roomId).length;

    // Distribution
    const categories = {};
    roomEvents.forEach(e => {
        const cat = e.category || 'Other';
        categories[cat] = (categories[cat] || 0) + 1;
    });

    // Form fields
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [category, setCategory] = useState("");
    const [time, setTime] = useState("");
    const [location, setLocation] = useState("");
    const [coordinator, setCoordinator] = useState("");
    const [description, setDescription] = useState("");
    const [imageBase64, setImageBase64] = useState("");
    const [eventType, setEventType] = useState("free"); // 'free' | 'paid'
    const [fee, setFee] = useState("0");
    const [qrImageBase64, setQrImageBase64] = useState("");
    const [error, setError] = useState("");

    // Resize images before Firestore Upload
    const resizeImage = (base64, maxWidth = 600) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = maxWidth / img.width;
                if (scale >= 1) return resolve(base64);
                
                canvas.width = maxWidth;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        });
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (isSubmittingRef.current || loading) return;
        isSubmittingRef.current = true;
        setError("");
        setLoading(true);

        if (!title || !date || !category || !time || !coordinator || !description) {
            setError("Please fill all required fields!");
            setLoading(false);
            isSubmittingRef.current = false;
            return;
        }

        if (eventType === 'paid' && (!fee || Number(fee) <= 0)) {
            setError("Please specify a valid entry fee greater than 0 for a paid event!");
            setLoading(false);
            isSubmittingRef.current = false;
            return;
        }

        try {
            const fallBackImage = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20fill%3D%22%232a2a35%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22rgba%28255%2C255%2C255%2C0.5%29%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%20Provided%3C%2Ftext%3E%3C%2Fsvg%3E";
            const optimizedPoster = imageBase64 ? await resizeImage(imageBase64, 800) : fallBackImage;
            const isPaid = eventType === 'paid' && Number(fee) > 0;
            const optimizedQr = isPaid && qrImageBase64 ? await resizeImage(qrImageBase64, 400) : "";

            const eventData = {
                title, date, category, time, location, description, 
                desc: description,
                headCoordinator: coordinator,
                coordinators: [{ name: coordinator, role: 'Head Coordinator' }],
                image: optimizedPoster,
                roomId: state.user.roomId,
                attendees: [],
                registrationOpen: true,
                isPaid: isPaid,
                fee: isPaid ? String(fee) : "0",
                qrUrl: optimizedQr,
                createdAt: new Date()
            };

            const docRef = await addDoc(collection(db, "events"), eventData);
            
            // Deduplicate in case onSnapshot already updated the events list
            setState(prev => {
                const alreadyExists = (prev.events || []).some(ev => String(ev.id) === String(docRef.id) || String(ev._id) === String(docRef.id));
                if (alreadyExists) return prev;
                return {
                    ...prev,
                    events: [{ ...eventData, id: docRef.id, _id: docRef.id }, ...(prev.events || [])]
                };
            });
            
            alert("✅ Event Launched Successfully!");
            setTitle(""); setDate(""); setCategory(""); setTime(""); setLocation(""); setCoordinator(""); setDescription(""); setImageBase64("");
            setEventType("free"); setFee("0"); setQrImageBase64("");
            setIsModalOpen(false);
        } catch (err) {
            console.error("Cloud upload error:", err);
            setError(`Upload Failed: ${err.message.replace("Firebase: ", "")}`);
        } finally {
            setLoading(false);
            isSubmittingRef.current = false;
        }
    };

    const handleQrChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setQrImageBase64(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImageBase64(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleShareRoom = () => {
        const shareData = {
            title: 'Join my Eventify Room!',
            text: `Join my event management room on Eventify! Room ID: ${state.user.roomId}`,
            url: window.location.origin + `/login?room=${state.user.roomId}`
        };

        if (navigator.share) {
            navigator.share(shareData).catch(err => console.log('Error sharing', err));
        } else {
            navigator.clipboard.writeText(shareData.url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
            });
        }
    };

    return (
        <div className="admin-dashboard">
            {/* Header section */}
            <div className="dashboard-header">
                <div>
                    <h1 style={{ marginBottom: '0.35rem' }}>Command Center</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Room: <strong style={{ color: 'var(--primary)' }}>{state.user.roomId}</strong>
                        </span>
                        <button 
                            className="btn btn-xs btn-outline" 
                            style={{ borderRadius: '6px' }}
                            onClick={handleShareRoom}
                        >
                            {copied ? '✅ Copied!' : '🔗 Share Room'}
                        </button>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                        + Create Event
                    </button>
                </div>
            </div>

            {/* Stats Counter Grid */}
            <div className="stats-grid">
                <div className="glass-panel stat-card">
                    <div className="stat-number">{roomEvents.length}</div>
                    <div className="stat-label">Events</div>
                </div>
                <div className="glass-panel stat-card">
                    <div className="stat-number">{totalRegistrations}</div>
                    <div className="stat-label">Student Registrations</div>
                </div>
                <div className="glass-panel stat-card">
                    <div className="stat-number">{roomStudentsCount}</div>
                    <div className="stat-label">Enrolled Students</div>
                </div>
                <div className="glass-panel stat-card">
                    <div className="stat-number">{roomFeedbacksCount}</div>
                    <div className="stat-label">Feedbacks</div>
                </div>
            </div>

            {/* Event Distribution */}
            <div className="glass-panel mb-8">
                <h3>Event Categories</h3>
                <div className="mt-4 flex flex-col gap-4">
                    {Object.entries(categories).length === 0 ? (
                        <p className="text-secondary" style={{ margin: 0 }}>No events created yet.</p>
                    ) : (
                        Object.entries(categories).map(([name, count]) => {
                            const percent = Math.round((count / Math.max(1, roomEvents.length)) * 100);
                            return (
                                <div key={name}>
                                    <div className="flex justify-between mb-1" style={{ fontSize: '0.88rem' }}>
                                        <strong>{name}</strong>
                                        <span style={{ color: 'var(--text-secondary)' }}>{count} ({percent}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary-gradient)', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Live Events Grid */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 style={{ margin: 0 }}>Live Event Management ({roomEvents.length})</h2>
                </div>
                {roomEvents.length === 0 ? (
                    <div className="glass-panel text-center" style={{ padding: '3rem 1.5rem' }}>
                        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>You haven't launched any events in this room yet.</p>
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Create First Event</button>
                    </div>
                ) : (
                    <div className="grid-cards">
                        {roomEvents.slice().reverse().map(e => <EventCard key={e.id} event={e} />)}
                    </div>
                )}
            </div>

            {/* Create Event Modal */}
            {isModalOpen && createPortal(
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div 
                        className="glass-panel modal-content-panel" 
                        style={{ 
                            maxWidth: '680px', 
                            width: '100%', 
                            maxHeight: '92dvh', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            padding: '1.25rem' 
                        }} 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.35rem' }}>Create New Event</h2>
                                <p className="text-secondary" style={{ margin: 0, fontSize: '0.82rem' }}>Launch an event for room: <strong style={{ color: 'var(--primary)' }}>{state.user.roomId}</strong></p>
                            </div>
                            <button 
                                className="btn btn-sm btn-outline" 
                                onClick={() => setIsModalOpen(false)}
                                style={{ borderRadius: '50%', width: '34px', height: '34px', padding: 0 }}
                            >
                                ✕
                            </button>
                        </div>

                        {error && <div className="p-3 mb-3 rounded-lg bg-danger text-white font-bold" style={{ fontSize: '0.85rem' }}>{error}</div>}
                        
                        <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', flex: 1, paddingBottom: '0.75rem' }}>
                                <div className="form-group mb-0">
                                    <label>Event Title *</label>
                                    <input type="text" className="form-control" placeholder="e.g. Nebula Hackathon 2026" value={title} onChange={e => setTitle(e.target.value)} required />
                                </div>

                                <div className="grid grid-2 gap-3">
                                    <div className="form-group mb-0">
                                        <label>Date *</label>
                                        <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label>Category *</label>
                                        <input type="text" className="form-control" placeholder="e.g. Technology, Cultural, Sports" value={category} onChange={e => setCategory(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="grid grid-2 gap-3">
                                    <div className="form-group mb-0">
                                        <label>Time *</label>
                                        <input type="text" className="form-control" placeholder="e.g. 10:00 AM - 4:00 PM" value={time} onChange={e => setTime(e.target.value)} required />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label>Location / Venue</label>
                                        <input type="text" className="form-control" placeholder="e.g. Main Auditorium" value={location} onChange={e => setLocation(e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-group mb-0">
                                    <label>Lead Coordinator *</label>
                                    <input type="text" className="form-control" placeholder="Coordinator Name" value={coordinator} onChange={e => setCoordinator(e.target.value)} required />
                                </div>

                                <div className="form-group mb-0">
                                    <label>Description *</label>
                                    <textarea className="form-control" rows="3" placeholder="Provide event details, schedule, requirements..." value={description} onChange={e => setDescription(e.target.value)} required />
                                </div>
                                
                                <div className="form-group mb-0">
                                    <label>Event Poster Image (Optional)</label>
                                    <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                                </div>

                                <div className="form-group mb-0" style={{ padding: '0.9rem', background: 'rgba(37, 99, 235, 0.04)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary)' }}>
                                    <label style={{ color: 'var(--primary)', fontWeight: 800, marginBottom: '0.5rem', display: 'block', fontSize: '0.85rem' }}>Event Entry & Payment Type</label>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                        <button 
                                            type="button" 
                                            className={`btn btn-sm ${eventType === 'free' ? 'btn-primary' : 'btn-outline'}`}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 700 }}
                                            onClick={() => { setEventType('free'); setFee('0'); setQrImageBase64(''); }}
                                        >
                                            🟢 Free (No Payment)
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`btn btn-sm ${eventType === 'paid' ? 'btn-primary' : 'btn-outline'}`}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 700 }}
                                            onClick={() => setEventType('paid')}
                                        >
                                            💳 Paid Event
                                        </button>
                                    </div>

                                    {eventType === 'free' ? (
                                        <div className="p-3 rounded text-sm" style={{ background: 'rgba(5, 150, 105, 0.08)', color: 'var(--success)', border: '1px solid rgba(5, 150, 105, 0.25)' }}>
                                            ✓ <strong>No Payment Required:</strong> Students will see a direct <strong>"Register"</strong> button with no payment or verification steps.
                                        </div>
                                    ) : (
                                        <div className="grid grid-2 gap-3 mt-2">
                                            <div className="form-group mb-0">
                                                <label>Entry Fee in ₹ *</label>
                                                <input 
                                                    type="number" 
                                                    className="form-control" 
                                                    placeholder="e.g. 150" 
                                                    value={fee} 
                                                    onChange={e => setFee(e.target.value)} 
                                                    min="1" 
                                                    required={eventType === 'paid'}
                                                />
                                            </div>
                                            <div className="form-group mb-0">
                                                <label>Payment QR Code (Optional)</label>
                                                <input type="file" className="form-control" accept="image/*" onChange={handleQrChange} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sticky Action Buttons */}
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
                                <button type="submit" className="btn btn-primary" style={{ flex: 2, minHeight: '46px', fontWeight: 800 }} disabled={loading}>
                                    {loading ? "☁️ Launching..." : "🚀 Launch Event"}
                                </button>
                                <button type="button" className="btn btn-outline" style={{ flex: 1, minHeight: '46px', fontWeight: 700 }} onClick={() => setIsModalOpen(false)}>
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

export default AdminDashboard;
