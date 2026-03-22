import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const Payment = () => {
    const { eventId } = useParams();
    const { state, setState } = useAppState();
    const navigate = useNavigate();

    const event = state.events.find(e => String(e.id) === String(eventId));
    const [screenshot, setScreenshot] = useState("");
    const [loading, setLoading] = useState(false);

    if (!event) return <div className="p-12 text-center"><h1>Event Not Found</h1></div>;

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setScreenshot(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!screenshot) return alert("Please upload the payment screenshot!");
        
        setLoading(true);

        const newPayment = {
            id: Date.now(),
            eventId: event.id,
            userId: state.user.id,
            userName: state.user.name,
            amount: event.fee,
            screenshot,
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        setState(prev => ({
            ...prev,
            payments: [...(prev.payments || []), newPayment]
        }));

        setTimeout(() => {
            alert("✅ Payment proof submitted! Admin will verify your transaction shortly.");
            navigate('/');
        }, 800);
    };

    return (
        <div className="payment-page flex items-center justify-center p-4" style={{ minHeight: '80vh' }}>
            <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem' }}>
                <div className="text-center mb-6">
                    <h1 style={{ margin: 0 }}>Secure Payment</h1>
                    <p className="text-secondary">Registering for: <strong>{event.title}</strong></p>
                </div>

                <div className="payment-card bg-main p-6 rounded-lg text-center border-dashed mb-6" style={{ background: 'rgba(0,0,0,0.02)', border: '2px dashed var(--border)' }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>TOTAL AMOUNT TO PAY</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', margin: '0.5rem 0' }}>₹{event.fee || '0'}</div>
                    
                    {event.qrUrl ? (
                        <div className="mt-4">
                            <p style={{ fontSize: '0.85rem' }}>Scan this QR to pay:</p>
                            <img src={event.qrUrl} alt="Payment QR" style={{ width: '200px', height: '200px', objectFit: 'contain', margin: '1rem auto', padding: '10px', background: 'white', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        </div>
                    ) : (
                        <div className="p-4 mt-4 bg-accent text-white rounded">Admin has not uploaded a QR yet. Please contact the coordinator.</div>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-6">
                        <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Upload Payment Screenshot *</label>
                        <input type="file" className="form-control" accept="image/*" onChange={handleFileUpload} required />
                        {screenshot && (
                            <div className="mt-4 p-2 border rounded" style={{ height: '100px', overflow: 'hidden' }}>
                                <img src={screenshot} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary w-100 py-3" disabled={loading || !event.qrUrl}>
                        {loading ? "Submitting..." : "Submit Payment Proof"}
                    </button>
                    <button type="button" className="btn btn-outline w-100 mt-2" onClick={() => navigate(-1)}>Back</button>
                </form>
            </div>
        </div>
    );
};

export default Payment;
