import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import EventCard from './EventCard';

const StudentDashboard = () => {
    const { state } = useAppState();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    
    const roomEvents = (state.events || []).filter(e => e.roomId === state.user.roomId);
    const roomStudentsCount = (state.users || []).filter(u => u.role === 'student' && u.roomId === state.user.roomId).length;

    // Categories found in room events
    const availableCategories = ['All', ...new Set(roomEvents.map(e => e.category || 'General'))];

    // Filter logic
    const filteredEvents = roomEvents.filter(e => {
        const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (e.desc || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || e.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const registered = filteredEvents.filter(e => (e.attendees || []).some(a => String(a.id) === String(state.user.id)));
    const unregistered = filteredEvents.filter(e => !(e.attendees || []).some(a => String(a.id) === String(state.user.id)));

    const shareRoomId = () => {
        const shareLink = `${window.location.origin}/login?room=${state.user.roomId}`;
        navigator.clipboard.writeText(shareLink).then(() => {
            alert(`Invitation link copied to clipboard!\n\nStudents using this link will have Room ID ${state.user.roomId} pre-filled.`);
        });
    };

    return (
        <div className="student-dashboard">
            <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
                <div>
                    <h1>Welcome Back, {state.user.name.split(' ')[0]} 👋</h1>
                    <p style={{ margin: 0 }}>Room ID: <span className="badge badge-admin">{state.user.roomId}</span> 
                       <button className="btn btn-sm btn-outline" style={{ padding: '0.2rem 0.6rem', marginLeft: '8px', fontSize: '0.75rem' }} onClick={shareRoomId}>🔗 Share Room Link</button>
                    </p>
                    <div className="mt-2">
                        <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>👥 {roomStudentsCount} Students in this Room</span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/chat')}>💬 Open Discussion</button>
            </div>

            {/* Search and Discovery Tools */}
            <div className="glass-panel mb-8">
                <div className="flex flex-col md-flex-row gap-4 items-center">
                    <div className="form-group mb-0 w-100" style={{ flex: 1 }}>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="🔍 Search events..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center md-justify-start">
                        {availableCategories.map(cat => (
                            <button 
                                key={cat} 
                                className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setActiveCategory(cat)}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', minHeight: '36px' }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            <h2 className="mt-8 mb-4">Your Registered Events ({registered.length})</h2>
            {registered.length === 0 ? (
                <p className="text-secondary p-8 glass-panel text-center">You haven't registered for any {activeCategory !== 'All' ? activeCategory : ''} events yet.</p>
            ) : (
                <div className="grid-cards mb-8">
                    {registered.map(e => <EventCard key={e.id} event={e} />)}
                </div>
            )}

            <h2 className="mt-12 mb-4">Discover More Events ({unregistered.length})</h2>
            <div className="grid-cards mb-8">
                {unregistered.length === 0 ? (
                    <p className="text-secondary p-8 glass-panel text-center">No other {activeCategory !== 'All' ? activeCategory : ''} events available in this room right now.</p>
                ) : (
                    unregistered.map(e => <EventCard key={e.id} event={e} />)
                )}
            </div>

            {roomEvents.length > 0 && (
                <div className="mt-16 text-center glass-panel" style={{ padding: '3rem' }}>
                    <h3>Need help or have questions?</h3>
                    <p className="mb-4">Chat with other students and admins in the room discussion.</p>
                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/chat')} style={{ padding: '1rem 2.5rem', borderRadius: '14px' }}>
                        💬 Enter Room Chat
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
