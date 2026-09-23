import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate } from '../utils/dateUtils';

const TicketPage = () => {
    const { paymentId } = useParams();
    const { state } = useAppState();
    const navigate = useNavigate();

    const payment = (state.payments || []).find(p => String(p.id) === String(paymentId));
    const event = (state.events || []).find(e => String(e.id) === String(payment?.eventId));

    if (!payment || !event) {
        return (
            <div className="glass-panel text-center" style={{ padding: '3rem 1.5rem', maxWidth: '500px', margin: '2rem auto' }}>
                <h2>Ticket Not Found</h2>
                <p className="text-secondary">We couldn't locate this pass. It may have been modified or removed.</p>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Back Home</button>
            </div>
        );
    }

    return (
        <div className="ticket-page-container flex flex-col items-center justify-center" style={{ minHeight: '80vh', padding: '1rem 0.5rem' }}>
            <div className="mb-4 flex w-100 justify-start" style={{ maxWidth: '780px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ borderRadius: 'var(--radius-sm)' }}>
                    ← Back
                </button>
            </div>

            <div className="ticket-premium-pass glass-panel" style={{ 
                padding: 0, 
                width: '100%', 
                maxWidth: '780px', 
                overflow: 'hidden', 
                border: 'none',
                boxShadow: 'var(--premium-shadow)',
                position: 'relative',
                background: 'var(--card-bg)',
                borderRadius: '24px'
            }}>
                <div className="ticket-layout" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                    {/* Event Banner Section */}
                    <div className="ticket-main-section" style={{ 
                        flex: '1 1 340px', 
                        background: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.88)), url(${event.image})`, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center',
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: 'clamp(1.5rem, 3vw, 2.5rem)',
                        minHeight: '340px'
                    }}>
                        <div>
                            <span className="badge badge-success mb-2" style={{ fontSize: '0.7rem' }}>OFFICIAL EVENT PASS</span>
                            <h1 style={{ color: '#ffffff', margin: '0.25rem 0 1rem 0', textShadow: '0 4px 15px rgba(0,0,0,0.6)', lineHeight: 1.15, fontSize: 'clamp(1.4rem, 3vw, 2.2rem)' }}>
                                {event.title}
                            </h1>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                                <div>
                                    <small style={{ opacity: 0.75, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, fontSize: '0.68rem', display: 'block', marginBottom: '2px' }}>Date</small>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>{formatDate(event.date)}</div>
                                </div>
                                <div>
                                    <small style={{ opacity: 0.75, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, fontSize: '0.68rem', display: 'block', marginBottom: '2px' }}>Time</small>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>{event.time || '10:00 AM'}</div>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <small style={{ opacity: 0.75, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, fontSize: '0.68rem', display: 'block', marginBottom: '2px' }}>Venue</small>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>{event.location || 'College Campus'}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '2px dashed rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                                <small style={{ opacity: 0.7, textTransform: 'uppercase', fontSize: '0.68rem' }}>Attendee</small>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>{payment.userName}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <small style={{ opacity: 0.7, textTransform: 'uppercase', fontSize: '0.68rem' }}>Status</small>
                                {payment.scanned ? (
                                    <div style={{ fontWeight: 800, color: '#4ade80', fontSize: '0.95rem' }}>
                                        ✓ ADMITTED
                                    </div>
                                ) : (
                                    <div style={{ fontWeight: 800, color: '#facc15', fontSize: '0.95rem' }}>READY FOR SCAN</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* QR Verification Section */}
                    <div className="ticket-qr-section" style={{ 
                        flex: '1 1 260px', 
                        background: 'var(--card-bg)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        position: 'relative',
                        padding: 'clamp(1.5rem, 3vw, 2.5rem)',
                        borderLeft: '2px dashed var(--border)'
                    }}>
                        {payment.scanned && (
                            <div style={{ 
                                position: 'absolute', 
                                top: '1rem', 
                                right: '1rem', 
                                background: '#10B981', 
                                color: 'white', 
                                padding: '0.25rem 0.75rem', 
                                borderRadius: '30px', 
                                fontSize: '0.7rem', 
                                fontWeight: 900
                            }}>
                                ✓ VERIFIED
                            </div>
                        )}

                        <div style={{ 
                            padding: '1rem', 
                            background: '#ffffff', 
                            borderRadius: '16px', 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                            marginBottom: '1.25rem',
                            border: '1px solid #e2e8f0',
                            opacity: payment.scanned ? 0.25 : 1
                        }}>
                            <QRCodeSVG value={payment.id} size={150} level="H" includeMargin={true} />
                        </div>

                        <div className="text-center">
                            <div style={{ 
                                color: payment.scanned ? '#10B981' : 'var(--text-secondary)', 
                                fontSize: '0.75rem', 
                                letterSpacing: '2px', 
                                marginBottom: '0.35rem',
                                fontWeight: 800
                            }}>
                                {payment.scanned ? 'ENTRY RECORDED' : 'PRESENT AT ENTRANCE'}
                            </div>
                            <div style={{ 
                                fontFamily: 'monospace', 
                                fontWeight: 900, 
                                fontSize: '0.95rem', 
                                padding: '0.35rem 0.75rem', 
                                background: payment.scanned ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.04)',
                                borderRadius: '6px',
                                color: payment.scanned ? '#065f46' : 'var(--text-primary)',
                                letterSpacing: '1px'
                            }}>
                                {payment.id.slice(0, 16).toUpperCase()}
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', width: '100%', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
                                Official Pass • Non-Transferable
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketPage;
