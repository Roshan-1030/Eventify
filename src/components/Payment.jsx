import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { formatDate, formatDateTime } from '../utils/dateUtils';

const Payment = () => {
    const { eventId } = useParams();
    const { state, setState, openUserProfile } = useAppState();
    const navigate = useNavigate();

    const isAdmin = state.user?.role === 'admin';
    const userRoomId = state.user?.roomId || '';

    // All paid events in user's room
    const roomEvents = (state.events || []).filter(e => e.roomId === userRoomId);
    const paidEvents = roomEvents.filter(e => 
        e.isPaid !== false && 
        e.isPaid !== 'false' && 
        e.fee && 
        Number(e.fee) > 0 && 
        (e.isPaid === true || e.isPaid === 'true' || e.isPaid === undefined)
    );

    // Selected event (if route has eventId or admin selected from dropdown)
    const [adminSelectedEventId, setAdminSelectedEventId] = useState(eventId || 'all');
    const [activeFilter, setActiveFilter] = useState('all'); // all | pending | verified | rejected
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedScreenshot, setSelectedScreenshot] = useState(null);

    // Student form state
    const [screenshot, setScreenshot] = useState("");
    const [transactionRef, setTransactionRef] = useState("");
    const [loading, setLoading] = useState(false);

    // Target event for focused view
    const targetEvent = eventId 
        ? roomEvents.find(e => String(e.id) === String(eventId))
        : (paidEvents.length > 0 ? paidEvents[0] : null);

    // ----------------------------------------------------
    // ADMIN ACTIONS & HANDLERS
    // ----------------------------------------------------
    const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
        try {
            await updateDoc(doc(db, "payments", paymentId), { status: newStatus });
        } catch(e) { 
            console.error("Error updating payment status", e); 
        }
        setState(prev => ({
            ...prev,
            payments: (prev.payments || []).map(p => String(p.id) === String(paymentId) ? { ...p, status: newStatus } : p)
        }));
    };

    const handleIssueTicket = async (paymentId) => {
        try {
            await updateDoc(doc(db, "payments", paymentId), { ticketIssued: true, status: 'verified' });
        } catch(e) { 
            console.error("Error issuing ticket", e); 
        }
        setState(prev => ({
            ...prev,
            payments: (prev.payments || []).map(p => String(p.id) === String(paymentId) ? { ...p, ticketIssued: true, status: 'verified' } : p)
        }));
        alert("🎟️ Official E-Ticket issued to the student!");
    };

    // ----------------------------------------------------
    // STUDENT SUBMISSION HANDLER
    // ----------------------------------------------------
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const scale = 600 / img.width;
                    if (scale >= 1) { 
                        setScreenshot(reader.result); 
                        return; 
                    }
                    canvas.width = 600;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setScreenshot(canvas.toDataURL('image/jpeg', 0.65));
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitPaymentProof = async (e) => {
        e.preventDefault();
        if (!screenshot) return alert("Please upload the payment proof screenshot!");
        if (!targetEvent) return alert("No valid event selected!");

        setLoading(true);

        const newPayment = {
            eventId: targetEvent.id,
            userId: state.user.id,
            userName: state.user.name || state.user.email,
            userPhone: state.user.phone || '',
            amount: targetEvent.fee || '0',
            screenshot,
            transactionRef: transactionRef.trim(),
            status: 'pending',
            ticketIssued: false,
            timestamp: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "payments"), newPayment);
            alert("✅ Payment proof submitted! Organizers will verify your transaction shortly.");
            navigate(`/event/${targetEvent.id}`);
        } catch(err) {
            console.error("Payment submission failed", err);
            alert("Failed to submit proof. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ====================================================
    // 1. ADMIN FULL PAGE VIEW
    // ====================================================
    if (isAdmin) {
        // Collect all payments belonging to room events
        const roomEventIds = new Set(roomEvents.map(e => String(e.id)));
        const allRoomPayments = (state.payments || []).filter(p => roomEventIds.has(String(p.eventId)));

        // Filter by selected event
        const activeEventId = eventId || adminSelectedEventId;
        const currentFilteredPayments = allRoomPayments.filter(p => {
            if (activeEventId && activeEventId !== 'all') {
                return String(p.eventId) === String(activeEventId);
            }
            return true;
        });

        // Compute metrics
        const totalRevenue = currentFilteredPayments
            .filter(p => p.status === 'verified')
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const verifiedCount = currentFilteredPayments.filter(p => p.status === 'verified').length;
        const pendingCount = currentFilteredPayments.filter(p => p.status === 'pending' || !p.status).length;
        const rejectedCount = currentFilteredPayments.filter(p => p.status === 'rejected').length;
        const totalCount = currentFilteredPayments.length;

        // Apply status and search filter
        const displayedPayments = currentFilteredPayments.filter(p => {
            if (activeFilter === 'pending') {
                if (p.status !== 'pending' && p.status) return false;
            } else if (activeFilter === 'verified') {
                if (p.status !== 'verified') return false;
            } else if (activeFilter === 'rejected') {
                if (p.status !== 'rejected') return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const studentName = (p.userName || '').toLowerCase();
                const ref = (p.transactionRef || '').toLowerCase();
                const ev = roomEvents.find(e => String(e.id) === String(p.eventId));
                const evTitle = (ev?.title || '').toLowerCase();
                return studentName.includes(q) || ref.includes(q) || evTitle.includes(q);
            }
            return true;
        });

        const activeEventObj = roomEvents.find(e => String(e.id) === String(activeEventId));

        return (
            <div className="payment-page" style={{ width: '100%', padding: 'clamp(1rem, 3vw, 2.5rem)', animation: 'fadeIn 0.25s ease-out' }}>
                {/* Top Header */}
                <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
                    <div>
                        <button className="btn btn-outline btn-sm mb-2" onClick={() => navigate(-1)}>
                            ← Back
                        </button>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}>
                            💳 Payment & Verification Center
                        </h1>
                        <p className="text-secondary" style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                            {activeEventObj 
                                ? `Managing payments for ${activeEventObj.title} (📅 ${formatDate(activeEventObj.date)})` 
                                : `All Room Paid Events (${paidEvents.length} events)`}
                        </p>
                    </div>

                    {/* Event Switcher Dropdown */}
                    <div style={{ minWidth: '240px', maxWidth: '100%' }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                            Select Event:
                        </label>
                        <select 
                            className="form-control"
                            value={activeEventId}
                            onChange={(e) => {
                                const newId = e.target.value;
                                setAdminSelectedEventId(newId);
                                if (newId === 'all') {
                                    navigate('/payment');
                                } else {
                                    navigate(`/payment/${newId}`);
                                }
                            }}
                            style={{ fontWeight: 600 }}
                        >
                            <option value="all">🌐 All Paid Events ({paidEvents.length})</option>
                            {paidEvents.map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.title} (📅 {formatDate(e.date)} - ₹{e.fee})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-4 gap-3 mb-6">
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>
                            Total Collected
                        </div>
                        <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--primary)', marginTop: '0.35rem' }}>
                            ₹{totalRevenue.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            From {verifiedCount} verified transactions
                        </div>
                    </div>

                    <div 
                        className="glass-panel" 
                        style={{ padding: '1.25rem', cursor: 'pointer', border: activeFilter === 'pending' ? '1.5px solid var(--accent)' : '1px solid var(--border)' }}
                        onClick={() => setActiveFilter(activeFilter === 'pending' ? 'all' : 'pending')}
                    >
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', fontWeight: 700 }}>
                            ⏳ Pending Approval
                        </div>
                        <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--accent)', marginTop: '0.35rem' }}>
                            {pendingCount}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            Needs organizer review
                        </div>
                    </div>

                    <div 
                        className="glass-panel" 
                        style={{ padding: '1.25rem', cursor: 'pointer', border: activeFilter === 'verified' ? '1.5px solid var(--success)' : '1px solid var(--border)' }}
                        onClick={() => setActiveFilter(activeFilter === 'verified' ? 'all' : 'verified')}
                    >
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--success)', fontWeight: 700 }}>
                            ✅ Verified
                        </div>
                        <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--success)', marginTop: '0.35rem' }}>
                            {verifiedCount}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            Confirmed payments
                        </div>
                    </div>

                    <div 
                        className="glass-panel" 
                        style={{ padding: '1.25rem', cursor: 'pointer', border: activeFilter === 'rejected' ? '1.5px solid var(--danger)' : '1px solid var(--border)' }}
                        onClick={() => setActiveFilter(activeFilter === 'rejected' ? 'all' : 'rejected')}
                    >
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--danger)', fontWeight: 700 }}>
                            ❌ Rejected
                        </div>
                        <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--danger)', marginTop: '0.35rem' }}>
                            {rejectedCount}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            Invalid / unpaid proofs
                        </div>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="glass-panel mb-6" style={{ padding: '1rem 1.25rem' }}>
                    <div className="flex justify-between items-center flex-wrap gap-3">
                        <div className="flex gap-2 flex-wrap">
                            <button 
                                className={`btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setActiveFilter('all')}
                            >
                                All ({totalCount})
                            </button>
                            <button 
                                className={`btn btn-sm ${activeFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setActiveFilter('pending')}
                            >
                                ⏳ Pending ({pendingCount})
                            </button>
                            <button 
                                className={`btn btn-sm ${activeFilter === 'verified' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setActiveFilter('verified')}
                            >
                                ✅ Verified ({verifiedCount})
                            </button>
                            <button 
                                className={`btn btn-sm ${activeFilter === 'rejected' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setActiveFilter('rejected')}
                            >
                                ❌ Rejected ({rejectedCount})
                            </button>
                        </div>

                        <div style={{ flex: '1', maxWidth: '360px', minWidth: '220px' }}>
                            <input 
                                type="text"
                                className="form-control"
                                placeholder="🔍 Search student or event..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ fontSize: '0.85rem' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Full Width Verification Table */}
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-container">
                        {displayedPayments.length === 0 ? (
                            <div className="text-center p-8 text-secondary">
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💸</div>
                                <h3 style={{ margin: '0 0 0.25rem 0' }}>No Transactions Found</h3>
                                <p style={{ fontSize: '0.88rem', margin: 0 }}>
                                    {searchQuery ? "No payments match your search filter." : "No payments have been submitted for this event yet."}
                                </p>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Event</th>
                                        <th>Amount</th>
                                        <th>Proof Screenshot</th>
                                        <th>Date Submitted</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedPayments.map(p => {
                                        const eventObj = roomEvents.find(e => String(e.id) === String(p.eventId));
                                        return (
                                            <tr key={p.id}>
                                                <td>
                                                    <strong 
                                                        className="clickable-user-name"
                                                        onClick={() => openUserProfile({ id: p.userId, name: p.userName })}
                                                        title="Click to view contact profile & phone"
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                                    >
                                                        {p.userName || 'Student'} 👤
                                                    </strong>
                                                    {p.transactionRef && (
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                            Ref: <code>{p.transactionRef}</code>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {eventObj?.title || 'Unknown Event'}
                                                    </span>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                                        📅 {formatDate(eventObj?.date)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
                                                        ₹{p.amount || '0'}
                                                    </strong>
                                                </td>
                                                <td>
                                                    {p.screenshot ? (
                                                        <div 
                                                            style={{ 
                                                                width: '56px', 
                                                                height: '38px', 
                                                                background: '#1a1a1a', 
                                                                borderRadius: '6px', 
                                                                cursor: 'pointer', 
                                                                overflow: 'hidden',
                                                                border: '1px solid var(--border)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }} 
                                                            onClick={() => setSelectedScreenshot(p.screenshot)}
                                                            title="Click to view full screenshot proof"
                                                        >
                                                            <img 
                                                                src={p.screenshot} 
                                                                alt="Proof" 
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="text-secondary" style={{ fontSize: '0.75rem' }}>No screenshot</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                                        {formatDate(p.timestamp)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${p.status === 'verified' ? 'success' : (p.status === 'rejected' ? 'danger' : 'accent')}`} style={{ fontSize: '0.7rem' }}>
                                                        {(p.status || 'PENDING').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="flex gap-1 items-center justify-end flex-wrap">
                                                        {!p.ticketIssued && p.status === 'verified' && (
                                                            <button 
                                                                className="btn btn-primary btn-xs" 
                                                                onClick={() => handleIssueTicket(p.id)}
                                                            >
                                                                🎟️ Issue Ticket
                                                            </button>
                                                        )}
                                                        {p.ticketIssued && (
                                                            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                                                ISSUED ✅
                                                            </span>
                                                        )}
                                                        {p.status !== 'verified' && (
                                                            <button 
                                                                className="btn btn-success btn-xs" 
                                                                onClick={() => handleUpdatePaymentStatus(p.id, 'verified')}
                                                                title="Verify payment"
                                                            >
                                                                ✓ Verify
                                                            </button>
                                                        )}
                                                        {p.status !== 'rejected' && (
                                                            <button 
                                                                className="btn btn-danger btn-xs" 
                                                                onClick={() => handleUpdatePaymentStatus(p.id, 'rejected')}
                                                                title="Reject payment"
                                                            >
                                                                ✕ Reject
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Full Resolution Screenshot Lightbox */}
                {selectedScreenshot && createPortal(
                    <div className="modal-overlay" onClick={() => setSelectedScreenshot(null)}>
                        <div 
                            className="glass-panel modal-content-panel" 
                            style={{ maxWidth: '580px', padding: '1.25rem', textAlign: 'center' }} 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Payment Screenshot Proof</h3>
                                <button 
                                    className="btn btn-sm btn-outline" 
                                    style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }} 
                                    onClick={() => setSelectedScreenshot(null)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div style={{ maxHeight: '70vh', overflowY: 'auto', background: '#000', borderRadius: '8px', padding: '0.5rem' }}>
                                <img 
                                    src={selectedScreenshot} 
                                    alt="Full Screenshot" 
                                    style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} 
                                />
                            </div>
                            <button 
                                className="btn btn-primary btn-sm mt-3 w-100" 
                                onClick={() => setSelectedScreenshot(null)}
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    }

    // ====================================================
    // 2. STUDENT FULL PAGE VIEW
    // ====================================================

    // Case 2A: Student accessed /payment/:eventId (Paying for a specific event)
    if (eventId && targetEvent) {
        const isPaid = Boolean(
            targetEvent.isPaid !== false && 
            targetEvent.isPaid !== 'false' && 
            targetEvent.fee && 
            Number(targetEvent.fee) > 0 && 
            (targetEvent.isPaid === true || targetEvent.isPaid === 'true' || targetEvent.isPaid === undefined)
        );

        if (!isPaid) {
            return (
                <div className="payment-page flex items-center justify-center p-4" style={{ minHeight: '80vh' }}>
                    <div className="glass-panel text-center" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 1.5rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                        <h1 style={{ color: 'var(--success)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Free Event</h1>
                        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
                            <strong>{targetEvent.title}</strong> is a free event. No payment or verification proof is required!
                        </p>
                        <button className="btn btn-primary w-100" onClick={() => navigate(`/event/${targetEvent.id}`)}>
                            ← Back to Event
                        </button>
                    </div>
                </div>
            );
        }

        const existingPayment = (state.payments || []).find(p => 
            String(p.eventId) === String(targetEvent.id) && String(p.userId) === String(state.user?.id)
        );

        if (existingPayment) {
            return (
                <div className="payment-page flex items-center justify-center p-4" style={{ minHeight: '80vh' }}>
                    <div className="glass-panel text-center" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem 1.5rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                            {existingPayment.ticketIssued ? '🎟️' : (existingPayment.status === 'rejected' ? '❌' : '⏳')}
                        </div>
                        
                        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                            {existingPayment.ticketIssued 
                                ? 'Pass Ready & Confirmed' 
                                : (existingPayment.status === 'rejected' ? 'Payment Rejected' : 'Payment Submitted')}
                        </h1>
                        
                        <p className="text-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.92rem' }}>
                            Event: <strong>{targetEvent.title}</strong><br />
                            Date: <strong>{formatDate(targetEvent.date)}</strong>
                        </p>

                        <div className="glass-panel mb-4" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', textAlign: 'left', fontSize: '0.85rem' }}>
                            <div className="flex justify-between py-1 border-bottom">
                                <span className="text-secondary">Amount Paid:</span>
                                <strong>₹{existingPayment.amount || targetEvent.fee}</strong>
                            </div>
                            <div className="flex justify-between py-1 border-bottom">
                                <span className="text-secondary">Date Submitted:</span>
                                <strong>{formatDate(existingPayment.timestamp)}</strong>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-secondary">Status:</span>
                                <span className={`badge badge-${existingPayment.ticketIssued ? 'success' : (existingPayment.status === 'rejected' ? 'danger' : 'accent')}`}>
                                    {(existingPayment.status || 'PENDING').toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {existingPayment.ticketIssued ? (
                            <button 
                                className="btn btn-primary w-100 mb-2" 
                                style={{ background: 'var(--success-gradient)', fontWeight: 800 }}
                                onClick={() => navigate(`/ticket/${existingPayment.id}`)}
                            >
                                🎫 View Official E-Ticket Pass
                            </button>
                        ) : existingPayment.status === 'rejected' ? (
                            <div className="p-3 bg-danger text-white rounded-lg mb-4 text-sm">
                                Your payment proof was rejected. Please verify the amount or re-upload screenshot.
                            </div>
                        ) : (
                            <div className="p-3 rounded-lg mb-4 font-bold" style={{ background: 'var(--accent)', color: '#fff', fontSize: '0.9rem' }}>
                                ⏳ Verification In Progress. Event organizers will issue your pass shortly.
                            </div>
                        )}

                        <button className="btn btn-outline w-100" onClick={() => navigate(`/event/${targetEvent.id}`)}>
                            ← Back to Event Details
                        </button>
                    </div>
                </div>
            );
        }

        // Student checkout form for targetEvent
        return (
            <div className="payment-page flex items-center justify-center p-3" style={{ minHeight: '80vh' }}>
                <div className="glass-panel" style={{ maxWidth: '540px', width: '100%', padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
                    <button className="btn btn-outline btn-sm mb-4" onClick={() => navigate(`/event/${targetEvent.id}`)}>
                        ← Back to Event
                    </button>

                    <div className="text-center mb-6">
                        <span className="badge badge-accent mb-2">{targetEvent.category || 'Event'}</span>
                        <h1 style={{ margin: '0 0 0.35rem 0', fontSize: 'clamp(1.4rem, 3vw, 1.85rem)' }}>
                            {targetEvent.title}
                        </h1>
                        <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0 }}>
                            📅 {formatDate(targetEvent.date)} &nbsp;|&nbsp; 📍 {targetEvent.location || 'College Campus'}
                        </p>
                    </div>

                    {/* Payable Box */}
                    <div className="glass-panel text-center mb-5" style={{ background: 'rgba(37, 99, 235, 0.05)', border: '1.5px dashed var(--primary)', padding: '1.25rem' }}>
                        <small style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                            Payable Registration Fee
                        </small>
                        <div style={{ fontSize: 'clamp(2.2rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--primary)', margin: '0.2rem 0' }}>
                            ₹{targetEvent.fee || '0'}
                        </div>
                        
                        {targetEvent.qrUrl ? (
                            <div className="mt-3">
                                <p style={{ fontSize: '0.82rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Scan QR code with GPay, PhonePe, Paytm, or UPI app:
                                </p>
                                <div style={{ padding: '8px', background: '#ffffff', borderRadius: '12px', display: 'inline-block', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                                    <img 
                                        src={targetEvent.qrUrl} 
                                        alt="Payment QR" 
                                        style={{ width: '160px', height: '160px', objectFit: 'contain', display: 'block' }} 
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 mt-3 rounded text-sm" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                                No digital QR attached. Please pay the registration fee of ₹{targetEvent.fee} to the coordinator: <strong>{targetEvent.headCoordinator || 'Admin'}</strong>
                            </div>
                        )}
                    </div>

                    {/* Form for Proof Upload */}
                    <form onSubmit={handleSubmitPaymentProof} className="flex flex-col gap-4">
                        <div className="form-group mb-0">
                            <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Upload Payment Proof Screenshot *</label>
                            <input 
                                type="file" 
                                className="form-control" 
                                accept="image/*" 
                                onChange={handleFileUpload} 
                                required 
                            />
                            {screenshot && (
                                <div className="mt-2 p-2 border rounded" style={{ height: '100px', overflow: 'hidden', borderRadius: '8px', background: '#000' }}>
                                    <img 
                                        src={screenshot} 
                                        alt="Preview" 
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-group mb-0">
                            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Transaction ID / UPI Reference (Optional)</label>
                            <input 
                                type="text"
                                className="form-control"
                                placeholder="e.g. UPI Ref: 123456789012"
                                value={transactionRef}
                                onChange={e => setTransactionRef(e.target.value)}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary w-100 mt-2" 
                            disabled={loading || !screenshot}
                            style={{ fontWeight: 700, padding: '0.75rem' }}
                        >
                            {loading ? "Submitting..." : "Submit Payment Proof"}
                        </button>
                        
                        <button 
                            type="button" 
                            className="btn btn-outline w-100" 
                            onClick={() => navigate(`/event/${targetEvent.id}`)}
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Case 2B: Student accessed /payment without eventId (Student's Payment & Passes Overview)
    const myPayments = (state.payments || []).filter(p => String(p.userId) === String(state.user?.id));

    return (
        <div className="payment-page" style={{ width: '100%', padding: 'clamp(1rem, 3vw, 2.5rem)', animation: 'fadeIn 0.25s ease-out' }}>
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
                <div>
                    <button className="btn btn-outline btn-sm mb-2" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}>
                        💳 My Payments & Event Passes
                    </h1>
                    <p className="text-secondary" style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                        View your submitted payments, verification statuses, and download official event passes.
                    </p>
                </div>

                <Link to="/" className="btn btn-primary btn-sm">
                    Browse Events
                </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-3 gap-3 mb-6">
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        Payments Submitted
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', marginTop: '0.35rem' }}>
                        {myPayments.length}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--success)', fontWeight: 700 }}>
                        Issued Passes
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--success)', marginTop: '0.35rem' }}>
                        {myPayments.filter(p => p.ticketIssued).length}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700 }}>
                        Pending Verification
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)', marginTop: '0.35rem' }}>
                        {myPayments.filter(p => p.status === 'pending' || !p.status).length}
                    </div>
                </div>
            </div>

            {/* List of Paid Events in Room */}
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                Paid Room Events ({paidEvents.length})
            </h3>

            {paidEvents.length === 0 ? (
                <div className="glass-panel text-center p-8 text-secondary">
                    <p>There are no paid events in this room.</p>
                </div>
            ) : (
                <div className="grid grid-2 gap-4">
                    {paidEvents.map(ev => {
                        const pay = myPayments.find(p => String(p.eventId) === String(ev.id));
                        const isReg = (ev.attendees || []).some(a => String(a.id) === String(state.user?.id));

                        return (
                            <div key={ev.id} className="glass-panel flex flex-col justify-between" style={{ padding: '1.5rem', gap: '1rem' }}>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{ev.category || 'Event'}</span>
                                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>₹{ev.fee}</span>
                                    </div>
                                    <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem' }}>{ev.title}</h3>
                                    <p className="text-secondary" style={{ margin: 0, fontSize: '0.82rem' }}>
                                        📅 {formatDate(ev.date)} &nbsp;|&nbsp; 📍 {ev.location || 'Campus'}
                                    </p>
                                </div>

                                <div className="border-top pt-3 flex justify-between items-center flex-wrap gap-2">
                                    <div>
                                        {pay ? (
                                            pay.ticketIssued ? (
                                                <span className="badge badge-success">PASS ISSUED ✅</span>
                                            ) : pay.status === 'rejected' ? (
                                                <span className="badge badge-danger">REJECTED ❌</span>
                                            ) : (
                                                <span className="badge badge-accent">⏳ VERIFYING</span>
                                            )
                                        ) : isReg ? (
                                            <span className="badge badge-outline" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>REGISTERED (UNPAID)</span>
                                        ) : (
                                            <span className="text-secondary text-xs">Not registered</span>
                                        )}
                                    </div>

                                    <div>
                                        {pay?.ticketIssued ? (
                                            <button 
                                                className="btn btn-success btn-sm"
                                                onClick={() => navigate(`/ticket/${pay.id}`)}
                                            >
                                                🎫 View Pass
                                            </button>
                                        ) : pay ? (
                                            <button 
                                                className="btn btn-outline btn-sm"
                                                onClick={() => navigate(`/payment/${ev.id}`)}
                                            >
                                                View Status
                                            </button>
                                        ) : (
                                            <button 
                                                className="btn btn-primary btn-sm"
                                                onClick={() => navigate(`/payment/${ev.id}`)}
                                            >
                                                Pay ₹{ev.fee}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Payment;
