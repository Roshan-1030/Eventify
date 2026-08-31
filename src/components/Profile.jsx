import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';

const Profile = () => {
    const { state, setState } = useAppState();
    const [name, setName] = useState(state.user?.name || '');
    const [email, setEmail] = useState(state.user?.email || '');
    const [branch, setBranch] = useState(state.user?.branch || 'CSE');
    const [year, setYear] = useState(state.user?.year || '1st');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const isAdmin = state.user?.role === 'admin';

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSuccess('');
        setLoading(true);

        try {
            const userRef = doc(db, "profiles", state.user.id);
            await updateDoc(userRef, {
                name: name.trim(),
                email: email.trim(),
                branch,
                year
            });

            const updatedUser = { ...state.user, name: name.trim(), email: email.trim(), branch, year };
            setState(prev => ({ ...prev, user: updatedUser }));
            
            setSuccess('✅ Profile updated permanently!');
        } catch (err) {
            console.error("Update failed", err);
            setSuccess(`❌ Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ marginBottom: '0.35rem' }}>Profile Settings</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        Role: <span className="badge badge-primary">{state.user?.role.toUpperCase()}</span>
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
                    
                    <div className="w-100 pt-4 border-top flex flex-col gap-2" style={{ fontSize: '0.9rem' }}>
                        <div className="flex justify-between">
                            <span className="text-secondary">Account Role:</span>
                            <strong>{state.user?.role === 'admin' ? 'Event Administrator' : 'Student'}</strong>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-secondary">Active Room ID:</span>
                            <strong style={{ color: 'var(--primary)' }}>{state.user?.roomId}</strong>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 style={{ margin: 0 }}>Information Details</h3>
                        {!isAdmin && <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>STUDENT PROFILE</span>}
                    </div>

                    {success && (
                        <div className={`p-3 mb-4 rounded-lg font-bold text-white ${success.includes('✅') ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.85rem' }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} disabled={!isAdmin} required />
                        </div>

                        <div className="form-group">
                            <label>Institutional Email</label>
                            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} disabled={!isAdmin} required />
                        </div>

                        <div className="grid grid-2 gap-3">
                            <div className="form-group">
                                <label>Department / Branch</label>
                                <select className="form-control" value={branch} onChange={e => setBranch(e.target.value)} disabled={!isAdmin} required>
                                    <option value="CSE">CSE</option><option value="IT">IT</option><option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option><option value="ME">Mech</option><option value="CE">Civil</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Year of Study</label>
                                <select className="form-control" value={year} onChange={e => setYear(e.target.value)} disabled={!isAdmin} required>
                                    <option value="1st">1st Year</option><option value="2nd">2nd Year</option><option value="3rd">3rd Year</option><option value="4th">4th Year</option>
                                </select>
                            </div>
                        </div>

                        {isAdmin && (
                            <button type="submit" className="btn btn-primary w-100 mt-3" disabled={loading}>
                                {loading ? "Saving Changes..." : "💾 Update Profile"}
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
