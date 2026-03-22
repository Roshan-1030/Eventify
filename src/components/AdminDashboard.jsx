import React, { useState } from 'react';
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

    
    // Stats calc
    const roomEvents = (state.events || []).filter(e => e.roomId === state.user.roomId);
    
    // Calculate total unique registrations across all events in this room
    const registrationSet = new Set();
    roomEvents.forEach(e => {
        (e.attendees || []).forEach(a => {
            // Combine event ID and student ID/email to create a unique registration key
            registrationSet.add(`${e.id}_${a.id || a.email}`);
        });
    });
    const totalRegistrations = registrationSet.size;
    const roomStudentsCount = (state.users || []).filter(u => u.role === 'student' && u.roomId === state.user.roomId).length;
    const roomFeedbacksCount = (state.feedbacks || []).filter(fb => fb.roomId === state.user.roomId).length;
    const roomChatsCount = (state.chats || []).filter(c => c.roomId === state.user.roomId).length;

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
    const [fee, setFee] = useState("0");
    const [qrImageBase64, setQrImageBase64] = useState("");
    const [error, setError] = useState("");

    // 🔬 Utility to resize images before Firestore Upload (avoids 1MB limit)
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
                resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compressing to JPEG 70%
            };
        });
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!title || !date || !category || !time || !coordinator || !description) {
            setError("Please fill all required fields!");
            setLoading(false);
            return;
        }

        try {
            // 🧠 Resize images before sending to cloud to keep document under 1MB
            const fallBackImage = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20fill%3D%22%232a2a35%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22rgba%28255%2C255%2C255%2C0.5%29%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%20Provided%3C%2Ftext%3E%3C%2Fsvg%3E";
            const optimizedPoster = imageBase64 ? await resizeImage(imageBase64, 800) : fallBackImage;
            const optimizedQr = qrImageBase64 ? await resizeImage(qrImageBase64, 400) : "";

            const eventData = {
                title, date, category, time, location, description, 
                desc: description,
                headCoordinator: coordinator,
                coordinators: [{ name: coordinator, role: 'Head Coordinator' }],
                image: optimizedPoster,
                roomId: state.user.roomId,
                attendees: [],
                registrationOpen: true,
                fee: fee || "0",
                qrUrl: optimizedQr,
                createdAt: new Date()
            };

            // ☁️ Save to Firestore instead of LocalStorage to avoid 5MB quota crash
            await addDoc(collection(db, "events"), eventData);
            
            alert("✅ Event Launched Successfully!");
            setTitle(""); setDate(""); setCategory(""); setTime(""); setLocation(""); setCoordinator(""); setDescription(""); setImageBase64("");
            setFee("0"); setQrImageBase64("");
            setIsModalOpen(false);
        } catch (err) {
            console.error("🔥 CLOUD UPLOAD ERROR:", err);
            setError(`Upload Failed: ${err.message.replace("Firebase: ", "")}`);
        } finally {
            setLoading(false);
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

    const clearRoomData = async (type) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY clear all room ${type}?`)) return;
        
        try {
            if (type === 'chats') {
                const toDelete = (state.chats || []).filter(c => c.roomId === state.user.roomId);
                for (let c of toDelete) await deleteDoc(doc(db, "chats", c.id));
            } else if (type === 'feedbacks') {
                const toDelete = (state.feedbacks || []).filter(c => c.roomId === state.user.roomId);
                for (let c of toDelete) await deleteDoc(doc(db, "feedbacks", c.id));
            }
        } catch(e) { console.error("Failed to clear data:", e); }
    };

    const handleShareRoom = () => {
        const shareData = {
            title: 'Join my Eventify Room!',
            text: `Join my event management room on Eventify! Room ID: ${state.user.roomId}`,
            url: window.location.origin + '/login'
        };

        if (navigator.share) {
            navigator.share(shareData).catch(err => console.log('Error sharing', err));
        } else {
            navigator.clipboard.writeText(`Eventify Room ID: ${state.user.roomId} | Join here: ${shareData.url}`);
            alert('Room details copied to clipboard!');
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div>
                    <h1>Command Center</h1>
                    <div className="flex items-center gap-2">
                        <p style={{ margin: 0 }}>Managing Room: <strong style={{ color: 'var(--primary)' }}>{state.user.roomId}</strong></p>
                        <button 
                            className="btn btn-sm btn-outline" 
                            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '8px' }}
                            onClick={handleShareRoom}
                        >
                            🔗 Share Room
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline" onClick={() => navigate('/reports')}>📄 Full Report</button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Create Event</button>
                </div>
            </div>

            <div className="grid-cards" style={{ marginBottom: '2rem' }}>
                <div className="glass-panel text-center" style={{ padding: '2rem' }}>
                    <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem', margin: 0 }}>{roomEvents.length}</h2>
                    <p style={{ fontWeight: 800 }}>Events</p>
                </div>
                <div className="glass-panel text-center" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '2rem', margin: 0 }}>{totalRegistrations}</h3>
                    <p style={{ margin: 0, opacity: 0.8 }}>Total Seats Taken</p>
                </div>
                <div className="glass-panel text-center" style={{ padding: '2rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '2.5rem', margin: 0 }}>{roomStudentsCount}</h2>
                    <p style={{ fontWeight: 800 }}>Students</p>
                </div>
                <div className="glass-panel text-center" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--text-primary)', margin: 0 }}>{roomFeedbacksCount}</h2>
                    <p style={{ fontWeight: 800 }}>Feedbacks</p>
                </div>
            </div>

            <div className="grid grid-2 gap-8 mb-4">
                <div className="glass-panel">
                    <h3>Event Distribution</h3>
                    <div className="mt-4 flex flex-col gap-4">
                        {Object.entries(categories).length === 0 ? <p className="text-secondary">No events yet.</p> :
                            Object.entries(categories).map(([name, count]) => {
                                const percent = Math.round((count / roomEvents.length) * 100);
                                return (
                                    <div key={name}>
                                        <div className="flex justify-between text-sm mb-1"><strong>{name}</strong><span>{count}</span></div>
                                        <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary)' }} />
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                <div className="glass-panel">
                    <h3>Room Maintenance</h3>
                    <div className="mt-4 flex flex-col gap-3">
                        <button className="btn btn-outline w-100" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => clearRoomData('chats')}>Clear Room Chat ({roomChatsCount})</button>
                        <button className="btn btn-outline w-100" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => clearRoomData('feedbacks')}>Clear Room Feedback ({roomFeedbacksCount})</button>
                    </div>
                </div>
            </div>

            <h2 className="mb-4">Live Event Management</h2>
            <div className="grid-cards">
                {roomEvents.slice().reverse().map(e => <EventCard key={e.id} event={e} />)}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setIsModalOpen(false)}>
                    <div className="glass-panel" style={{ width: '95%', maxWidth: '800px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2>Create New Event</h2>
                            <button className="btn" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>

                        {error && <div className="p-4 mb-4 rounded-lg bg-danger text-white font-bold">{error}</div>}
                        
                        <form onSubmit={handleCreateEvent}>
                            <div className="form-group">
                                <label style={{ fontWeight: 700 }}>Event Title *</label>
                                <input type="text" className="form-control" placeholder="e.g. Science Fair" value={title} onChange={e => setTitle(e.target.value)} required />
                            </div>

                            <div className="grid grid-2 gap-4">
                                <div className="form-group"><label style={{ fontWeight: 700 }}>Date *</label><input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required /></div>
                                <div className="form-group"><label style={{ fontWeight: 700 }}>Category *</label><input type="text" className="form-control" placeholder="e.g. Cultural" value={category} onChange={e => setCategory(e.target.value)} required /></div>
                            </div>

                            <div className="grid grid-2 gap-4">
                                <div className="form-group"><label style={{ fontWeight: 700 }}>Time *</label><input type="text" className="form-control" placeholder="10:00 AM" value={time} onChange={e => setTime(e.target.value)} required /></div>
                                <div className="form-group"><label style={{ fontWeight: 700 }}>Location</label><input type="text" className="form-control" placeholder="Main Hall" value={location} onChange={e => setLocation(e.target.value)} /></div>
                            </div>

                            <div className="form-group"><label style={{ fontWeight: 700 }}>Lead Coordinator *</label><input type="text" className="form-control" value={coordinator} onChange={e => setCoordinator(e.target.value)} required /></div>
                            <div className="form-group"><label style={{ fontWeight: 700 }}>Description *</label><textarea className="form-control" rows="4" value={description} onChange={e => setDescription(e.target.value)} required /></div>
                            
                            <div className="form-group">
                                <label style={{ fontWeight: 700 }}>Event Poster (Optional)</label>
                                <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                            </div>

                            <div className="form-group border-bottom pb-4 mb-4">
                                <label style={{ fontWeight: 700, color: 'var(--primary)' }}>Payment Settings</label>
                                <div className="grid grid-2 gap-4 mt-2">
                                    <div className="form-group">
                                        <label>Event Fee (₹)</label>
                                        <input type="number" className="form-control" placeholder="0 for free" value={fee} onChange={e => setFee(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Payment QR Code</label>
                                        <input type="file" className="form-control" accept="image/*" onChange={handleQrChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                                    {loading ? "☁️ Uploading Event..." : "🚀 Launch Event"}
                                </button>
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
