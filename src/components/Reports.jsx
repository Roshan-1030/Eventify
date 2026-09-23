import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { formatDate } from '../utils/dateUtils';

const Reports = () => {
    const { state, setState, openUserProfile } = useAppState();
    const navigate = useNavigate();
    const { eventId } = useParams();

    if (state.user?.role !== 'admin') {
        return (
            <div className="glass-panel text-center p-8">
                <h1>Access Denied</h1>
                <p>Only event administrators can view reports.</p>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Back to Home</button>
            </div>
        );
    }

    const roomEvents = (state.events || []).filter(e => e.roomId === state.user.roomId);
    const roomUsers = state.users || [];
    const roomPayments = state.payments || [];

    // Selected event (from route param or default to first event if room has events)
    const currentEvent = eventId 
        ? roomEvents.find(e => String(e.id) === String(eventId))
        : (roomEvents.length > 0 ? roomEvents[0] : null);

    const isParticularEvent = Boolean(currentEvent);

    // Event specific attendee details
    const eventAttendees = currentEvent ? (currentEvent.attendees || []) : [];
    const uniqueAttendees = Array.from(new Map(eventAttendees.map(a => [String(a.id || a.email), a])).values());

    const attendeesWithProfiles = uniqueAttendees.map(att => {
        const userProfile = roomUsers.find(u => 
            (att.id && String(u.id) === String(att.id)) || 
            (att.email && u.email && u.email.toLowerCase() === att.email.toLowerCase())
        ) || {};

        const payment = roomPayments.find(p => 
            String(p.eventId) === String(currentEvent?.id) && 
            ((att.id && String(p.userId) === String(att.id)) || 
             (att.email && p.userEmail && p.userEmail.toLowerCase() === att.email.toLowerCase()))
        );

        return {
            id: att.id || userProfile.id,
            name: att.name || userProfile.name || 'Unknown Student',
            email: att.email || userProfile.email || 'N/A',
            phone: userProfile.phone || att.phone || '',
            branch: userProfile.branch || 'N/A',
            year: userProfile.year || 'N/A',
            registeredAt: att.registeredAt || payment?.timestamp || currentEvent?.date,
            payment
        };
    });

    const isPaidEvent = Boolean(
        currentEvent && 
        currentEvent.isPaid !== false && 
        currentEvent.isPaid !== 'false' && 
        currentEvent.fee && 
        Number(currentEvent.fee) > 0
    );

    const eventPayments = currentEvent ? roomPayments.filter(p => String(p.eventId) === String(currentEvent.id)) : [];
    const verifiedPayments = eventPayments.filter(p => p.status === 'verified' || p.ticketIssued);
    const totalRevenue = verifiedPayments.length * Number(currentEvent?.fee || 0);
    const scannedTicketsCount = eventPayments.filter(p => p.scanned).length;

    // Room Overview Calculations (used when "All Events" is selected)
    const students = roomUsers.filter(u => u.role === 'student' && u.roomId === state.user.roomId);
    const studentReport = students.map(s => {
        const registeredEvents = roomEvents.filter(e => (e.attendees || []).some(a => String(a.id) === String(s.id)));
        return { ...s, registeredEvents };
    });

    const registrationSet = new Set();
    roomEvents.forEach(e => {
        (e.attendees || []).forEach(a => {
            registrationSet.add(`${e.id}_${a.id || a.email}`);
        });
    });
    const totalRoomRegistrations = registrationSet.size;

    // Export CSV for this particular event
    const handleExportEventCSV = () => {
        if (!currentEvent) return;
        let csvContent = "data:text/csv;charset=utf-8,Student Name,Email,Phone,Branch / Department,Year,Event Title,Event Date,Registration Date,Payment Status,Official Pass,Admitted Status\n";
        
        attendeesWithProfiles.forEach(s => {
            const payStatus = isPaidEvent ? (s.payment?.status || 'Unpaid') : 'Free Event';
            const ticketIssued = s.payment?.ticketIssued ? 'Issued' : 'No';
            const admitted = s.payment?.scanned ? `Admitted (${new Date(s.payment.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : 'Pending Check-in';
            const regDate = s.registeredAt ? formatDate(s.registeredAt) : formatDate(currentEvent.date);
            const eventDateFormatted = formatDate(currentEvent.date);
            
            const row = `"${s.name}","${s.email}","${s.phone || 'N/A'}","${s.branch}","${s.year}","${currentEvent.title}","${eventDateFormatted}","${regDate}","${payStatus}","${ticketIssued}","${admitted}"`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const safeTitle = (currentEvent.title || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileDate = formatDate(currentEvent.date).replace(/\//g, '-');
        link.setAttribute("download", `${safeTitle}_Report_${fileDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export CSV for All Room Students Overview
    const handleExportRoomCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Student Name,Email,Phone,Branch,Year,Registrations Count,Events List\n";
        studentReport.forEach(s => {
            const eventTitles = s.registeredEvents.map(e => e.title).join("; ");
            const row = `"${s.name}","${s.email || 'N/A'}","${s.phone || 'N/A'}","${s.branch || 'N/A'}","${s.year || 'N/A'}","${s.registeredEvents.length}","${eventTitles}"`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Room_${state.user.roomId}_Overall_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Remove single attendee from current event
    const handleRemoveAttendee = async (studentId, studentEmail) => {
        if (!currentEvent) return;
        if (!window.confirm("Remove this student from this event's registration list?")) return;

        try {
            const updatedAttendees = (currentEvent.attendees || []).filter(a => 
                String(a.id) !== String(studentId) && 
                (!studentEmail || !a.email || a.email.toLowerCase() !== studentEmail.toLowerCase())
            );

            await updateDoc(doc(db, "events", String(currentEvent.id)), {
                attendees: updatedAttendees
            });

            setState(prev => ({
                ...prev,
                events: prev.events.map(ev => String(ev.id) === String(currentEvent.id) ? { ...ev, attendees: updatedAttendees } : ev)
            }));
            alert("Student registration removed from this event.");
        } catch(err) {
            console.error("Failed to remove attendee:", err);
            alert("Error removing student.");
        }
    };

    return (
        <div className="reports-page">
            {/* Top Navigation & Action Controls */}
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => navigate('/')}
                    style={{ borderRadius: 'var(--radius-sm)' }}
                >
                    ← Back to Dashboard
                </button>

                {/* Event Selector Dropdown */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Select Event:
                    </span>
                    <select 
                        className="form-control" 
                        style={{ maxWidth: '340px', padding: '0.35rem 0.75rem', fontSize: '0.88rem' }}
                        value={currentEvent ? currentEvent.id : 'all'}
                        onChange={e => {
                            if (e.target.value === 'all') {
                                navigate('/reports');
                            } else {
                                navigate(`/reports/${e.target.value}`);
                            }
                        }}
                    >
                        {roomEvents.map(ev => (
                            <option key={ev.id} value={ev.id}>
                                {ev.title} ({formatDate(ev.date)})
                            </option>
                        ))}
                        <option value="all">📊 All Events Overview</option>
                    </select>
                </div>
            </div>

            {/* If Particular Event is Selected */}
            {isParticularEvent ? (
                <div>
                    {/* Header Banner for Particular Event */}
                    <div className="dashboard-header mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`badge badge-${currentEvent.registrationOpen ? 'success' : 'outline'}`} style={{ fontSize: '0.68rem' }}>
                                    {currentEvent.registrationOpen ? 'Registration Active' : 'Registration Closed'}
                                </span>
                                <span className="badge badge-accent" style={{ fontSize: '0.68rem' }}>
                                    {currentEvent.category || 'General'}
                                </span>
                                {isPaidEvent ? (
                                    <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>₹{currentEvent.fee} Fee</span>
                                ) : (
                                    <span className="badge badge-outline" style={{ fontSize: '0.68rem', color: 'var(--success)', borderColor: 'var(--success)' }}>Free</span>
                                )}
                            </div>
                            <h1 style={{ marginBottom: '0.35rem' }}>{currentEvent.title}</h1>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                                📅 <strong>{formatDate(currentEvent.date)}</strong> &nbsp;|&nbsp; ⏰ <strong>{currentEvent.time || 'All Day'}</strong> &nbsp;|&nbsp; 📍 <strong>{currentEvent.location || 'College Campus'}</strong>
                            </p>
                        </div>
                        <div className="header-actions">
                            <button className="btn btn-outline btn-sm" onClick={handleExportEventCSV}>
                                📊 Export CSV
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                                🖨️ Print / PDF
                            </button>
                        </div>
                    </div>

                    {/* Particular Event Stats Grid */}
                    <div className="stats-grid mb-6">
                        <div className="glass-panel stat-card">
                            <div className="stat-number">{uniqueAttendees.length}</div>
                            <div className="stat-label">Registered Students</div>
                            <small className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                For {formatDate(currentEvent.date)}
                            </small>
                        </div>

                        <div className="glass-panel stat-card">
                            <div className="stat-number">
                                {isPaidEvent ? `₹${totalRevenue}` : 'Free'}
                            </div>
                            <div className="stat-label">Revenue Collected</div>
                            <small className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                {isPaidEvent ? `${verifiedPayments.length} verified payments` : 'Zero Entry Fee'}
                            </small>
                        </div>

                        <div className="glass-panel stat-card">
                            <div className="stat-number">
                                {isPaidEvent ? eventPayments.filter(p => p.ticketIssued).length : uniqueAttendees.length}
                            </div>
                            <div className="stat-label">Official Passes</div>
                            <small className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                {isPaidEvent ? 'E-Tickets issued' : 'All enrolled admitted'}
                            </small>
                        </div>

                        <div className="glass-panel stat-card">
                            <div className="stat-number">
                                {scannedTicketsCount}
                            </div>
                            <div className="stat-label">Admitted / Checked-In</div>
                            <small className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                Verified via QR scanner
                            </small>
                        </div>
                    </div>

                    {/* Detailed Attendee Table for Particular Event */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Registered Students ({uniqueAttendees.length})</h2>
                                <p className="text-secondary" style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>
                                    Full student registration data & dates for {currentEvent.title}
                                </p>
                            </div>
                            <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                                Event Date: {formatDate(currentEvent.date)}
                            </span>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Department & Year</th>
                                        <th>Event Date</th>
                                        <th>Registration Date</th>
                                        <th>Status / Ticket</th>
                                        <th style={{ textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendeesWithProfiles.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center p-8 text-secondary">
                                                No students have registered for this event yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendeesWithProfiles.map((s, idx) => (
                                            <tr key={s.id || idx}>
                                                <td>
                                                    <div 
                                                        className="clickable-user-name"
                                                        style={{ fontWeight: 800 }}
                                                        onClick={() => openUserProfile(s)}
                                                        title="Click to view contact profile & phone number"
                                                    >
                                                        {s.name} 👤
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                        {s.email} {s.phone && `• 📱 ${s.phone}`}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700 }}>{s.branch || 'N/A'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {s.year ? `${s.year} Year` : 'N/A'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
                                                        📅 {formatDate(currentEvent.date)}
                                                    </strong>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {currentEvent.time || 'All Day'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        {s.registeredAt ? formatDate(s.registeredAt) : formatDate(currentEvent.date)}
                                                    </div>
                                                    <small className="text-secondary" style={{ fontSize: '0.72rem' }}>
                                                        {s.registeredAt ? new Date(s.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </small>
                                                </td>
                                                <td>
                                                    {isPaidEvent ? (
                                                        <div className="flex flex-col gap-1 items-start">
                                                            {s.payment?.ticketIssued ? (
                                                                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                                                    🎫 Pass Issued
                                                                </span>
                                                            ) : s.payment?.status === 'verified' ? (
                                                                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                                                                    ✓ Verified
                                                                </span>
                                                            ) : s.payment ? (
                                                                <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                                                                    ⏳ Pending
                                                                </span>
                                                            ) : (
                                                                <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                                                                    Unpaid
                                                                </span>
                                                            )}
                                                            {s.payment?.scanned && (
                                                                <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>
                                                                    ✓ Checked In
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="badge badge-outline" style={{ fontSize: '0.68rem', color: 'var(--success)', borderColor: 'var(--success)' }}>
                                                            Registered ✓
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button 
                                                        className="btn btn-xs btn-outline-danger" 
                                                        onClick={() => handleRemoveAttendee(s.id, s.email)}
                                                        title="Remove from this event"
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
            ) : (
                /* Overall Room Summary Fallback */
                <div>
                    <div className="dashboard-header">
                        <div>
                            <h1 style={{ marginBottom: '0.35rem' }}>Room Report Overview</h1>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                Overview for Room: <strong style={{ color: 'var(--primary)' }}>{state.user?.roomId}</strong>
                            </p>
                        </div>
                        <div className="header-actions">
                            <button className="btn btn-outline btn-sm" onClick={handleExportRoomCSV}>
                                📊 Export CSV
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                                🖨️ Print / PDF
                            </button>
                        </div>
                    </div>

                    <div className="stats-grid mb-6">
                        <div className="glass-panel stat-card">
                            <div className="stat-number">{students.length}</div>
                            <div className="stat-label">Enrolled Students</div>
                        </div>
                        <div className="glass-panel stat-card">
                            <div className="stat-number">{totalRoomRegistrations}</div>
                            <div className="stat-label">Total Registrations</div>
                        </div>
                        <div className="glass-panel stat-card">
                            <div className="stat-number">{roomEvents.length}</div>
                            <div className="stat-label">Active Events</div>
                        </div>
                    </div>

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
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentReport.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center p-8 text-secondary">No active students in this room yet.</td></tr>
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
                                                                <span 
                                                                    key={e.id} 
                                                                    className="badge badge-accent" 
                                                                    style={{ fontSize: '0.65rem', cursor: 'pointer' }}
                                                                    onClick={() => navigate(`/reports/${e.id}`)}
                                                                    title="Click to view full event report"
                                                                >
                                                                    {e.title} (📅 {formatDate(e.date)})
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
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
