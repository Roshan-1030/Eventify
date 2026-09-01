import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';

const Payment = () => {
    const { eventId } = useParams();
    const { state } = useAppState();
    const navigate = useNavigate();

    const event = (state.events || []).find(e => String(e.id) === String(eventId));
    const [screenshot, setScreenshot] = useState("");
    const [loading, setLoading] = useState(false);

    if (!event) {
        return (
            <div className="glass-panel text-center p-8" style={{ maxWidth: '500px', margin: '2rem auto' }}>
                <h1>Event Not Found</h1>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Back Home</button>
            </div>
        );
    }

    const isPaidEvent = Boolean(
        event && 
        event.isPaid !== false && 
        event.isPaid !== 'false' && 
        event.fee && 
        Number(event.fee) > 0 && 
        (event.isPaid === true || event.isPaid === 'true' || event.isPaid === undefined)
    );

    if (!isPaidEvent) {
        return (
            <div className="payment-page flex items-center justify-center p-4" style={{ minHeight: '80vh' }}>
                <div className="glass-panel text-center" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 1.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                    <h1 style={{ color: 'var(--success)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Free Event</h1>
                    <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
                        <strong>{event.title}</strong> is free to attend. No payment or verification proof is required!
                    </p>
                    <button className="btn btn-primary w-100" onClick={() => navigate(`/event/${event.id}`)}>
                        ← Back to Event
                    </button>
                </div>
            </div>
        );
    }

    const existingPayment = (state.payments || []).find(p => String(p.eventId) === String(event.id) && String(p.userId) === String(state.user?.id));
    if (existingPayment) {
        return (
            <div className="payment-page flex items-center justify-center p-4" style={{ minHeight: '80vh' }}>
                <div className="glass-panel text-center" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 1.5rem' }}>
                    <h1 style={{ color: 'var(--success)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>✅ Payment Submitted</h1>
                    <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
                        Your payment proof for <strong>{event.title}</strong> is on record.
                    </p>
                    {existingPayment.ticketIssued ? (
                        <div className="p-3 bg-success text-white rounded-lg mb-4 font-bold" style={{ fontSize: '1rem' }}>
                            🎟️ Official E-Ticket Ready
                        </div>
                    ) : (
                        <div className="p-3 rounded-lg mb-4 font-bold" style={{ background: 'var(--accent)', color: '#fff', fontSize: '0.95rem' }}>
                            ⏳ Verification in Progress
                        </div>
                    )}
                    <button className="btn btn-outline w-100" onClick={() => navigate(-1)}>← Back to Event</button>
                </div>
            </div>
        );
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const scale = 500 / img.width;
                    if (scale >= 1) { 
                        setScreenshot(reader.result); 
                        return; 
                    }
                    canvas.width = 500;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setScreenshot(canvas.toDataURL('image/jpeg', 0.6));
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!screenshot) return alert("Please upload the payment screenshot!");
        
        setLoading(true);

        const newPayment = {
            eventId: event.id,
            userId: state.user.id,
            userName: state.user.name,
            userPhone: state.user.phone || '',
            amount: event.fee || '0',
            screenshot,
            status: 'pending',
            ticketIssued: false,
            timestamp: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "payments"), newPayment);
            alert("✅ Payment proof submitted! Admin will verify your transaction shortly.");
            navigate('/');
        } catch(e) {
            console.error("Payment failed", e);
            alert("Upload failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-page flex items-center justify-center p-2" style={{ minHeight: '80vh' }}>
            <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
                <div className="text-center mb-6">
                    <h1 style={{ margin: '0 0 0.25rem 0', fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>Event Payment</h1>
                    <p className="text-secondary" style={{ fontSize: '0.9rem', margin: 0 }}>
                        Paying for: <strong>{event.title}</strong>
                    </p>
                </div>

                <div className="glass-panel text-center mb-6" style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1.5px dashed var(--primary)', padding: '1.5rem' }}>
                    <small style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', fontWeight: 700 }}>Total Payable Amount</small>
                    <div style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, color: 'var(--primary)', margin: '0.25rem 0' }}>
                        ₹{event.fee || '0'}
                    </div>
                    
                    {event.qrUrl ? (
                        <div className="mt-3">
                            <p style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}>Scan using UPI / Payment App:</p>
                            <div style={{ padding: '8px', background: '#ffffff', borderRadius: '12px', display: 'inline-block', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
                                <img src={event.qrUrl} alt="Payment QR" style={{ width: '160px', height: '160px', objectFit: 'contain', display: 'block' }} />
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 mt-3 rounded text-sm" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                            No QR code provided. Please contact event coordinator for manual verification.
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div className="form-group mb-4">
                        <label>Upload Payment Screenshot Proof *</label>
                        <input type="file" className="form-control" accept="image/*" onChange={handleFileUpload} required />
                        {screenshot && (
                            <div className="mt-3 p-2 border rounded" style={{ height: '90px', overflow: 'hidden', borderRadius: '8px' }}>
                                <img src={screenshot} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary w-100" disabled={loading || !screenshot}>
                        {loading ? "Submitting..." : "Submit Payment Proof"}
                    </button>
                    <button type="button" className="btn btn-outline w-100" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Payment;
