import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

const Reports = () => {
    const { state, setState, openUserProfile } = useAppState();
    const navigate = useNavigate();

    if (state.user?.role !== 'admin') {
        return (
            <div className="glass-panel text-center p-8">
                <h1>Access Denied</h1>
                <p>Only event administrators can view reports.</p>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Back to Home</button>
            </div>
        );
    }

    const students = (state.users || []).filter(u => u.role === 'student' && u.roomId === state.user.roomId);
    const roomEvents = (state.events || []).filter(e => e.roomId === state.user.roomId);
    
    const studentReport = students.map(s => {
        const registeredEvents = roomEvents.filter(e => (e.attendees || []).some(a => String(a.id) === String(s.id)));
        return { ...s, registeredEvents };
    });

    // Calculate total registrations
    const registrationSet = new Set();
    roomEvents.forEach(e => {
        (e.attendees || []).forEach(a => {
            registrationSet.add(`${e.id}_${a.id || a.email}`);
        });
    });
    const totalRoomRegistrations = registrationSet.size;

    const handleRemoveStudent = async (studentId) => {
        if (!window.confirm('Are you sure you want to remove this student from the room? Their event registrations will also be cleared.')) return;
        
        try {
            await deleteDoc(doc(db, "profiles", studentId));
            
            for (let ev of roomEvents) {
                const remainingAttendees = (ev.attendees || []).filter(a => String(a.id) !== String(studentId));
                if (remainingAttendees.length !== (ev.attendees || []).length) {
                    await updateDoc(doc(db, "events", String(ev.id)), { attendees: remainingAttendees });
                }
            }
            
            alert("Student record removed from this room.");
        } catch(e) {
            console.error("Failed to remove student:", e);
            alert("Error trying to remove student. Check permissions.");
        }
    };

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Student Name,Email,Phone,Branch,Year,Registrations Count,Events List\n";
        studentReport.forEach(s => {
            const eventTitles = s.registeredEvents.map(e => e.title).join("; ");
            const row = `"${s.name}","${s.email || 'N/A'}","${s.phone || 'N/A'}","${s.branch || 'N/A'}","${s.year || 'N/A'}","${s.registeredEvents.length}","${eventTitles}"`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Student_Report_Room_${state.user.roomId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        window.print();
    };

    return (
        <div className="reports-page">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ marginBottom: '0.35rem' }}>Room Report</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        Overview for Room: <strong style={{ color: 'var(--primary)' }}>{state.user?.roomId}</strong>
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
                        📊 Export CSV
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleExportPDF}>
                        🖨️ Print / PDF
                    </button>
                </div>
            </div>

            {/* Stats Summary Grid */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <div className="glass-panel stat-card">
                    <div className="stat-number" style={{ color: 'var(--accent)' }}>{students.length}</div>
                    <div className="stat-label">Enrolled Students</div>
                </div>
                <div className="glass-panel stat-card">
                    <div className="stat-number" style={{ color: 'var(--primary)' }}>{totalRoomRegistrations}</div>
                    <div className="stat-label">Total RSVPs</div>
                </div>
                <div className="glass-panel stat-card">
                    <div className="stat-number" style={{ color: 'var(--success)' }}>{roomEvents.length}</div>
                    <div className="stat-label">Active Events</div>
                </div>
            </div>

            {/* Students Activity Table */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Enrolled Student Activity</h2>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{studentReport.length} Students</span>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Academic</th>
                                <th>Events Registered</th>
                                <th style={{ textAlign: 'center' }}>Total</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentReport.length === 0 ? (
                                <tr><td colSpan="5" className="text-center p-8 text-secondary">No active students in this room yet.</td></tr>
                            ) : (
                                studentReport.map(s => (
                                    <tr key={s.id}>
                                        <td>
                                            <div 
                                                className="clickable-user-name"
                                                style={{ fontWeight: 800 }}
                                                onClick={() => openUserProfile(s)}
                                                title="Click to view student contact card & phone number"
                                            >
                                                {s.name} 👤
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                {s.email} {s.phone && `• 📱 ${s.phone}`}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{s.branch || 'N/A'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.year ? `${s.year} Year` : 'N/A'}</div>
                                        </td>
                                        <td>
                                            {s.registeredEvents.length > 0 ? (
                                                <div className="flex gap-1 flex-wrap">
                                                    {s.registeredEvents.map(e => (
                                                        <span key={e.id} className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                                                            {e.title}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-secondary text-xs">No registrations</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 800 }}>
                                            {s.registeredEvents.length}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button 
                                                className="btn btn-xs btn-outline" 
                                                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} 
                                                onClick={() => handleRemoveStudent(s.id)}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
