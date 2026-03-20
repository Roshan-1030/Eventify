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
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div>
                    <h1>Command Center</h1>
                    <p>Managing Room: <strong style={{ color: 'var(--primary)' }}>{state.user.roomId}</strong></p>
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
                    <h2 style={{ color: 'var(--success)', fontSize: '2.5rem', margin: 0 }}>{totalRegistrations}</h2>
                    <p style={{ fontWeight: 800 }}>Registrations</p>
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
                                <label style={{ fontWeight: 700 }}>Event Image</label>
                                <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Event</button>
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
