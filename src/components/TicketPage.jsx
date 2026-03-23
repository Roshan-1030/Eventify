import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { QRCodeSVG } from 'qrcode.react';

const TicketPage = () => {
    const { paymentId } = useParams();
    const { state } = useAppState();
    const navigate = useNavigate();

    const payment = state.payments.find(p => String(p.id) === String(paymentId));
    const event = state.events.find(e => String(e.id) === String(payment?.eventId));

    if (!payment || !event) {
        return (
            <div className="glass-panel text-center">
                <h2>Ticket Not Found</h2>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Back Home</button>
            </div>
        );
    }

    return (
        <div className="ticket-page-container flex flex-col items-center justify-center" style={{ minHeight: '80vh', padding: '2rem' }}>
            <div className="mb-6 flex w-100 justify-start" style={{ maxWidth: '750px' }}>
                <button className="btn btn-outline" onClick={() => navigate(-1)}>← Back</button>
            </div>

            <div className="ticket-premium-pass glass-panel" style={{ 
                padding: 0, 
                width: '100%', 
                maxWidth: '750px', 
                overflow: 'hidden', 
                border: 'none',
                boxShadow: 'var(--premium-shadow)',
                position: 'relative',
                background: 'var(--card-bg)',
                animation: 'slideIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                {/* Visual Accent */}
                <div style={{ 
                    position: 'absolute', 
                    top: '-10%', 
                    left: '-10%', 
                    width: '40%', 
                    height: '40%', 
                    background: 'var(--primary)', 
                    filter: 'blur(100px)', 
                    opacity: 0.2,
                    zIndex: 0
                }}></div>

                <div className="ticket-layout" style={{ zIndex: 1, position: 'relative' }}>
                    {/* Event Banner Section */}
                    <div className="ticket-main-section" style={{ 
                        flex: 1.6, 
                        background: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url(${event.image})`, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center',
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <h1 style={{ color: 'white', margin: '0 0 1rem 0', textShadow: '0 4px 15px rgba(0,0,0,0.6)', lineHeight: 1.1 }}>{event.title}</h1>
                            
                            <div className="ticket-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginTop: '2.5rem' }}>
                                <div className="meta-item">
                                    <small style={{ opacity: 0.75, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, fontSize: '0.7rem', display: 'block', marginBottom: '4px' }}>Date</small>
                                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>{event.date}</div>
                                </div>
                                <div className="meta-item">
                                    <small style={{ opacity: 0.75, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, fontSize: '0.7rem', display: 'block', marginBottom: '4px' }}>Time</small>
                                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>{event.time || '10:00 AM'}</div>
                                </div>
                                <div className="meta-item" style={{ gridColumn: 'span 2' }}>
                                    <small style={{ opacity: 0.75, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, fontSize: '0.7rem', display: 'block', marginBottom: '4px' }}>Venue Address</small>
                                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>{event.location || 'College Main Campus'}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px dashed rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <small style={{ opacity: 0.7, textTransform: 'uppercase' }}>Attendee</small>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{payment.userName}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <small style={{ opacity: 0.7, textTransform: 'uppercase' }}>Entry Status</small>
                                {payment.scanned ? (
                                    <div style={{ fontWeight: 800, color: '#4ade80', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>✓</span> VERIFIED ENTRY
                                    </div>
                                ) : (
                                    <div style={{ fontWeight: 800, color: '#FFD700' }}>READY FOR SCAN</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* QR Verification Section */}
                    <div className="ticket-qr-section" style={{ 
                        flex: 1, 
                        background: 'var(--card-bg)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Verified Stamp Overlay */}
                        {payment.scanned && (
                            <div style={{ 
                                position: 'absolute', 
                                top: '50%', 
                                left: '50%', 
                                transform: 'translate(-50%, -50%) rotate(-25deg)',
                                border: '8px solid rgba(16, 185, 129, 0.4)',
                                color: 'rgba(16, 185, 129, 0.4)',
                                padding: '1rem 2rem',
                                borderRadius: '15px',
                                fontSize: '4rem',
                                fontWeight: 900,
                                letterSpacing: '8px',
                                zIndex: 5,
                                pointerEvents: 'none',
                                textTransform: 'uppercase',
                                filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.2))'
                            }}>
                                VERIFIED
                            </div>
                        )}

                        {payment.scanned && (
                            <div style={{ 
                                position: 'absolute', 
                                top: '1.5rem', 
                                right: '1.5rem', 
                                background: '#10B981', 
                                color: 'white', 
                                padding: '0.4rem 1rem', 
                                borderRadius: '30px', 
                                fontSize: '0.75rem', 
                                fontWeight: 900, 
                                zIndex: 10,
                                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                                animation: 'fadeIn 0.6s ease'
                            }}>
                                ✓ ADMITTED
                            </div>
                        )}

                        <div className="qr-container" style={{ 
                            padding: '1.2rem', 
                            background: '#fff', 
                            borderRadius: '24px', 
                            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                            marginBottom: '2rem',
                            border: '1px solid #eee',
                            opacity: payment.scanned ? 0.15 : 1,
                            filter: payment.scanned ? 'grayscale(1)' : 'none',
                            transition: 'all 0.4s ease'
                        }}>
                            <QRCodeSVG value={payment.id} size={180} level="H" includeMargin={true} />
                        </div>

                        <div className="text-center" style={{ position: 'relative', zIndex: 10 }}>
                            <div style={{ 
                                color: payment.scanned ? '#10B981' : 'var(--text-secondary)', 
                                fontSize: '0.8rem', 
                                letterSpacing: '4px', 
                                marginBottom: '0.5rem',
                                fontWeight: 900
                            }}>
                                {payment.scanned ? 'ENTRY RECORDED' : 'SCAN FOR ENTRY'}
                            </div>
                            {payment.scanned && payment.scannedAt && (
                                <div style={{ fontSize: '0.75rem', color: '#065f46', marginBottom: '1rem', fontWeight: 600 }}>
                                    Verified at: {new Date(payment.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                            )}
                            <div style={{ 
                                fontFamily: 'monospace', 
                                fontWeight: 900, 
                                fontSize: '1.1rem', 
                                padding: '0.5rem 1rem',
                                background: payment.scanned ? 'rgba(16, 185, 129, 0.1)' : '#f8f9fa',
                                borderRadius: '8px',
                                color: payment.scanned ? '#065f46' : 'var(--dark)',
                                border: payment.scanned ? '1px solid rgba(16, 185, 129, 0.2)' : 'none'
                             }}>
                                {payment.id.toUpperCase()}
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-top w-100 text-center">
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                                Official Digital Copy • Secure ID Verified
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-secondary" style={{ fontSize: '0.85rem', maxWidth: '600px', textAlign: 'center' }}>
                Please present this digital pass at the venue entrance. This ticket is unique to you and cannot be transferred or reused.
            </p>
        </div>
    );
};

export default TicketPage;
