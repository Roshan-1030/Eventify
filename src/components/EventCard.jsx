import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const EventCard = ({ event }) => {
    const { state, setState } = useAppState();
    const navigate = useNavigate();
    const [showAttendees, setShowAttendees] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Edit Form State
    const [editData, setEditData] = useState({ ...event });

    const isRegistered = (event.attendees || []).some(a => String(a.id) === String(state.user.id));
    const isAdmin = state.user.role === 'admin';

    const handleToggleRegistration = () => {
        if (!isAdmin) return;
        const eventsCopy = [...state.events];
        const idx = eventsCopy.findIndex(e => e.id === event.id);
        eventsCopy[idx] = { ...eventsCopy[idx], registrationOpen: !eventsCopy[idx].registrationOpen };
        setState(prev => ({ ...prev, events: eventsCopy }));
    };

    const handleDeleteEvent = () => {
        if (!isAdmin) return;
        if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
            const eventsCopy = state.events.filter(e => e.id !== event.id);
            setState(prev => ({ ...prev, events: eventsCopy }));
        }
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        const eventsCopy = [...state.events];
        const idx = eventsCopy.findIndex(e => e.id === event.id);
        eventsCopy[idx] = { ...editData };
        setState(prev => ({ ...prev, events: eventsCopy }));
        setShowEditModal(false);
        alert("✅ Event Updated!");
    };

    return (
        <div className="glass-panel event-card p-0 overflow-hidden flex flex-col" style={{ border: '2px solid var(--border)', transition: 'transform 0.3s ease' }}>
            <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                <img src={event.image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="badge badge-admin" style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.65rem', background: event.registrationOpen ? 'var(--success)' : 'var(--danger)', color: 'white' }}>
                    {event.registrationOpen ? "Registration Open" : "Closed"}
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{event.category}</span>
                    <small className="text-secondary">{new Date(event.date).toLocaleDateString()}</small>
                </div>
                <h3 className="mb-2">{event.title}</h3>
                <p className="text-secondary text-sm mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '3.6rem' }}>
                    {event.description}
                </p>

                <div className="flex gap-2 mt-auto">
                    <button className="btn btn-primary flex-1" onClick={() => navigate(`/event/${event.id}`)}>Details</button>
                    {!isAdmin && (
                        <button className={`btn ${isRegistered ? 'btn-outline' : 'btn-success'} flex-1`} style={{ opacity: (!event.registrationOpen && !isRegistered) ? 0.5 : 1 }}>
                            {isRegistered ? "Unregister" : "Register Now"}
                        </button>
                    )}
                </div>

                {isAdmin && (
                    <div className="mt-3 pt-3 border-top grid grid-cols-2 gap-2">
                        <button className="btn btn-sm btn-outline text-success" onClick={handleToggleRegistration}>
                            {event.registrationOpen ? "Close Reg" : "Open Reg"}
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => setShowAttendees(true)}>👥 {event.attendees?.length || 0} RSVPs</button>
                        <button className="btn btn-sm btn-primary" onClick={() => setShowEditModal(true)}>✏️ Edit Event</button>
                        <button className="btn btn-sm btn-outline text-danger" onClick={handleDeleteEvent}>🗑️ Delete</button>
                    </div>
                )}
            </div>

            {/* Attendees Modal */}
            {showAttendees && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAttendees(false)}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 style={{ margin: 0 }}>Event Attendees</h2>
                            <button className="btn" onClick={() => setShowAttendees(false)}>✕</button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {(!event.attendees || event.attendees.length === 0) ? (
                                <p className="text-secondary text-center p-8">No students registered yet for this event.</p>
                            ) : (
                                event.attendees.map((student, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="avatar" style={{ width: '35px', height: '35px', fontSize: '0.8rem' }}>{student.name.charAt(0)}</div>
                                            <div>
                                                <div style={{ fontWeight: 800 }}>{student.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{student.email}</div>
                                            </div>
                                        </div>
                                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✓ Registered</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEditModal(false)}>
                    <div className="glass-panel" style={{ width: '95%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2>Edit Event: {event.title}</h2>
                            <button className="btn" onClick={() => setShowEditModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleEditSave} className="flex flex-col gap-4">
                            <div className="form-group"><label>Event Title *</label><input type="text" className="form-control" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} required /></div>
                            <div className="flex gap-4">
                                <div className="form-group flex-1"><label>Date *</label><input type="date" className="form-control" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} required /></div>
                                <div className="form-group flex-1"><label>Category *</label><input type="text" className="form-control" value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})} required /></div>
                            </div>
                            <div className="flex gap-4">
                                <div className="form-group flex-1"><label>Time *</label><input type="text" className="form-control" value={editData.time} onChange={e => setEditData({...editData, time: e.target.value})} /></div>
                                <div className="form-group flex-1"><label>Location</label><input type="text" className="form-control" value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} /></div>
                            </div>
                            <div className="form-group"><label>Lead Coordinator *</label><input type="text" className="form-control" value={editData.headCoordinator} onChange={e => setEditData({...editData, headCoordinator: e.target.value})} /></div>
                            <div className="form-group"><label>Description *</label><textarea className="form-control" rows="4" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} required /></div>
                            <div className="flex gap-2 pt-4 border-top">
                                <button type="submit" className="btn btn-primary flex-1">Save Changes</button>
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
