import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { auth, db } from '../firebase/firebase.js';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const Login = () => {
    const { state, login } = useAppState();
    const navigate = useNavigate();
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
                const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
                const user = userCred.user;

                // Fetch admin profile from 'profiles' collection
                const profileDoc = await getDoc(doc(db, "profiles", user.uid));
                
                if (profileDoc.exists()) {
                    const profile = profileDoc.data();
                    login({
                        id: user.uid,
                        name: profile.name || user.displayName || profile.email?.split('@')[0] || "Admin",
                        role: profile.role || "admin",
                        email: profile.email || user.email,
                        phone: profile.phone || "",
                        roomId: profile.room_id || profile.roomId || "ADM-GENERAL"
                    });
                    navigate('/');
                } else {
                    setError("Admin profile not found. Please register as an admin first.");
                }
            } catch (err) {
                if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                    setError("Invalid email or password. Please check your credentials.");
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

            const normalizedRoomId = roomId.trim().toUpperCase();
            const normalizedEmail = studentEmail.trim().toLowerCase();

            try {
                // 🔍 Verify Room Exists
                const adminQuery = query(collection(db, "profiles"), where("room_id", "==", normalizedRoomId), where("role", "==", "admin"));
                const adminSnap = await getDocs(adminQuery);
                
                if (adminSnap.empty) {
                    setError("Invalid Room ID. Please check the code provided by your administrator.");
                    setLoading(false);
                    return;
                }

                // 🔎 Check if profile already exists globally for this email
                const emailQuery = query(
                    collection(db, "profiles"), 
                    where("email", "==", normalizedEmail)
                );
                const emailSnap = await getDocs(emailQuery);
                
                let studentData;
                if (!emailSnap.empty) {
                    const studentDoc = emailSnap.docs[0];
                    const existing = studentDoc.data();

                    if (existing.role === 'admin') {
                        setError("This email is already registered as an Event Administrator. You cannot use it for a student profile.");
                        setLoading(false);
                        return;
                    }

                    // Strict validation: An email can only be used for one profile!
                    // Verify if the entered details match the existing registered profile
                    const isNameMatch = existing.name && existing.name.trim().toLowerCase() === studentName.trim().toLowerCase();
                    const isBranchMatch = !existing.branch || existing.branch.toLowerCase() === studentBranch.toLowerCase();
                    const isYearMatch = !existing.year || existing.year.toLowerCase() === studentYear.toLowerCase();
                    const isRoomMatch = !existing.room_id || existing.room_id.toUpperCase() === normalizedRoomId;

                    if (!isNameMatch || !isBranchMatch || !isYearMatch || !isRoomMatch) {
                        const mismatches = [];
                        if (!isNameMatch) mismatches.push(`Full Name: "${existing.name}"`);
                        if (!isBranchMatch) mismatches.push(`Branch: "${existing.branch}"`);
                        if (!isYearMatch) mismatches.push(`Year: "${existing.year}"`);
                        if (!isRoomMatch) mismatches.push(`Room ID: "${existing.room_id}"`);

                        setError(`⚠️ Account Conflict: This email (${normalizedEmail}) is already registered to a profile with different details (${mismatches.join(', ')}). One email can only be used for one profile. Please use your exact registered details.`);
                        setLoading(false);
                        return;
                    }

                    // Matching returning student: log in with existing profile data without creating duplicate or overwriting
                    studentData = { 
                        id: studentDoc.id, 
                        ...existing, 
                        email: normalizedEmail 
                    };
                } else {
                    // Create new student record - First time this email is ever used
                    const studentId = `STU-${Date.now()}`;
                    studentData = {
                        id: studentId,
                        name: studentName.trim(),
                        email: normalizedEmail,
                        role: "student",
                        room_id: normalizedRoomId,
                        branch: studentBranch,
                        year: studentYear,
                        phone: "",
                        createdAt: new Date()
                    };
                    await setDoc(doc(db, "profiles", studentId), studentData);
                }

                login({
                    id: studentData.id,
                    name: studentData.name || studentName.trim() || "Student",
                    email: studentData.email,
                    branch: studentData.branch,
                    year: studentData.year,
                    phone: studentData.phone || "",
                    role: 'student',
                    roomId: studentData.room_id
                });
                navigate('/');

            } catch (err) {
                setError("Unable to connect to room. Please check your network and try again.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if profile exists
            const profileDoc = await getDoc(doc(db, "profiles", user.uid));
            
            if (profileDoc.exists()) {
                const profile = profileDoc.data();
                login({
                    id: user.uid,
                    name: profile.name || user.displayName || profile.email?.split('@')[0] || "Admin",
                    role: profile.role || "admin",
                    email: profile.email || user.email,
                    phone: profile.phone || "",
                    roomId: profile.room_id || profile.roomId || "ADM-GENERAL"
                });
                navigate('/');
            } else {
                setError("Google account authenticated, but no Admin profile found. Please register first.");
            }
        } catch (err) {
            if (err.code === "auth/unauthorized-domain") {
                setError(`Domain (${window.location.hostname}) is not authorized in Firebase. Please add "${window.location.hostname}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
            } else {
                setError(err.message.replace("Firebase: ", ""));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEmailBlur = async () => {
        const trimmed = studentEmail.trim().toLowerCase();
        if (!trimmed || !trimmed.includes('@')) return;
        try {
            const q = query(collection(db, "profiles"), where("email", "==", trimmed));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const existing = snap.docs[0].data();
                if (existing.role === 'admin') {
                    setError("ℹ️ Note: This email is registered as an Event Administrator. Please switch to Admin login.");
                } else if (existing.role === 'student') {
                    // Auto-fill existing profile details to assist student with exact registered information
                    if (!studentName && existing.name) setStudentName(existing.name);
                    if (!studentBranch && existing.branch) setStudentBranch(existing.branch);
                    if (!studentYear && existing.year) setStudentYear(existing.year);
                    if (!roomId && existing.room_id) setRoomId(existing.room_id);
                }
            }
        } catch (e) {
            // silent fallback
        }
    };

    const handleStudentGoogleLogin = async () => {
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const normalizedGoogleEmail = (user.email || '').trim().toLowerCase();
            setStudentEmail(normalizedGoogleEmail);
            setStudentName(user.displayName || '');

            // Auto-populate existing profile details if this Google email is already registered
            const q = query(collection(db, "profiles"), where("email", "==", normalizedGoogleEmail));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const existing = snap.docs[0].data();
                if (existing.role === 'admin') {
                    setError("ℹ️ Note: This Google account is registered as an Event Administrator. Please switch to Admin login.");
                    return;
                }
                if (existing.name) setStudentName(existing.name);
                if (existing.branch) setStudentBranch(existing.branch);
                if (existing.year) setStudentYear(existing.year);
                if (existing.room_id) setRoomId(existing.room_id);
            }
        } catch (err) {
            if (err.code === "auth/unauthorized-domain") {
                setError(`Domain (${window.location.hostname}) is not authorized in Firebase. Please add "${window.location.hostname}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
            } else {
                setError(err.message.replace("Firebase: ", ""));
            }
        }
    };

    return (
        <div className="auth-page-wrapper flex items-center justify-center w-100" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
            <div className="glass-panel login-container text-center" style={{ maxWidth: '450px', width: '100%' }}>
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
                                <input type="email" className="form-control" placeholder="admin@college.edu" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ textAlign: 'left', position: 'relative' }}>
                                <label style={{ fontWeight: 700 }}>Password</label>
                                <input type={showPassword ? "text" : "password"} className="form-control" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: '2.75rem' }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', bottom: '10px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, display: 'flex', color: 'var(--text-primary)' }}>
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                    )}
                                </button>
                            </div>

                            <div className="text-secondary text-xs mb-2">Or continue with</div>
                            <button type="button" className="btn btn-outline w-100" onClick={handleGoogleLogin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
                                Google
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="form-group"><input type="text" className="form-control" placeholder="Room ID (e.g. ADM-12345)" value={roomId} onChange={e => setRoomId(e.target.value)} required /></div>
                            <div className="form-group"><input type="text" className="form-control" placeholder="Full Name" value={studentName} onChange={e => setStudentName(e.target.value)} required /></div>
                            <div className="form-group" style={{ marginBottom: '0.25rem' }}>
                                <input 
                                    type="email" 
                                    className="form-control" 
                                    placeholder="Institutional Email" 
                                    value={studentEmail} 
                                    onChange={e => setStudentEmail(e.target.value)} 
                                    onBlur={handleEmailBlur}
                                    required 
                                />
                                <small className="text-secondary" style={{ fontSize: '0.72rem', display: 'block', textAlign: 'left', marginTop: '3px' }}>
                                    🔒 One email is bound to one profile. Returning students must use their registered details.
                                </small>
                            </div>
                            <button type="button" onClick={handleStudentGoogleLogin} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', marginBottom: '1rem' }}>
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '12px' }} />
                                Autofill with Google
                            </button>
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