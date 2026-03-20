import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import EventCard from './EventCard';

const AdminDashboard = () => {
    const { state, setState } = useAppState();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Stats calc
    const roomEvents = (state.events || []).filter(e => e.roomId === state.user.roomId);
    const totalRegistrations = roomEvents.reduce((sum, e) => sum + (e.attendees || []).length, 0);
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
    const [error, setError] = useState("");

    const handleCreateEvent = (e) => {
        e.preventDefault();
        setError("");
        if (!title || !date || !category || !time || !coordinator || !description) {
            setError("Please fill all required fields!");
            return;
        }

        const newEvent = {
            id: Date.now(),
            title, date, category, time, location, description, 
            desc: description,
            headCoordinator: coordinator,
            coordinators: [{ name: coordinator, role: 'Head Coordinator' }],
            image: imageBase64 || "https://via.placeholder.com/300x180?text=Event",
            roomId: state.user.roomId,
            attendees: [],
            registrationOpen: true
        };

        setState(prev => ({ ...prev, events: [...prev.events, newEvent] }));
        alert("✅ Event Created!");
        setTitle(""); setDate(""); setCategory(""); setTime(""); setLocation(""); setCoordinator(""); setDescription(""); setImageBase64("");
        setIsModalOpen(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImageBase64(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const clearRoomData = (type) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY clear all room ${type}?`)) return;
        setState(prev => {
            const newState = { ...prev };
            if (type === 'chats') newState.chats = prev.chats.filter(c => c.roomId !== state.user.roomId);
            if (type === 'feedbacks') newState.feedbacks = prev.feedbacks.filter(f => f.roomId !== state.user.roomId);
            return newState;
        });
    };

    return (
        <div className="admin-dashboard">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h1>Command Center</h1>
                    <p>Managing Room: <strong style={{ color: 'var(--primary)' }}>{state.user.roomId}</strong></p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline" onClick={() => navigate('/reports')}>📄 Full Report</button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Create Event</button>
                </div>
            </div>

            <div className="grid-cards mb-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                <div className="glass-panel text-center">
                    <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem' }}>{roomEvents.length}</h2>
                    <p style={{ fontWeight: 'bold' }}>Events</p>
                </div>
                <div className="glass-panel text-center">
                    <h2 style={{ color: 'var(--success)', fontSize: '2.5rem' }}>{totalRegistrations}</h2>
                    <p style={{ fontWeight: 'bold' }}>Registrations</p>
                </div>
                <div className="glass-panel text-center">
                    <h2 style={{ color: 'var(--accent)', fontSize: '2.5rem' }}>{roomStudentsCount}</h2>
                    <p style={{ fontWeight: 'bold' }}>Students</p>
                </div>
                <div className="glass-panel text-center">
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>{roomFeedbacksCount}</h2>
                    <p style={{ fontWeight: 'bold' }}>Feedbacks</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-12">
                <div className="glass-panel">
                    <h3>Event Distribution</h3>
                    <div className="mt-4 flex flex-col gap-4">
                        {Object.entries(categories).map(([name, count]) => {
                            const percent = Math.round((count / roomEvents.length) * 100);
                            return (
                                <div key={name}>
                                    <div className="flex justify-between text-sm mb-1"><strong>{name}</strong><span>{count}</span></div>
                                    <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary)' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="glass-panel">
                    <h3>Room Maintenance</h3>
                    <div className="mt-4 flex flex-col gap-3">
                        <button className="btn btn-outline text-danger w-100" onClick={() => clearRoomData('chats')}>Clear Room Chat History ({roomChatsCount})</button>
                        <button className="btn btn-outline text-danger w-100" onClick={() => clearRoomData('feedbacks')}>Clear Room Feedbacks ({roomFeedbacksCount})</button>
                    </div>
                </div>
            </div>

            <h2 className="mb-4">Live Event Management</h2>
            <div className="grid-cards">
                {roomEvents.slice().reverse().map(e => <EventCard key={e.id} event={e} />)}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }} onClick={() => setIsModalOpen(false)}>
                    <div className="glass-panel" style={{ width: '95%', maxWidth: '800px', padding: '2.5rem', maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8 pb-4 border-bottom">
                            <div>
                                <h1 style={{ margin: 0 }}>Create New Event</h1>
                                <p className="text-secondary" style={{ margin: 0 }}>Define the details for your new event in Room {state.user.roomId}</p>
                            </div>
                            <button className="btn btn-outline" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }} onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>

                        {error && <div className="p-4 mb-6 rounded-lg bg-danger text-white font-bold">{error}</div>}
                        
                        <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="form-group col-span-2">
                                <label style={{ fontWeight: 800 }}>Event Title <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" placeholder="e.g. Annual Tech Symposium 2024" value={title} onChange={e => setTitle(e.target.value)} required style={{ fontSize: '1.1rem', padding: '0.8rem 1.2rem' }} />
                            </div>

                            <div className="form-group">
                                <label style={{ fontWeight: 800 }}>Event Date *</label>
                                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label style={{ fontWeight: 800 }}>Category *</label>
                                <input type="text" className="form-control" placeholder="e.g. Technical, Cultural" value={category} onChange={e => setCategory(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label style={{ fontWeight: 800 }}>Tentative Time *</label>
                                <input type="text" className="form-control" placeholder="e.g. 10:00 AM - 4:00 PM" value={time} onChange={e => setTime(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label style={{ fontWeight: 800 }}>Location / Venue</label>
                                <input type="text" className="form-control" placeholder="e.g. Auditorium Hall A" value={location} onChange={e => setLocation(e.target.value)} />
                            </div>

                            <div className="form-group col-span-2">
                                <label style={{ fontWeight: 800 }}>Head Student Coordinator *</label>
                                <input type="text" className="form-control" placeholder="Full name of lead student" value={coordinator} onChange={e => setCoordinator(e.target.value)} required />
                            </div>

                            <div className="form-group col-span-2">
                                <label style={{ fontWeight: 800 }}>Full Description *</label>
                                <textarea className="form-control" rows="5" placeholder="What are the goals and schedule for this event?" value={description} onChange={e => setDescription(e.target.value)} required style={{ lineHeight: '1.6' }} />
                            </div>

                            <div className="form-group col-span-2">
                                <label style={{ fontWeight: 800 }}>Event Cover Image</label>
                                <div className="flex gap-4 items-center flex-wrap">
                                    <input type="file" className="form-control flex-1" accept="image/*" onChange={handleImageChange} />
                                    {imageBase64 && (
                                        <div style={{ width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                            <img src={imageBase64} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 col-span-2 mt-8 pt-8 border-top">
                                <button type="submit" className="btn btn-primary flex-1" style={{ padding: '1rem', fontSize: '1.1rem', fontWeight: 800 }}>🚀 Launch New Event</button>
                                <button type="button" className="btn btn-outline" style={{ padding: '1rem 2rem' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
