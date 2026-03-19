import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import EventCard from './EventCard';

const AdminDashboard = () => {
    const { state, setState } = useAppState();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Admin state stats
    const roomEvents = (state.events || []).filter(e => e.roomId === state.user.roomId);
    const totalRegistrations = roomEvents.reduce((sum, e) => sum + (e.attendees || []).length, 0);
    const roomStudentsCount = (state.users || []).filter(u => u.role === 'student' && u.roomId === state.user.roomId).length;
    const roomFeedbacks = (state.feedbacks || []).filter(fb => fb.roomId === state.user.roomId).length;

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
            title,
            date,
            category,
            time,
            location,
            description,
            desc: description,
            headCoordinator: coordinator,
            coordinators: [{ name: coordinator, role: 'Head Coordinator' }],
            image: imageBase64 || "https://via.placeholder.com/300x180?text=Event",
            roomId: state.user.roomId,
            attendees: [],
            registrationOpen: true
        };

        const eventsCopy = [...state.events, newEvent];
        setState(prev => ({ ...prev, events: eventsCopy }));
        alert("✅ Event Created Successfully!");
        
        // Reset and close
        setTitle(""); setDate(""); setCategory(""); setTime(""); setLocation(""); setCoordinator(""); setDescription(""); setImageBase64("");
        setIsModalOpen(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageBase64(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1>Admin Command Center</h1>
                    <p>Room ID: <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{state.user.roomId}</strong></p>
                    <p className="text-secondary">Share this invitation link with students to let them join your events.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Create New Event</button>
            </div>

            <div className="grid-cards mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                <div className="glass-panel text-center">
                    <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem' }}>{roomEvents.length}</h2>
                    <p style={{ fontWeight: 'bold' }}>Events in Room</p>
                </div>
                <div className="glass-panel text-center">
                    <h2 style={{ color: 'var(--success)', fontSize: '2.5rem' }}>{totalRegistrations}</h2>
                    <p style={{ fontWeight: 'bold' }}>Total Registrations</p>
                </div>
                <div className="glass-panel text-center" style={{ cursor: 'pointer' }} onClick={() => window.location.hash = '#reports'}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '2.5rem' }}>{roomStudentsCount}</h2>
                    <p style={{ fontWeight: 'bold' }}>Room Students</p>
                    <small className="text-secondary" style={{ fontSize: '0.75rem' }}>Click to View Full Report</small>
                </div>
                <div className="glass-panel text-center" style={{ cursor: 'pointer' }} onClick={() => window.location.hash = '#feedback'}>
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>{roomFeedbacks}</h2>
                    <p style={{ fontWeight: 'bold' }}>Room Feedback</p>
                    <small className="text-secondary" style={{ fontSize: '0.75rem' }}>Click to View</small>
                </div>
            </div>

            <h2 className="mt-4">Manage Events</h2>
            <div className="grid-cards mb-4">
                {roomEvents.length === 0 ? (
                    <p className="text-secondary">No events created in this room yet.</p>
                ) : (
                    roomEvents.map(e => <EventCard key={e.id} event={e} />)
                )}
            </div>

            {isModalOpen && (
                <div id="add-event-modal" className="glass-panel" style={{ marginTop: '2rem', display: 'block' }}>
                    <h2>Create New Event</h2>
                    {error && (
                        <div id="evError" style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleCreateEvent}>
                        <div className="form-group mt-4">
                            <label>Event Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input type="text" className="form-control" placeholder="e.g. AI Symposium" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="form-group flex-1">
                                <label>Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>
                            <div className="form-group flex-1">
                                <label>Category <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input type="text" className="form-control" placeholder="e.g. Technology" value={category} onChange={e => setCategory(e.target.value)} required />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="form-group flex-1">
                                <label>Time <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input type="text" className="form-control" placeholder="e.g. 10:00 AM" value={time} onChange={e => setTime(e.target.value)} required />
                            </div>
                            <div className="form-group flex-1">
                                <label>Location</label>
                                <input type="text" className="form-control" placeholder="e.g. Main Hall" value={location} onChange={e => setLocation(e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Head Coordinator <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input type="text" className="form-control" placeholder="Full Name of Lead Student" value={coordinator} onChange={e => setCoordinator(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label>Description <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <textarea className="form-control" rows="3" placeholder="Describe the event goals and activities..." value={description} onChange={e => setDescription(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label>Cover Image</label>
                            <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                            {imageBase64 && <img src={imageBase64} alt="Preview" style={{ marginTop: '1rem', maxHeight: '150px', borderRadius: '8px' }} />}
                        </div>

                        <div className="flex gap-2">
                            <button type="submit" className="btn btn-primary">Save Event</button>
                            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
