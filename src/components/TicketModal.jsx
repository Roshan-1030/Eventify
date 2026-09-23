import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate } from '../utils/dateUtils';

const TicketModal = ({ event, payment, onClose }) => {
    if (!event || !payment) return null;

    return (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 10000 }} onClick={onClose}>
            <div className="ticket-container glass-panel" onClick={e => e.stopPropagation()} style={{ 
                padding: 0, 
                width: '95%', 
                maxWidth: '700px', 
                overflow: 'hidden', 
                border: 'none',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                background: 'var(--card-bg)'
            }}>
                <div className="ticket-content" style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', zIndex: 1, position: 'relative' }}>
                    {/* Left Side: Event Info */}
                    <div className="ticket-left" style={{ 
                        flex: 1.5, 
                        background: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url(${event.image})`, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center',
                        color: 'white',
                        padding: '2.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '350px'
                    }}>
                        <div>
                            <div className="badge mb-4" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                                OFFICIAL EVENT PASS
                            </div>
                            <h1 style={{ color: 'white', fontSize: '2.5rem', margin: '0 0 1rem 0', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{event.title}</h1>
                            
                            <div className="ticket-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
                                <div className="detail-item">
                                    <small style={{ opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Date</small>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{formatDate(event.date)}</div>
                                </div>
                                <div className="detail-item">
                                    <small style={{ opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Time</small>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{event.time || '10:00 AM'}</div>
                                </div>
                                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                    <small style={{ opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Venue</small>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{event.location || 'College Campus'}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Issued to:</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{payment.userName}</div>
                        </div>
                    </div>

                    {/* Right Side: QR Code Area */}
                    <div className="ticket-right" style={{ 
                        flex: 1, 
                        padding: '2.5rem', 
                        background: 'var(--card-bg)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderLeft: window.innerWidth < 768 ? 'none' : '2px dashed var(--border)',
                        borderTop: window.innerWidth < 768 ? '2px dashed var(--border)' : 'none',
                        position: 'relative'
                    }}>
                        {/* Decorative ticket cutouts */}
                        {! (window.innerWidth < 768) && (
                            <>
                                <div style={{ position: 'absolute', top: '-15px', left: '-15px', width: '30px', height: '30px', background: 'var(--bg-main)', borderRadius: '50%', zIndex: 10 }}></div>
                                <div style={{ position: 'absolute', bottom: '-15px', left: '-15px', width: '30px', height: '30px', background: 'var(--bg-main)', borderRadius: '50%', zIndex: 10 }}></div>
                            </>
                        )}

                        <div className="qr-wrapper" style={{ 
                            padding: '1rem', 
                            background: 'white', 
                            borderRadius: '16px', 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            marginBottom: '1.5rem'
                        }}>
                            <QRCodeSVG value={payment.id} size={150} level="H" />
                        </div>

                        <div className="test-center">
                            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: 'var(--text-secondary)' }}>
                                #{payment.id.slice(0,12).toUpperCase()}
                            </div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase' }}>
                                Verified & Confirmed
                            </div>
                        </div>

                        <button className="btn btn-outline w-100 mt-8" onClick={() => window.print()} style={{ minHeight: '40px', fontSize: '0.8rem' }}>
                            🖨️ Print Ticket
                        </button>
                    </div>
                </div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    style={{ 
                        position: 'absolute', 
                        top: '1rem', 
                        right: '1rem', 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.2)', 
                        backdropFilter: 'blur(10px)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        fontWeight: 800
                    }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default TicketModal;
