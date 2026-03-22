import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';

const Contact = () => {
    const { state, setState } = useAppState();
    const isAdmin = state.user?.role === 'admin';
    const info = state.contactInfo;

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...info });

    const handleUpdate = (e) => {
        e.preventDefault();
        setState(prev => ({ ...prev, contactInfo: editData }));
        setIsEditing(false);
    };

    return (
        <div className="contact-page">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1>Get In Touch</h1>
                    <p style={{ margin: 0 }}>Have an issue or want to partner? We're here to help.</p>
                </div>
                {isAdmin && (
                    <button className={`btn ${isEditing ? 'btn-outline' : 'btn-primary'}`} onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? 'Cancel Edit' : '✏️ Edit Contact Info'}
                    </button>
                )}
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {isEditing ? (
                    <div className="glass-panel" style={{ padding: '2.5rem' }}>
                        <h2 className="mb-4">Update Contact Details</h2>
                        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                            <div className="form-group"><label>Support Email</label><input type="email" className="form-control" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} required /></div>
                            <div className="form-group"><label>Admin Phone</label><input type="text" className="form-control" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} required /></div>
                            <div className="form-group"><label>Campus Address</label><textarea className="form-control" value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} required /></div>
                            <div className="grid grid-2 gap-4">
                                <div className="form-group"><label>Instagram</label><input type="text" className="form-control" value={editData.instagram} onChange={e => setEditData({...editData, instagram: e.target.value})} /></div>
                                <div className="form-group"><label>Twitter</label><input type="text" className="form-control" value={editData.twitter} onChange={e => setEditData({...editData, twitter: e.target.value})} /></div>
                            </div>
                            <button type="submit" className="btn btn-primary w-100 mt-4">Save Information</button>
                        </form>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="glass-panel" style={{ padding: '2.5rem' }}>
                            <h2 style={{ fontSize: '2rem' }}>Direct Contact</h2>
                            <div className="flex flex-col gap-4 mt-6">
                                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-[rgba(99,102,241,0.05)] transition-all">
                                    <div style={{ fontSize: '2rem' }}>📧</div>
                                    <div><strong>Email Support</strong><p style={{ margin: 0, fontWeight: 800, color: 'var(--primary)' }}>{info.email}</p></div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-[rgba(99,102,241,0.05)] transition-all">
                                    <div style={{ fontSize: '2rem' }}>📱</div>
                                    <div><strong>Phone / WhatsApp</strong><p style={{ margin: 0, fontWeight: 800, color: 'var(--primary)' }}>{info.phone}</p></div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-[rgba(99,102,241,0.05)] transition-all">
                                    <div style={{ fontSize: '2rem' }}>📍</div>
                                    <div><strong>Campus Location</strong><p style={{ margin: 0, fontWeight: 800, color: 'var(--primary)' }}>{info.address}</p></div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2.5rem' }}>
                            <h2>Community Socials</h2>
                            <div className="flex gap-4 mt-6">
                                <a href="#" className="btn btn-outline flex-1" style={{ border: '2.5px solid #E1306C', color: '#E1306C' }}>{info.instagram || 'Instagram'}</a>
                                <a href="#" className="btn btn-outline flex-1" style={{ border: '2.5px solid #1DA1F2', color: '#1DA1F2' }}>{info.twitter || 'Twitter'}</a>
                            </div>
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
};

export default Contact;
