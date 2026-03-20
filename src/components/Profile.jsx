import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const Profile = () => {
    const { state, setState } = useAppState();
    const navigate = useNavigate();
    const user = state.user;
    
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [branch, setBranch] = useState(user?.branch || '');
    const [year, setYear] = useState(user?.year || '');
    const [alertMsg, setAlertMsg] = useState('');

    const handleUpdate = (e) => {
        e.preventDefault();
        if (!name.trim()) return setAlertMsg('Name is required');

        // Update the current session user
        const updatedUser = { ...user, name, email, branch, year };
        
        // Update the user in the global users list
        const usersCopy = [...state.users];
        const idx = usersCopy.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            usersCopy[idx] = { ...usersCopy[idx], name, email, branch, year };
        }

        setState(prev => ({ 
            ...prev, 
            user: updatedUser,
            users: usersCopy
        }));

        setAlertMsg('Profile updated successfully! ✨');
        setTimeout(() => setAlertMsg(''), 3000);
    };

    if (!user) return <div className="text-center p-8"><h1>Please login first.</h1><button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>Login</button></div>;

    const isAdmin = user.role === 'admin';

    return (
        <div className="profile-page flex flex-col items-center">
            <div className="glass-panel w-100 mb-8" style={{ maxWidth: '600px', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div className="avatar" style={{ width: '120px', height: '120px', fontSize: '3rem', cursor: 'default' }}>
                    {name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1>{name}</h1>
                    <span className={`badge badge-${user.role}`} style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>{user.role}</span>
                    <p className="mt-2 text-secondary">{user.email}</p>
                    {!isAdmin && <p className="text-secondary font-bold">Room ID: {user.roomId}</p>}
                </div>
            </div>

            <div className="glass-panel w-100" style={{ maxWidth: '600px' }}>
                <h2>Edit Personal Information</h2>
                {alertMsg && (
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '12px', border: '1px solid var(--success)', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                        {alertMsg}
                    </div>
                )}
                
                <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                    <div className="form-group">
                        <label>Display Name</label>
                        <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    
                    {!isAdmin && (
                        <div className="flex gap-4">
                            <div className="form-group flex-1">
                                <label>Branch</label>
                                <select className="form-control" value={branch} onChange={e => setBranch(e.target.value)} required>
                                    <option value="CSE">Computer Science</option>
                                    <option value="IT">IT</option>
                                    <option value="ECE">Electronics</option>
                                    <option value="ME">Mechanical</option>
                                    <option value="CE">Civil</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div className="form-group flex-1">
                                <label>Current Year</label>
                                <select className="form-control" value={year} onChange={e => setYear(e.target.value)} required>
                                    <option value="1st">1st Year</option>
                                    <option value="2nd">2nd Year</option>
                                    <option value="3rd">3rd Year</option>
                                    <option value="4th">4th Year</option>
                                </select>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex gap-2 mt-4 pt-4 border-top">
                        <button type="submit" className="btn btn-primary flex-1">Save Profile Changes</button>
                        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
