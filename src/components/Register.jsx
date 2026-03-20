import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const Register = () => {
    const { state, login, setState } = useAppState();
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
        alert(`Registration Successful!\n\nYour Unique Room ID is: ${roomId}\n\nGive this ID to your students so they can join your room!`);
    };

    return (
        <div className="auth-page-wrapper flex items-center justify-center w-100" style={{ minHeight: '100vh' }}>
            <div className="glass-panel login-container text-center">
                <h1 className="logo mb-2">Eventify</h1>
                <p className="mb-4">Register as an <strong>Event Admin</strong> to create your own room!</p>
                
                {error && <div style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '1rem' }}>{error}</div>}
                
                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label>Admin Name</label>
                        <input type="text" className="form-control" placeholder="e.g. Science Club Admin" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    
                    <div className="form-group">
                        <label>Email ID (For Login)</label>
                        <input type="email" className="form-control" placeholder="admin@college.edu" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" className="form-control" placeholder="Choose a secure password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    
                    <button type="submit" className="btn btn-primary w-100 mt-2">Create Admin Account</button>
                </form>
                
                <p className="mt-4 text-center">Student wanting to join? <Link to="/login" className="btn btn-link">Login with Room ID</Link></p>
                <p className="mt-2 text-center">Already an admin? <Link to="/login" className="btn btn-link">Login here</Link></p>
            </div>
        </div>
    );
};

export default Register;
