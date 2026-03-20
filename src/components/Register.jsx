import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const Register = () => {
    const { state, login, setState } = useAppState();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = (e) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !password) {
            setError("Please fill out all fields.");
            return;
        }

        if (state.users.some(u => u.email === email)) {
            setError("Email is already registered. Please login.");
            return;
        }

        const randomStr = Math.floor(10000 + Math.random() * 90000).toString();
        const roomId = `ADM-${randomStr}`;

        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            role: 'admin',
            roomId: roomId
        };

        const usersCopy = [...state.users, newUser];
        setState(prev => ({ ...prev, users: usersCopy }));

        login({ id: newUser.id, name: newUser.name, role: newUser.role, email: newUser.email, roomId: newUser.roomId });
        
        alert(`🎉 Registration Successful!\n\nYour Unique Room ID is: ${roomId}\n\nShare this ID with your students so they can join your room!`);
        navigate('/');
    };

    return (
        <div className="auth-page-wrapper flex items-center justify-center w-100" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
            <div className="glass-panel login-container text-center" style={{ maxWidth: '450px', width: '90%' }}>
                <h1 className="logo mb-2">Eventify</h1>
                <p className="mb-4">Become an <strong>Organization Admin</strong> to host your own event rooms.</p>
                
                {error && <div className="p-3 mb-4 rounded-lg bg-danger text-white font-bold" style={{ fontSize: '0.85rem' }}>{error}</div>}
                
                <form onSubmit={handleRegister}>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label style={{ fontWeight: 700 }}>Admin/Organization Name</label>
                        <input type="text" className="form-control" placeholder="e.g. Science Club, GEC" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label style={{ fontWeight: 700 }}>Email ID (Login Username)</label>
                        <input type="email" className="form-control" placeholder="admin@college.edu" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label style={{ fontWeight: 700 }}>Choose Password</label>
                        <input type="password" className="form-control" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    
                    <button type="submit" className="btn btn-primary w-100 mt-4" style={{ padding: '1rem', fontSize: '1.1rem' }}>Create My Event Room</button>
                </form>
                
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem' }}>Student wanting to join? <Link to="/login" className="btn btn-link" style={{ fontWeight: 800 }}>Enter Room ID</Link></p>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Existing admin? <Link to="/login" className="btn btn-link">Login here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
