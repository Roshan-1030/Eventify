import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { auth, db } from '../firebase/firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const Login = () => {
    const { state, login } = useAppState();
    const navigate = useNavigate();
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [roomId, setRoomId] = useState('');
    const [studentName, setStudentName] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [studentBranch, setStudentBranch] = useState('');
    const [studentYear, setStudentYear] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
        const prefilledRoom = params.get('room');
        if (prefilledRoom) setRoomId(prefilledRoom);

        if (state.user) navigate('/');
    }, [state.user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // 🔐 ADMIN LOGIN (Firebase Auth)
        if (role === 'admin') {
            try {
                const userCred = await signInWithEmailAndPassword(auth, email, password);
                const user = userCred.user;

                // Fetch admin profile from 'profiles' collection
                const profileDoc = await getDoc(doc(db, "profiles", user.uid));
                
                if (profileDoc.exists()) {
                    const profile = profileDoc.data();
                    login({
                        id: user.uid,
                        name: profile.name,
                        role: profile.role,
                        email: profile.email,
                        roomId: profile.room_id
                    });
                    navigate('/');
                } else {
                    setError("Admin profile not found. Please register as an admin first.");
                }
            } catch (err) {
                if (err.code === "auth/invalid-credential") {
                    setError("Invalid email or password");
                } else {
                    setError(err.message.replace("Firebase: ", ""));
                }
            } finally {
                setLoading(false);
            }
        }

        // 🎓 STUDENT LOGIN (Firestore Based)
        else {
            if (!roomId || !studentName || !studentEmail || !studentBranch || !studentYear) {
                setError("All fields marked with * are compulsory.");
                setLoading(false);
                return;
            }

            try {
                // 🔍 Verify Room Exists
                const adminQuery = query(collection(db, "profiles"), where("room_id", "==", roomId), where("role", "==", "admin"));
                const adminSnap = await getDocs(adminQuery);
                
                if (adminSnap.empty) {
                    setError("Invalid Room ID. Please contact your administrator.");
                    setLoading(false);
                    return;
                }

                // 🔎 Check existing student record in this room
                const studentQuery = query(
                    collection(db, "profiles"), 
                    where("email", "==", studentEmail), 
                    where("room_id", "==", roomId),
                    where("role", "==", "student")
                );
                const studentSnap = await getDocs(studentQuery);
                
                let studentData;
                if (!studentSnap.empty) {
                    // Update existing student
                    const studentDoc = studentSnap.docs[0];
                    await updateDoc(doc(db, "profiles", studentDoc.id), {
                        name: studentName,
                        branch: studentBranch,
                        year: studentYear
                    });
                    studentData = { id: studentDoc.id, ...studentDoc.data(), name: studentName, branch: studentBranch, year: studentYear };
                } else {
                    // Create new student record
                    const studentId = `STU-${Date.now()}`;
                    studentData = {
                        id: studentId,
                        name: studentName,
                        email: studentEmail,
                        role: "student",
                        room_id: roomId,
                        branch: studentBranch,
                        year: studentYear,
                        createdAt: new Date()
                    };
                    await setDoc(doc(db, "profiles", studentId), studentData);
                }

                login({
                    id: studentData.id,
                    name: studentData.name,
                    email: studentData.email,
                    branch: studentData.branch,
                    year: studentData.year,
                    role: 'student',
                    roomId: studentData.room_id
                });
                navigate('/');

            } catch (err) {
                setError("Something went wrong. Try again.");
                console.error(err);
            } finally {
                setLoading(false);
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
                            <option value="admin">Event Admin (Email/Pass)</option>
                        </select>
                    </div>

                    {role === 'admin' ? (
                        <div className="flex flex-col gap-2">
                            <div className="form-group" style={{ textAlign: 'left' }}>
                                <label style={{ fontWeight: 700 }}>Email ID</label>
                                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ textAlign: 'left' }}>
                                <label style={{ fontWeight: 700 }}>Password</label>
                                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="form-group"><input type="text" className="form-control" placeholder="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} required /></div>
                            <div className="form-group"><input type="text" className="form-control" placeholder="Full Name" value={studentName} onChange={e => setStudentName(e.target.value)} required /></div>
                            <div className="form-group"><input type="email" className="form-control" placeholder="Institutional Email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} required /></div>
                            <div className="grid grid-2 gap-4">
                                <select className="form-control" value={studentBranch} onChange={e => setStudentBranch(e.target.value)} required>
                                    <option value="">Branch</option>
                                    <option value="CSE">CSE</option><option value="IT">IT</option><option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option><option value="ME">Mech</option><option value="CE">Civil</option>
                                </select>
                                <select className="form-control" value={studentYear} onChange={e => setStudentYear(e.target.value)} required>
                                    <option value="">Year</option>
                                    <option value="1st">1st</option><option value="2nd">2nd</option><option value="3rd">3rd</option><option value="4th">4th</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading}>
                        {loading ? "Authenticating..." : "Access Dashboard"}
                    </button>
                </form>

                <p className="mt-6 text-center">New admin? <Link to="/register" style={{ fontWeight: 800 }}>Create Your Room</Link></p>
            </div>
        </div>
    );
};

export default Login;