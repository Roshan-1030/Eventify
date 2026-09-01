import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase.js';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const Profile = () => {
    const { state, setState } = useAppState();
    const [name, setName] = useState(state.user?.name || '');
    const [email, setEmail] = useState(state.user?.email || '');
    const [phone, setPhone] = useState(state.user?.phone || '');
    const [branch, setBranch] = useState(state.user?.branch || 'CSE');
    const [year, setYear] = useState(state.user?.year || '1st');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const isAdmin = state.user?.role === 'admin';

    useEffect(() => {
        if (state.user) {
            setName(state.user.name || '');
            setEmail(state.user.email || '');
            setPhone(state.user.phone || '');
            if (state.user.branch) setBranch(state.user.branch);
            if (state.user.year) setYear(state.user.year);
        }
    }, [state.user]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSuccess('');
        setLoading(true);

        const normalizedEmail = email.trim().toLowerCase();

        try {
            // If email was changed, ensure it's not already in use by another profile
            if (state.user.email && normalizedEmail !== state.user.email.toLowerCase()) {
                const q = query(collection(db, "profiles"), where("email", "==", normalizedEmail));
                const snap = await getDocs(q);
                if (!snap.empty && snap.docs[0].id !== state.user.id) {
                    setSuccess(`❌ Error: The email '${normalizedEmail}' is already registered to another profile. One email can only be used for one profile.`);
                    setLoading(false);
                    return;
                }
            }

            const userRef = doc(db, "profiles", state.user.id);
            const updatePayload = {
                name: name.trim(),
                email: normalizedEmail,
                phone: phone.trim(),
                branch,
                year
            };

            await setDoc(userRef, updatePayload, { merge: true });

            const updatedUser = { 
                ...state.user, 
                name: name.trim(), 
                email: email.trim(), 
                phone: phone.trim(), 
                branch, 
                year 
            };
            setState(prev => ({ 
                ...prev, 
                user: updatedUser,
                users: (prev.users || []).map(u => String(u.id) === String(state.user.id) ? { ...u, ...updatePayload } : u)
            }));
            
            setSuccess('✅ Profile updated permanently! Other users can now see your updated details.');
        } catch (err) {
            console.error("Update failed", err);
            setSuccess(`❌ Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const cleanPhoneDigits = (phone || '').replace(/[^0-9+]/g, '');
    const waPhoneDigits = (phone || '').replace(/[^0-9]/g, '');

    return (
        <div className="profile-page">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ marginBottom: '0.35rem' }}>Profile Settings</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        Role: <span className="badge badge-primary">{state.user?.role?.toUpperCase() || 'STUDENT'}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-2 gap-6">
                {/* Profile Card Summary */}
                <div className="glass-panel text-center" style={{ padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="avatar mx-auto mb-4" style={{ width: '90px', height: '90px', fontSize: '2.4rem' }}>
                        {state.user?.name ? state.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <h2 style={{ margin: '0 0 0.25rem 0' }}>{state.user?.name}</h2>
                    <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>{state.user?.email}</p>
                    
                    <div className="w-100 pt-4 border-top flex flex-col gap-3" style={{ fontSize: '0.9rem' }}>
                        <div className="flex justify-between items-center">
                            <span className="text-secondary">Account Role:</span>
                            <strong>{state.user?.role === 'admin' ? 'Event Administrator' : 'Student Member'}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-secondary">Active Room ID:</span>
                            <strong style={{ color: 'var(--primary)' }}>{state.user?.roomId}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-secondary">Phone Number:</span>
                            {state.user?.phone ? (
                                <strong style={{ color: 'var(--success)' }}>📱 {state.user.phone}</strong>
                            ) : (
                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.82rem' }}>Not added yet</span>
                            )}
                        </div>

                        {state.user?.phone && (
                            <div className="p-3 rounded-lg mt-2" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                <small style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                    Preview of how others see your contact:
                                </small>
                                <div className="flex gap-2 justify-center">
                                    <a href={`tel:${cleanPhoneDigits}`} className="btn btn-xs btn-primary">📞 Call</a>
                                    <a href={`https://wa.me/${waPhoneDigits}`} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-success">💬 WhatsApp</a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Form */}
                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 style={{ margin: 0 }}>Information Details</h3>
                        <span className={`badge ${isAdmin ? 'badge-primary' : 'badge-accent'}`} style={{ fontSize: '0.65rem' }}>
                            {isAdmin ? 'ADMINISTRATOR' : 'STUDENT PROFILE'}
                        </span>
                    </div>

                    {success && (
                        <div className={`p-3 mb-4 rounded-lg font-bold text-white ${success.includes('✅') ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.85rem' }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label>Institutional Email</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                disabled={!isAdmin} 
                                required 
                            />
                            {!isAdmin && <small className="text-secondary text-xs">Email ID is verified by your institution.</small>}
                        </div>

                        {/* Optional Phone Number input */}
                        <div className="form-group" style={{ background: 'rgba(99, 102, 241, 0.04)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.18)' }}>
                            <div className="flex justify-between items-center mb-1">
                                <label style={{ fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                                    📱 Phone Number (Optional)
                                </label>
                                <span className="badge badge-outline" style={{ fontSize: '0.62rem' }}>Public in Room</span>
                            </div>
                            <input 
                                type="tel" 
                                className="form-control" 
                                placeholder="e.g. +91 98765 43210 or 9876543210" 
                                value={phone} 
                                onChange={e => setPhone(e.target.value)} 
                            />
                            <small className="text-secondary" style={{ fontSize: '0.74rem', marginTop: '0.35rem', display: 'block' }}>
                                💡 When you add your phone number, other room members can view it and call/WhatsApp you by clicking your name anywhere in the app.
                            </small>
                        </div>

                        {!isAdmin && (
                            <div className="grid grid-2 gap-3">
                                <div className="form-group">
                                    <label>Department / Branch</label>
                                    <select className="form-control" value={branch} onChange={e => setBranch(e.target.value)} required>
                                        <option value="CSE">CSE</option><option value="IT">IT</option><option value="ECE">ECE</option>
                                        <option value="EEE">EEE</option><option value="ME">Mech</option><option value="CE">Civil</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Year of Study</label>
                                    <select className="form-control" value={year} onChange={e => setYear(e.target.value)} required>
                                        <option value="1st">1st Year</option><option value="2nd">2nd Year</option><option value="3rd">3rd Year</option><option value="4th">4th Year</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-100 mt-3" disabled={loading} style={{ minHeight: '44px', fontWeight: 800 }}>
                            {loading ? "Saving Changes..." : "💾 Update Profile"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
