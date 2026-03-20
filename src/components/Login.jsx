import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const Login = () => {
    const { state, login, setState } = useAppState();
    const navigate = useNavigate();
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
        
        // If already logged in, go to home
        if (state.user) navigate('/');
    }, [state.user, navigate]);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (role === 'admin') {
            const foundUser = state.users.find(u => u.email === email && u.password === password && u.role === 'admin');
            if (foundUser) {
                login({ id: foundUser.id, name: foundUser.name, role: foundUser.role, email: foundUser.email, roomId: foundUser.roomId });
                navigate('/');
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
                navigate('/');
            } else {
                setError("Invalid Room ID. Please contact your administrator.");
            }
        }
    };

    return (
        <div className="auth-page-wrapper flex items-center justify-center w-100" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
            <div className="glass-panel login-container text-center" style={{ maxWidth: '450px', width: '90%' }}>
                <h1 className="logo mb-2">Eventify</h1>
                <p className="mb-4">Welcome back! Access your event room.</p>
                
                {error && <div className="p-3 mb-4 rounded-lg bg-danger text-white font-bold" style={{ fontSize: '0.85rem' }}>{error}</div>}
                
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label style={{ fontWeight: 700, display: 'block', textAlign: 'left', marginBottom: '0.5rem' }}>Login As</label>
                        <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="student">Student (Fast Entry)</option>
                            <option value="admin">Event Admin (Email)</option>
                        </select>
                    </div>
                    
                    {role === 'admin' ? (
                        <div className="flex flex-col gap-2">
                            <div className="form-group" style={{ textAlign: 'left' }}>
                                <label style={{ fontWeight: 700 }}>Email ID</label>
                                <input type="email" className="form-control" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ textAlign: 'left' }}>
                                <label style={{ fontWeight: 700 }}>Password</label>
                                <input type="password" className="form-control" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="form-group" style={{ textAlign: 'left' }}>
                                <label style={{ fontWeight: 700 }}>Room ID <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" placeholder="e.g. ADM-12345" value={roomId} onChange={e => setRoomId(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ textAlign: 'left' }}>
                                <label style={{ fontWeight: 700 }}>Full Name <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" placeholder="Enter your name" value={studentName} onChange={e => setStudentName(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ textAlign: 'left' }}>
                                <label style={{ fontWeight: 700 }}>College Email <span className="text-danger">*</span></label>
                                <input type="email" className="form-control" placeholder="email@college.edu" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} required />
                            </div>
                            <div className="grid grid-2 gap-4">
                                <div className="form-group" style={{ textAlign: 'left' }}>
                                    <label style={{ fontWeight: 700 }}>Branch <span className="text-danger">*</span></label>
                                    <select className="form-control" value={studentBranch} onChange={e => setStudentBranch(e.target.value)} required>
                                        <option value="" disabled>Select</option>
                                        <option value="CSE">CSE</option>
                                        <option value="IT">IT</option>
                                        <option value="ECE">ECE</option>
                                        <option value="EEE">EEE</option>
                                        <option value="ME">Mech</option>
                                        <option value="CE">Civil</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ textAlign: 'left' }}>
                                    <label style={{ fontWeight: 700 }}>Year <span className="text-danger">*</span></label>
                                    <select className="form-control" value={studentYear} onChange={e => setStudentYear(e.target.value)} required>
                                        <option value="" disabled>Year</option>
                                        <option value="1st">1st</option>
                                        <option value="2nd">2nd</option>
                                        <option value="3rd">3rd</option>
                                        <option value="4th">4th</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <button type="submit" className="btn btn-primary w-100 mt-4" style={{ padding: '1rem', fontSize: '1.1rem' }}>Access Dashboard</button>
                </form>
                
                <p className="mt-6 text-center" style={{ fontSize: '0.9rem' }}>Organization Manager? <Link to="/register" className="btn btn-link" style={{ fontWeight: 800 }}>Host Your Event Room</Link></p>
                
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <p style={{ marginBottom: '0.5rem' }}>Demo Access:</p>
                    <strong>ADM-12345</strong> (Default Room)<br/>
                    Admin: <b>admin@college.edu</b> / <b>admin</b>
                </div>
            </div>
        </div>
    );
};

export default Login;
