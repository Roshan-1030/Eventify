import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';

const Contact = () => {
    const { state, setState } = useAppState();
    const isAdmin = state.user?.role === 'admin';
    const info = state.contactInfo || {
        email: 'events@college.edu',
        phone: '+91 98765 43210',
        address: 'Student Activity Center, Main Campus, Block C',
        instagram: '@campus_events_official',
        twitter: '@campus_events'
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...info });

    const handleUpdate = (e) => {
        e.preventDefault();
        setState(prev => ({ ...prev, contactInfo: editData }));
        setIsEditing(false);
    };

    return (
        <div className="contact-page">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ marginBottom: '0.35rem' }}>Get In Touch</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        Support and coordination channels for Room: <strong style={{ color: 'var(--primary)' }}>{state.user?.roomId}</strong>
                    </p>
                </div>
                {isAdmin && (
                    <button className={`btn btn-sm ${isEditing ? 'btn-outline' : 'btn-primary'}`} onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? 'Cancel Edit' : '✏️ Edit Contact Info'}
                    </button>
                )}
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {isEditing ? (
                    <div className="glass-panel" style={{ padding: '1.75rem' }}>
                        <h2 className="mb-4" style={{ fontSize: '1.25rem' }}>Update Contact Details</h2>
                        <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                            <div className="form-group">
                                <label>Support Email</label>
                                <input type="email" className="form-control" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Admin Phone</label>
                                <input type="text" className="form-control" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Campus Address / Office</label>
                                <textarea className="form-control" rows="2" value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} required />
                            </div>
                            <div className="grid grid-2 gap-3">
                                <div className="form-group">
                                    <label>Instagram Handle</label>
                                    <input type="text" className="form-control" value={editData.instagram} onChange={e => setEditData({...editData, instagram: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Twitter Handle</label>
                                    <input type="text" className="form-control" value={editData.twitter} onChange={e => setEditData({...editData, twitter: e.target.value})} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-100 mt-2">Save Information</button>
                        </form>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="glass-panel" style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
                            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Direct Contact Information</h2>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-4 p-3.5 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                                    <div style={{ fontSize: '1.75rem' }}>📧</div>
                                    <div>
                                        <small className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Email Support</small>
                                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>{info.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3.5 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                                    <div style={{ fontSize: '1.75rem' }}>📱</div>
                                    <div>
                                        <small className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Phone / WhatsApp</small>
                                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>{info.phone}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3.5 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                                    <div style={{ fontSize: '1.75rem' }}>📍</div>
                                    <div>
                                        <small className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Campus Location</small>
                                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{info.address}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: 'clamp(1.5rem, 3vw, 2rem)' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Community Socials</h2>
                            <div className="flex flex-col md-flex-row gap-3">
                                <div className="p-3 rounded-lg flex-1 text-center" style={{ border: '1.5px solid #E1306C', color: '#E1306C', fontWeight: 700, fontSize: '0.9rem' }}>
                                    📸 {info.instagram || 'Instagram'}
                                </div>
                                <div className="p-3 rounded-lg flex-1 text-center" style={{ border: '1.5px solid #1DA1F2', color: '#1DA1F2', fontWeight: 700, fontSize: '0.9rem' }}>
                                    🐦 {info.twitter || 'Twitter'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Contact;
