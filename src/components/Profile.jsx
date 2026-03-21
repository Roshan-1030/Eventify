import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';

const Profile = () => {
    const { state, setState } = useAppState();
    const [name, setName] = useState(state.user?.name || '');
    const [email, setEmail] = useState(state.user?.email || '');
    const [branch, setBranch] = useState(state.user?.branch || '');
    const [year, setYear] = useState(state.user?.year || '');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const isAdmin = state.user?.role === 'admin';

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSuccess('');
        setLoading(true);

        try {
            // Update in Firestore
            const userRef = doc(db, "profiles", state.user.id);
            await updateDoc(userRef, {
                name,
                email,
                branch,
                year
            });

            // Update in Context (Local State)
            const updatedUser = { ...state.user, name, email, branch, year };
            setState(prev => ({ ...prev, user: updatedUser }));
            
            setSuccess('✅ Profile updated permanently in Database!');
        } catch (err) {
            console.error("Update failed", err);
            setSuccess(`❌ Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1>Profile Management</h1>
                    <p style={{ margin: 0 }}>Authenticated: <span className="badge badge-primary">{state.user?.role.toUpperCase()}</span></p>
                </div>
            </div>

            <div className="grid grid-2 gap-8 mb-8">
                <div className="glass-panel text-center" style={{ padding: '3rem 2rem' }}>
                    <div className="avatar mx-auto mb-4" style={{ width: '120px', height: '120px', fontSize: '3rem' }}>{state.user?.name.charAt(0)}</div>
                    <h2 style={{ margin: 0 }}>{state.user?.name}</h2>
                    <p className="text-secondary">{state.user?.email}</p>
                    <div className="mt-4 pt-4 border-top">
                        <div className="flex justify-between mb-2"><strong>Role:</strong> <span>{state.user?.role === 'admin' ? 'Event Administrator' : 'Student'}</span></div>
                        <div className="flex justify-between"><strong>Room ID:</strong> <strong>{state.user?.roomId}</strong></div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 style={{ margin: 0 }}>Information</h3>
                        {!isAdmin && <span className="badge badge-admin" style={{ background: 'var(--danger)', color: 'white' }}>READ ONLY</span>}
                    </div>

                    {success && <div className={`p-3 mb-4 rounded-lg font-bold text-white ${success.includes('✅') ? 'bg-success' : 'bg-danger'}`}>{success}</div>}

                    <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                        <div className="form-group">
                            <label style={{ fontWeight: 800 }}>Full Name</label>
                            <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} disabled={!isAdmin} required />
                        </div>

                        <div className="form-group">
                            <label style={{ fontWeight: 800 }}>Institutional Email</label>
                            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} disabled={!isAdmin} required />
                        </div>

                        <div className="grid grid-2 gap-4">
                            <div className="form-group">
                                <label style={{ fontWeight: 800 }}>Branch</label>
                                <select className="form-control" value={branch} onChange={e => setBranch(e.target.value)} disabled={!isAdmin} required>
                                    <option value="CSE">CSE</option><option value="IT">IT</option><option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option><option value="ME">Mech</option><option value="CE">Civil</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: 800 }}>Year</label>
                                <select className="form-control" value={year} onChange={e => setYear(e.target.value)} disabled={!isAdmin} required>
                                    <option value="1st">1st</option><option value="2nd">2nd</option><option value="3rd">3rd</option><option value="4th">4th</option>
                                </select>
                            </div>
                        </div>

                        {isAdmin && <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading}>{loading ? "Saving Changes..." : "💾 Update Profile"}</button>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
