import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const Login = () => {
    const { state, login, setState } = useAppState();
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    
    // Admin fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Student fields
    const [roomId, setRoomId] = useState('');
    const [studentName, setStudentName] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [studentBranch, setStudentBranch] = useState('');
    const [studentYear, setStudentYear] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
        const prefilledRoom = params.get('room');
        if (prefilledRoom) setRoomId(prefilledRoom);
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (role === 'admin') {
            const foundUser = state.users.find(u => u.email === email && u.password === password && u.role === 'admin');
            if (foundUser) {
                login({ id: foundUser.id, name: foundUser.name, role: foundUser.role, email: foundUser.email, roomId: foundUser.roomId });
            } else {
                setError("Invalid Admin Credentials");
            }
        } else {
            if (!roomId || !studentName || !studentEmail || !studentBranch || !studentYear) {
                setError("All fields marked with * are compulsory.");
                return;
            }

            const adminRoom = state.users.find(u => u.roomId === roomId && u.role === 'admin');
            if (adminRoom) {
                let studentToLogin = state.users.find(u => u.email === studentEmail && u.roomId === roomId && u.role === 'student');
                
                const usersCopy = [...state.users];
                if (!studentToLogin) {
                    studentToLogin = {
                        id: Date.now(),
                        name: studentName,
                        email: studentEmail,
                        branch: studentBranch,
                        year: studentYear,
                        role: 'student',
                        roomId: roomId
                    };
                    usersCopy.push(studentToLogin);
                } else {
                    const idx = usersCopy.findIndex(u => u.id === studentToLogin.id);
                    usersCopy[idx] = { ...studentToLogin, name: studentName, branch: studentBranch, year: studentYear };
                }

                setState(prev => ({ ...prev, users: usersCopy }));
                login({
                    id: studentToLogin.id,
                    name: studentName,
                    email: studentEmail,
                    branch: studentBranch,
                    year: studentYear,
                    role: 'student',
                    roomId: roomId
                });
            } else {
                setError("Invalid Room ID. Please contact your administrator.");
            }
        }
    };

    return (
        <div className="auth-page-wrapper flex items-center justify-center w-100" style={{ minHeight: '100vh' }}>
            <div className="glass-panel login-container text-center">
                <h1 className="logo mb-2">Eventify</h1>
                <p className="mb-4">Welcome! Login to your account.</p>
                
                {error && <div style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '1rem' }}>{error}</div>}
                
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Login As</label>
                        <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="student">Student (via Room ID)</option>
                            <option value="admin">Event Admin (Email/Pass)</option>
                        </select>
                    </div>
                    
                    {role === 'admin' ? (
                        <div id="admin-login-fields">
                            <div className="form-group">
                                <label>Email ID</label>
                                <input type="email" className="form-control" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" className="form-control" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                        </div>
                    ) : (
                        <div id="student-login-fields">
                            <div className="form-group">
                                <label>Room ID <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input type="text" className="form-control" placeholder="e.g. ADM-12345" value={roomId} onChange={e => setRoomId(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Your Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input type="text" className="form-control" placeholder="e.g. John Doe" value={studentName} onChange={e => setStudentName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>College Email <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input type="email" className="form-control" placeholder="email@college.edu" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} required />
                            </div>
                            <div className="flex gap-2">
                                <div className="form-group flex-1">
                                    <label>Branch (B.Tech) <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <select className="form-control" value={studentBranch} onChange={e => setStudentBranch(e.target.value)} required>
                                        <option value="" disabled>Select Branch</option>
                                        <option value="CSE">CSE</option>
                                        <option value="IT">IT</option>
                                        <option value="ECE">ECE</option>
                                        <option value="EEE">EEE</option>
                                        <option value="ME">Mechanical</option>
                                        <option value="CE">Civil</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label>Year <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <select className="form-control" value={studentYear} onChange={e => setStudentYear(e.target.value)} required>
                                        <option value="" disabled>Year</option>
                                        <option value="1st">1st Year</option>
                                        <option value="2nd">2nd Year</option>
                                        <option value="3rd">3rd Year</option>
                                        <option value="4th">4th Year</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <button type="submit" className="btn btn-primary w-100 mt-2">Login</button>
                </form>
                
                <p className="mt-4 text-center">New here? <Link to="/register" className="btn btn-link">Create an account</Link></p>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Admin test account:<br/>email: <b>admin@college.edu</b> / pass: <b>admin</b><br/>
                    Room ID: <b>ADM-12345</b>
                </div>
            </div>
        </div>
    );
};

export default Login;
