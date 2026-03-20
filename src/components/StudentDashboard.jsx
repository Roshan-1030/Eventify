import React from 'react';
import { useAppState } from '../context/StateContext';
import EventCard from './EventCard';

const StudentDashboard = () => {
    const { state } = useAppState();
    
    const roomEvents = (state.events || []).filter(e => e.roomId === state.user.roomId);
    const registered = roomEvents.filter(e => (e.attendees || []).some(a => String(a.id) === String(state.user.id)));
    const unregistered = roomEvents.filter(e => !(e.attendees || []).some(a => String(a.id) === String(state.user.id)));
    const roomStudentsCount = (state.users || []).filter(u => u.role === 'student' && u.roomId === state.user.roomId).length;

    const shareRoomId = () => {
        const shareLink = `${window.location.origin}/login?room=${state.user.roomId}`;
        navigator.clipboard.writeText(shareLink).then(() => {
            alert(`Invitation link copied to clipboard!\n\nStudents using this link will have Room ID ${state.user.roomId} pre-filled.`);
        });
    };

    return (
        <div className="student-dashboard">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1>Welcome Back, {state.user.name}</h1>
                    <p>Room: <span className="badge badge-admin">{state.user.roomId}</span> 
                       <button className="btn btn-sm btn-outline" style={{ padding: '2px 8px', marginLeft: '5px', fontSize: '0.7rem' }} onClick={shareRoomId}>🔗 Share</button>
                    </p>
                    <div className="mt-2">
                        <span className="badge badge-success" style={{ fontSize: '0.9rem' }}>👥 {roomStudentsCount} Students in this Room</span>
                    </div>
                </div>
            </div>
            
            <h2 className="mt-4">Your Registered Events</h2>
            {registered.length === 0 ? (
                <p className="text-secondary">You haven't registered for any events yet.</p>
            ) : (
                <div className="grid-cards mb-4">
                    {registered.map(e => <EventCard key={e.id} event={e} />)}
                </div>
            )}

            <h2 className="mt-4">Explore More Events</h2>
            <div className="grid-cards mb-4">
                {unregistered.length === 0 ? (
                    <p className="text-secondary">No other events available in this room.</p>
                ) : (
                    unregistered.map(e => <EventCard key={e.id} event={e} />)
                )}
            </div>

            <div className="mt-8 text-center">
                <button className="btn btn-primary" style={{ padding: '1.5rem 3rem', fontSize: '1.2rem', borderRadius: '20px' }} onClick={() => window.location.hash = '#chat'}>
                    💬 Open Room Discussion
                </button>
            </div>
        </div>
    );
};

export default StudentDashboard;
