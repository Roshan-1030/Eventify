import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import EventCard from './EventCard';

const StudentDashboard = () => {
    const { state } = useAppState();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [copied, setCopied] = useState(false);
    
    const userRoomId = state.user?.roomId || '';
    const roomEvents = (state.events || []).filter(e => e.roomId === userRoomId);
    const roomStudentsCount = (state.users || []).filter(u => u.role === 'student' && u.roomId === userRoomId).length;

    // Categories found in room events
    const availableCategories = ['All', ...new Set(roomEvents.map(e => e.category || 'General'))];

    // Filter logic
    const filteredEvents = roomEvents.filter(e => {
        const matchesSearch = (e.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (e.desc || e.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || e.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const registered = filteredEvents.filter(e => (e.attendees || []).some(a => String(a.id) === String(state.user?.id)));
    const unregistered = filteredEvents.filter(e => !(e.attendees || []).some(a => String(a.id) === String(state.user?.id)));

    const shareRoomId = () => {
        if (!userRoomId) return;
        const shareLink = `${window.location.origin}/login?room=${userRoomId}`;
        navigator.clipboard.writeText(shareLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const studentFirstName = (state.user?.name || state.user?.email || 'Student').split(' ')[0];

    return (
        <div className="student-dashboard">
            {/* Header section */}
            <div className="dashboard-header">
                <div>
                    <h1 style={{ marginBottom: '0.35rem' }}>Welcome, {studentFirstName} 👋</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                            Room ID: <strong style={{ color: 'var(--primary)' }}>{userRoomId || 'N/A'}</strong>
                        </span>
                        {userRoomId && (
                            <button 
                                className="btn btn-xs btn-outline" 
                                onClick={shareRoomId}
                                style={{ borderRadius: '6px' }}
                            >
                                {copied ? '✅ Link Copied!' : '🔗 Share Link'}
                            </button>
                        )}
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                            👥 {roomStudentsCount} Students
                        </span>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/chat')}>
                        💬 Room Chat
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate('/polls')}>
                        📊 Polls
                    </button>
                </div>
            </div>

            {/* Search and Discovery Filters */}
            <div className="glass-panel mb-8" style={{ padding: '1.25rem' }}>
                <div className="flex flex-col md-flex-row gap-4 items-center">
                    <div className="form-group mb-0 w-100" style={{ flex: 1, position: 'relative' }}>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="🔍 Search events by title or keywords..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingRight: searchTerm ? '2.5rem' : '1rem' }}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')} 
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    
                    {/* Category Filter Pills */}
                    <div className="category-chips-container" style={{ width: '100%', flex: '1 1 auto', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {availableCategories.map(cat => (
                            <button 
                                key={cat} 
                                className={`btn btn-xs ${activeCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setActiveCategory(cat)}
                                style={{ padding: '0.4rem 0.8rem', minHeight: '34px' }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Registered Events Section */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 style={{ margin: 0 }}>Registered Events ({registered.length})</h2>
                </div>
                {registered.length === 0 ? (
                    <div className="glass-panel text-center" style={{ padding: '2.5rem 1.5rem' }}>
                        <p className="text-secondary" style={{ margin: 0 }}>
                            You haven't registered for any {activeCategory !== 'All' ? activeCategory : ''} events yet. Browse available events below!
                        </p>
                    </div>
                ) : (
                    <div className="grid-cards">
                        {registered.map(e => <EventCard key={e.id} event={e} />)}
                    </div>
                )}
            </div>

            {/* Discover More Events Section */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 style={{ margin: 0 }}>Discover Events ({unregistered.length})</h2>
                </div>
                {unregistered.length === 0 ? (
                    <div className="glass-panel text-center" style={{ padding: '2.5rem 1.5rem' }}>
                        <p className="text-secondary" style={{ margin: 0 }}>
                            {searchTerm || activeCategory !== 'All' 
                                ? 'No matching events found in this category.' 
                                : 'No additional events available in this room right now. Check back soon!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid-cards">
                        {unregistered.map(e => <EventCard key={e.id} event={e} />)}
                    </div>
                )}
            </div>

            {/* Discussion Callout */}
            {roomEvents.length > 0 && (
                <div className="text-center glass-panel" style={{ padding: '2.5rem 1.5rem', marginTop: '3rem' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Have questions about an event?</h3>
                    <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem' }}>
                        Join the live discussion room to connect with coordinators and fellow students.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/chat')} style={{ padding: '0.8rem 2rem' }}>
                        💬 Enter Room Discussion
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
