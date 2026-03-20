import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';

const Profile = () => {
    const { state, setState } = useAppState();
    const [name, setName] = useState(state.user?.name || '');
    const [email, setEmail] = useState(state.user?.email || '');
    const [branch, setBranch] = useState(state.user?.branch || '');
    const [year, setYear] = useState(state.user?.year || '');
    const [success, setSuccess] = useState('');

    const isAdmin = state.user?.role === 'admin';

    const handleUpdate = (e) => {
        e.preventDefault();
        setSuccess('');
        
        const updatedUser = { ...state.user, name, email, branch, year };
        const updatedUsers = state.users.map(u => u.id === state.user.id ? updatedUser : u);
        
        setState(prev => ({ ...prev, user: updatedUser, users: updatedUsers }));
        setSuccess('Profile updated successfully!');
    };

    return (
        <div className="profile-page">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1>Your Profile</h1>
                    <p style={{ margin: 0 }}>Authenticated as: <span className="badge badge-primary">{state.user?.role.toUpperCase()}</span></p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-6">
                    <div className="glass-panel text-center" style={{ padding: '3rem 2rem' }}>
                        <div className="avatar mx-auto mb-4" style={{ width: '120px', height: '120px', fontSize: '3rem' }}>{state.user?.name.charAt(0)}</div>
                        <h2 style={{ margin: 0 }}>{state.user?.name}</h2>
                        <p className="text-secondary">{state.user?.email}</p>
                        <div className="mt-4 pt-4 border-top" style={{ borderTop: '1px solid var(--border)' }}>
                            <div className="flex justify-between mb-2"><strong>Member Role:</strong> <span className={isAdmin ? 'text-primary font-bold' : 'text-success font-bold'}>{state.user?.role === 'admin' ? 'Event Administrator' : 'Student Participant'}</span></div>
                            <div className="flex justify-between mb-2"><strong>Room Focus:</strong> <span style={{ fontWeight: 800 }}>{state.user?.roomId}</span></div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '2rem', border: isAdmin ? 'none' : '2px solid var(--primary)', background: isAdmin ? 'var(--card-bg)' : 'rgba(99, 102, 241, 0.05)' }}>
                        <div className="flex gap-2 items-center mb-4">
                            <span style={{ fontSize: '1.5rem' }}>🎫</span>
                            <h3 style={{ margin: 0 }}>{isAdmin ? 'Academic Affiliation' : 'Verified Academic Profile'}</h3>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {isAdmin 
                                ? "Update your professional details to ensure proper identification in the administrative dashboard."
                                : "This profile is locked and verified. Only administrators can request a change to your branch or year details to ensure room data integrity."}
                        </p>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 style={{ margin: 0 }}>Edit Information</h3>
                        {!isAdmin && <span className="badge badge-admin" style={{ background: 'var(--danger)', color: 'white', fontSize: '0.6rem' }}>READ ONLY</span>}
                    </div>

                    {success && <div className="p-3 mb-4 rounded-lg bg-success text-white font-bold">{success}</div>}

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
                                    <option value="CSE">CSE</option>
                                    <option value="IT">IT</option>
                                    <option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option>
                                    <option value="ME">Mechanical</option>
                                    <option value="CE">Civil</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ fontWeight: 800 }}>Year</label>
                                <select className="form-control" value={year} onChange={e => setYear(e.target.value)} disabled={!isAdmin} required>
                                    <option value="1st">1st Year</option>
                                    <option value="2nd">2nd Year</option>
                                    <option value="3rd">3rd Year</option>
                                    <option value="4th">4th Year</option>
                                </select>
                            </div>
                        </div>

                        {isAdmin ? (
                            <button type="submit" className="btn btn-primary w-100 mt-4" style={{ padding: '1rem', fontSize: '1.1rem' }}>💾 Apply Changes</button>
                        ) : (
                            <p className="text-secondary text-center mt-4 p-4 rounded-lg bg-light" style={{ fontSize: '0.85rem' }}>
                                🔒 Student data is locked after registration. Reach out to room admin <strong>{state.user?.roomId}</strong> for profile updates.
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
