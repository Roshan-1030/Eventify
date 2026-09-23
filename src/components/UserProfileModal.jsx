import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const UserProfileModal = () => {
    const { state, selectedProfileUser, closeUserProfile } = useAppState();
    const navigate = useNavigate();
    const [copiedPhone, setCopiedPhone] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeUserProfile();
        };
        if (selectedProfileUser) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedProfileUser, closeUserProfile]);

    if (!selectedProfileUser) return null;

    const isSelf = Boolean(
        state.user && (
            (selectedProfileUser.id && String(state.user.id) === String(selectedProfileUser.id)) ||
            (selectedProfileUser.userId && String(state.user.id) === String(selectedProfileUser.userId)) ||
            (selectedProfileUser.email && state.user.email && selectedProfileUser.email.toLowerCase() === state.user.email.toLowerCase()) ||
            (selectedProfileUser.name && state.user.name && selectedProfileUser.name.toLowerCase() === state.user.name.toLowerCase())
        )
    );

    const displayName = selectedProfileUser.name || selectedProfileUser.userName || selectedProfileUser.author || 'User';
    const displayEmail = selectedProfileUser.email || selectedProfileUser.userEmail || '';
    const displayPhone = selectedProfileUser.phone || '';
    const role = (selectedProfileUser.role || 'student').toLowerCase();
    const initial = (displayName.charAt(0) || 'U').toUpperCase();

    // Clean phone number for tel: and wa.me: links
    const cleanPhoneDigits = displayPhone.replace(/[^0-9+]/g, '');
    const waPhoneDigits = displayPhone.replace(/[^0-9]/g, '');

    const handleCopyPhone = () => {
        if (!displayPhone) return;
        navigator.clipboard.writeText(displayPhone).then(() => {
            setCopiedPhone(true);
            setTimeout(() => setCopiedPhone(false), 2000);
        });
    };

    return createPortal(
        <div className="modal-overlay" style={{ zIndex: 100000 }} onClick={closeUserProfile}>
            <div 
                className="glass-panel modal-content-panel user-contact-modal" 
                style={{ 
                    maxWidth: '440px', 
                    width: '100%',
                    padding: 0,
                    overflow: 'hidden',
                    position: 'relative'
                }} 
                onClick={e => e.stopPropagation()}
            >
                {/* Header Banner */}
                <div 
                    style={{ 
                        background: 'var(--primary)',
                        padding: '1.5rem 1.25rem 2.75rem',
                        color: '#ffffff',
                        position: 'relative',
                        textAlign: 'center'
                    }}
                >
                    <button 
                        className="modal-close-btn" 
                        onClick={closeUserProfile}
                        style={{ top: '12px', right: '12px' }}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                    <span 
                        style={{ 
                            fontSize: '0.72rem', 
                            fontWeight: 800, 
                            letterSpacing: '0.08em', 
                            textTransform: 'uppercase',
                            background: 'rgba(255,255,255,0.2)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            display: 'inline-block'
                        }}
                    >
                        {role === 'admin' ? 'Event Administrator' : 'Student Member'}
                    </span>
                </div>

                {/* Avatar Badge overlapping banner */}
                <div style={{ textAlign: 'center', marginTop: '-42px', position: 'relative', zIndex: 2 }}>
                    <div 
                        className="avatar mx-auto" 
                        style={{ 
                            width: '84px', 
                            height: '84px', 
                            fontSize: '2.2rem', 
                            border: '4px solid var(--card-bg)',
                            boxShadow: 'var(--premium-shadow)'
                        }}
                    >
                        {initial}
                    </div>
                </div>

                {/* Body Details */}
                <div style={{ padding: '0.75rem 1.5rem 1.5rem' }}>
                    <div className="text-center mb-4">
                        <h2 style={{ margin: '0.35rem 0 0.15rem 0', fontSize: '1.4rem' }}>
                            {displayName} {isSelf && <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>(You)</span>}
                        </h2>
                        {displayEmail ? (
                            <a 
                                href={`mailto:${displayEmail}`} 
                                style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', textDecoration: 'none' }}
                                title="Send email"
                            >
                                ✉️ {displayEmail}
                            </a>
                        ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Room Participant</span>
                        )}

                        {selectedProfileUser.roomId && (
                            <div className="mt-2">
                                <span className="badge badge-outline" style={{ fontSize: '0.68rem' }}>
                                    Room: {selectedProfileUser.roomId}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Contact & Phone Number Section */}
                    <div 
                        className="contact-card-phone-box" 
                        style={{ 
                            background: displayPhone ? 'rgba(99, 102, 241, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                            border: `1px solid ${displayPhone ? 'rgba(99, 102, 241, 0.25)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            marginBottom: '1rem'
                        }}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                                📱 Phone Number
                            </span>
                            {displayPhone ? (
                                <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>
                                    ✓ Available
                                </span>
                            ) : (
                                <span className="badge badge-outline" style={{ fontSize: '0.62rem' }}>
                                    Not Shared
                                </span>
                            )}
                        </div>

                        {displayPhone ? (
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em', marginBottom: '0.75rem' }}>
                                    {displayPhone}
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <a 
                                        href={`tel:${cleanPhoneDigits}`} 
                                        className="btn btn-sm btn-primary"
                                        style={{ flex: 1, minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none' }}
                                    >
                                        <span>📞</span> Call
                                    </a>
                                    <a 
                                        href={`https://wa.me/${waPhoneDigits}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="btn btn-sm btn-success"
                                        style={{ flex: 1, minWidth: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none' }}
                                    >
                                        <span>💬</span> WhatsApp
                                    </a>
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-outline"
                                        onClick={handleCopyPhone}
                                        style={{ minWidth: '85px' }}
                                        title="Copy number"
                                    >
                                        {copiedPhone ? 'Copied! ✓' : '📋 Copy'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <div>No phone number added by this user.</div>
                                {isSelf && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <button 
                                            className="btn btn-xs btn-primary" 
                                            onClick={() => { closeUserProfile(); navigate('/profile'); }}
                                        >
                                            + Add Your Phone Number
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Academic Information (if student) */}
                    {(selectedProfileUser.branch || selectedProfileUser.year) && (
                        <div 
                            style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '0.5rem', 
                                marginBottom: '1.25rem',
                                padding: '0.75rem',
                                background: 'rgba(0, 0, 0, 0.02)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)'
                            }}
                        >
                            <div>
                                <small className="text-secondary text-xs" style={{ display: 'block' }}>Branch / Dept</small>
                                <strong style={{ fontSize: '0.9rem' }}>{selectedProfileUser.branch || 'N/A'}</strong>
                            </div>
                            <div>
                                <small className="text-secondary text-xs" style={{ display: 'block' }}>Year of Study</small>
                                <strong style={{ fontSize: '0.9rem' }}>{selectedProfileUser.year ? `${selectedProfileUser.year} Year` : 'N/A'}</strong>
                            </div>
                        </div>
                    )}

                    {/* Modal Footer Controls */}
                    <div className="flex gap-2 mt-2">
                        {isSelf && (
                            <button 
                                className="btn btn-outline btn-sm" 
                                style={{ flex: 1 }}
                                onClick={() => { closeUserProfile(); navigate('/profile'); }}
                            >
                                ⚙️ Edit Profile
                            </button>
                        )}
                        <button 
                            className="btn btn-primary btn-sm" 
                            style={{ flex: 1 }}
                            onClick={closeUserProfile}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UserProfileModal;
