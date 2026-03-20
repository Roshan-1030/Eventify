import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import EventCard from './EventCard';

const AdminDashboard = () => {
    const { state, setState } = useAppState();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Admin state stats
    const roomEvents = (state.events || []).filter(e => e.roomId === state.user.roomId);
    const totalRegistrations = roomEvents.reduce((sum, e) => sum + (e.attendees || []).length, 0);
    const roomStudentsCount = (state.users || []).filter(u => u.role === 'student' && u.roomId === state.user.roomId).length;
    const roomFeedbacksCount = (state.feedbacks || []).filter(fb => fb.roomId === state.user.roomId).length;
    const roomChatsCount = (state.chats || []).filter(c => c.roomId === state.user.roomId).length;

    // Feature: Category Distribution Stats
    const categories = {};
    roomEvents.forEach(e => {
        const cat = e.category || 'Other';
        categories[cat] = (categories[cat] || 0) + 1;
    });

    // Form fields for new event
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
        alert("✅ Event Created Successfully!");
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
        if (!window.confirm(`Are you sure you want to PERMANENTLY clear all room ${type}? This cannot be undone.`)) return;
        
        setState(prev => {
            const newState = { ...prev };
            if (type === 'chats') newState.chats = prev.chats.filter(c => c.roomId !== state.user.roomId);
            if (type === 'feedbacks') newState.feedbacks = prev.feedbacks.filter(f => f.roomId !== state.user.roomId);
            return newState;
        });
        alert(`Cleared all room ${type}!`);
    };

    return (
        <div className="admin-dashboard">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1>Admin Command Center</h1>
                    <p>Room ID: <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{state.user.roomId}</strong></p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline" onClick={() => navigate('/reports')}>📄 Full Report</button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Create Event</button>
                </div>
            </div>

            <div className="grid-cards mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
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
                    <p style={{ fontWeight: 'bold' }}>Room Students</p>
                </div>
                <div className="glass-panel text-center">
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>{roomFeedbacksCount}</h2>
                    <p style={{ fontWeight: 'bold' }}>Feedbacks</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Category Visualization */}
                <div className="glass-panel">
                    <h3>Event Distribution</h3>
                    <div className="mt-4 flex flex-col gap-4">
                        {Object.keys(categories).length === 0 ? <p className="text-secondary text-sm">No data available.</p> :
                            Object.entries(categories).map(([name, count]) => {
                                const percent = Math.round((count / roomEvents.length) * 100);
                                return (
                                    <div key={name}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <strong>{name}</strong>
                                            <span>{count} Events ({percent}%)</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary)', transition: 'width 1s cubic-bezier(0.19, 1, 0.22, 1)' }} />
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                {/* Maintenance Tools */}
                <div className="glass-panel">
                    <h3>Room Maintenance</h3>
                    <p className="text-sm">Manage large data entries in this room.</p>
                    <div className="mt-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                                <strong>Room Chat</strong>
                                <p style={{ fontSize: '0.75rem', margin: 0 }}>Total Messages: {roomChatsCount}</p>
                            </div>
                            <button className="btn btn-sm btn-outline text-danger" onClick={() => clearRoomData('chats')}>Clear All</button>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                                <strong>Room Feedback</strong>
                                <p style={{ fontSize: '0.75rem', margin: 0 }}>Total Submissions: {roomFeedbacksCount}</p>
                            </div>
                            <button className="btn btn-sm btn-outline text-danger" onClick={() => clearRoomData('feedbacks')}>Clear All</button>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="mt-4">Live Event Management</h2>
            <div className="grid-cards mb-4">
                {roomEvents.length === 0 ? <p className="text-secondary">No events created in this room yet.</p> :
                    roomEvents.slice().reverse().map(e => <EventCard key={e.id} event={e} />)
                }
            </div>

            {isModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2>Create New Event</h2>
                            <button className="btn" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        {error && <div className="p-3 mb-4 rounded bg-danger text-white">{error}</div>}
                        <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
                            <div className="form-group"><label>Event Title *</label><input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} required /></div>
                            <div className="flex gap-4">
                                <div className="form-group flex-1"><label>Date *</label><input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required /></div>
                                <div className="form-group flex-1"><label>Category *</label><input type="text" className="form-control" placeholder="e.g. Technology" value={category} onChange={e => setCategory(e.target.value)} required /></div>
                            </div>
                            <div className="flex gap-4">
                                <div className="form-group flex-1"><label>Time *</label><input type="text" className="form-control" value={time} onChange={e => setTime(e.target.value)} required /></div>
                                <div className="form-group flex-1"><label>Location</label><input type="text" className="form-control" value={location} onChange={e => setLocation(e.target.value)} /></div>
                            </div>
                            <div className="form-group"><label>Head Coordinator *</label><input type="text" className="form-control" value={coordinator} onChange={e => setCoordinator(e.target.value)} required /></div>
                            <div className="form-group"><label>Description *</label><textarea className="form-control" rows="3" value={description} onChange={e => setDescription(e.target.value)} required /></div>
                            <div className="form-group">
                                <label>Cover Image</label>
                                <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                                {imageBase64 && <img src={imageBase64} alt="Preview" style={{ marginTop: '1rem', maxHeight: '150px', borderRadius: '8px' }} />}
                            </div>
                            <div className="flex gap-2 pt-4 border-top">
                                <button type="submit" className="btn btn-primary flex-1">Save Event</button>
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
