import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const Reports = () => {
    const { state, setState } = useAppState();
    const navigate = useNavigate();

    if (state.user?.role !== 'admin') {
        return (
            <div className="glass-panel text-center p-12">
                <h1>Access Denied</h1>
                <p>Only administrators can view room reports.</p>
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

    const totalRoomRegistrations = roomEvents.reduce((sum, e) => sum + (e.attendees || []).length, 0);

    const handleRemoveStudent = (studentId) => {
        if (!window.confirm('Are you sure you want to remove this student from the room? Their event registrations will also be completely cleared.')) return;
        
        const newUsers = state.users.filter(u => u.id !== studentId);
        const newEvents = state.events.map(ev => {
            if (ev.roomId === state.user.roomId) {
                return { ...ev, attendees: (ev.attendees || []).filter(a => String(a.id) !== String(studentId)) };
            }
            return ev;
        });

        setState(prev => ({ ...prev, users: newUsers, events: newEvents }));
    };

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Student Name,Email,Branch,Year,Registered Events Count,Events List\n";
        studentReport.forEach(s => {
            const eventTitles = s.registeredEvents.map(e => e.title).join("; ");
            const row = `"${s.name}","${s.email || 'N/A'}","${s.branch || 'N/A'}","${s.year || 'N/A'}","${s.registeredEvents.length}","${eventTitles}"`;
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
        if (typeof window.html2pdf === 'undefined') {
            alert('PDF library not detected. Loading standard print dialog instead.');
            window.print();
            return;
        }
        
        const printContainer = document.createElement('div');
        printContainer.style.padding = '2rem';
        printContainer.style.background = '#ffffff';
        printContainer.style.color = '#0f172a';
        printContainer.innerHTML = `
            <h1 style="text-align: center; margin-bottom: 2rem;">Room Report - ${state.user.roomId}</h1>
            <p style="text-align: center;">Total Students: ${students.length} | Total Registrations: ${totalRoomRegistrations}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 2rem; border: 1px solid #e2e8f0;">
                <thead>
                    <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                        <th style="padding: 1rem; border: 1px solid #e2e8f0;">Name</th>
                        <th style="padding: 1rem; border: 1px solid #e2e8f0;">Details</th>
                        <th style="padding: 1rem; border: 1px solid #e2e8f0;">Events</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentReport.map(s => `
                        <tr>
                            <td style="padding: 1rem; border: 1px solid #e2e8f0; font-weight: bold;">${s.name}</td>
                            <td style="padding: 1rem; border: 1px solid #e2e8f0;">${s.branch} - ${s.year} Year</td>
                            <td style="padding: 1rem; border: 1px solid #e2e8f0;">${s.registeredEvents.map(e => e.title).join(', ') || 'None'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        const opt = { margin: 0.5, filename: `Report_${state.user.roomId}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
        window.html2pdf().set(opt).from(printContainer).save();
    };

    return (
        <div className="reports-page">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1>Room Registration Report</h1>
                    <p>High-level overview for Room: <strong style={{ color: 'var(--primary)' }}>{state.user.roomId}</strong></p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline" style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }} onClick={handleExportCSV}>📊 Export CSV</button>
                    <button className="btn btn-primary" onClick={handleExportPDF}>📄 Export PDF</button>
                </div>
            </div>

            <div className="grid-cards mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel text-center" style={{ border: '2px solid var(--accent)' }}>
                    <h3 style={{ fontSize: '2.5rem', color: 'var(--accent)', margin: 0 }}>{students.length}</h3>
                    <p style={{ fontWeight: 'bold' }}>Enrolled Students</p>
                </div>
                <div className="glass-panel text-center" style={{ border: '2px solid var(--primary)' }}>
                    <h3 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: 0 }}>{totalRoomRegistrations}</h3>
                    <p style={{ fontWeight: 'bold' }}>Total Registrations</p>
                </div>
                <div className="glass-panel text-center" style={{ border: '2px solid var(--success)' }}>
                    <h3 style={{ fontSize: '2.5rem', color: 'var(--success)', margin: 0 }}>{roomEvents.length}</h3>
                    <p style={{ fontWeight: 'bold' }}>Active Events</p>
                </div>
            </div>

            <div className="glass-panel">
                <div className="flex justify-between items-center mb-6">
                    <h2 style={{ margin: 0 }}>Student Activity Detail</h2>
                    <p className="text-secondary text-sm">Showing filtered results for current room.</p>
                </div>
                <div className="table-container" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '800px', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Student Name</th>
                                <th style={{ padding: '1rem' }}>Academic Profile</th>
                                <th style={{ padding: '1rem' }}>Registrations</th>
                                <th style={{ padding: '1rem' }} className="text-center">Count</th>
                                <th style={{ padding: '1rem' }} className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentReport.length === 0 ? (
                                <tr><td colSpan="5" className="text-center p-12 text-secondary">No active students in this room.</td></tr>
                            ) : (
                                studentReport.map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 800 }}>{s.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.email}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>{s.branch || 'N/A'}</div>
                                            <div style={{ fontSize: '0.8rem' }}>{s.year || 'N/A'} Year</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {s.registeredEvents.length > 0 
                                                ? <div className="flex gap-1 flex-wrap">{s.registeredEvents.map(e => <span key={e.id} className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>{e.title}</span>)}</div>
                                                : <span className="text-secondary text-sm">No registrations</span>}
                                        </td>
                                        <td style={{ padding: '1rem' }} className="text-center">
                                            <span style={{ fontWeight: 800 }}>{s.registeredEvents.length}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }} className="text-right">
                                            <button className="btn btn-sm btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleRemoveStudent(s.id)}>Remove Student</button>
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
