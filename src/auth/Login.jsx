import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { auth, db } from '../firebase/firebase.js';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const Login = () => {
    const { state, login } = useAppState();
    const navigate = useNavigate();
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Email verification states
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState('');

    // Forgot password states
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState('');
    const [forgotError, setForgotError] = useState('');

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
        setResendSuccess('');
        setLoading(true);

        // 🔐 ADMIN LOGIN (Firebase Auth)
        if (role === 'admin') {
            try {
                const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
                const user = userCred.user;

                // 🛡️ Verification Check: Only verified emails can log in!
                if (!user.emailVerified) {
                    setUnverifiedEmail(user.email);
                    setError(`Email not verified! A verification link was sent to ${user.email}. Please verify your email before logging in.`);
                    setLoading(false);
                    return;
                }

                setUnverifiedEmail('');

                // Fetch admin profile from 'profiles' collection
                let profile = null;
                const profileDoc = await getDoc(doc(db, "profiles", user.uid));
                if (profileDoc.exists() && profileDoc.data().role === 'admin') {
                    profile = profileDoc.data();
                } else {
                    const q = query(collection(db, "profiles"), where("email", "==", user.email.toLowerCase()), where("role", "==", "admin"));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        profile = snap.docs[0].data();
                    }
                }
                
                if (profile) {
                    login({
                        id: profile.id || user.uid,
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

                // 🔎 Check all profiles for this email
                const emailQuery = query(
                    collection(db, "profiles"), 
                    where("email", "==", normalizedEmail)
                );
                const emailSnap = await getDocs(emailQuery);
                const allDocs = emailSnap.docs.map(d => ({ docId: d.id, ...d.data() }));

                const adminProfile = allDocs.find(d => d.role === 'admin');
                const studentProfile = allDocs.find(d => d.role === 'student');

                // 🛑 An admin cannot join their OWN room as a student
                if (adminProfile && adminProfile.room_id && adminProfile.room_id.toUpperCase() === normalizedRoomId) {
                    setError(`You are the Event Administrator of room ${normalizedRoomId}. Please switch to Admin login to manage your room.`);
                    setLoading(false);
                    return;
                }

                // ✅ Allowed to log in as a student in this room!
                let studentData;
                if (studentProfile) {
                    const isNameMatch = studentProfile.name && studentProfile.name.trim().toLowerCase() === studentName.trim().toLowerCase();
                    const isBranchMatch = !studentProfile.branch || studentProfile.branch.toLowerCase() === studentBranch.toLowerCase();
                    const isYearMatch = !studentProfile.year || studentProfile.year.toLowerCase() === studentYear.toLowerCase();

                    if (!isNameMatch || !isBranchMatch || !isYearMatch) {
                        setError("Email already exists with different student details");
                        setLoading(false);
                        return;
                    }

                    // User can change room ID if they want to log into another room
                    if (studentProfile.room_id !== normalizedRoomId) {
                        await updateDoc(doc(db, "profiles", studentProfile.docId || studentProfile.id), {
                            room_id: normalizedRoomId
                        });
                    }

                    // Matching returning student: log in with existing profile data and the active Room ID
                    studentData = { 
                        id: studentProfile.docId || studentProfile.id, 
                        ...studentProfile, 
                        room_id: normalizedRoomId,
                        email: normalizedEmail 
                    };
                } else {
                    // Create new student record (e.g. first time student or room admin logging into another room as a student)
                    const studentId = `STU-${Date.now()}`;
                    studentData = {
                        id: studentId,
                        name: studentName.trim(),
                        email: normalizedEmail,
                        role: "student",
                        room_id: normalizedRoomId,
                        branch: studentBranch,
                        year: studentYear,
                        phone: adminProfile?.phone || "",
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

    const handleResendVerification = async () => {
        const targetEmail = (unverifiedEmail || email).trim();
        if (!targetEmail) return;

        try {
            setResendLoading(true);
            setResendSuccess('');
            setError('');

            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                setResendSuccess(`Verification email sent to ${auth.currentUser.email}! Please check your inbox and spam folder.`);
                await signOut(auth);
            } else if (email && password) {
                const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
                await sendEmailVerification(cred.user);
                setResendSuccess(`Verification email sent to ${cred.user.email}! Please check your inbox.`);
                await signOut(auth);
            } else {
                setError("Please provide your email and password above to resend the verification link.");
            }
        } catch (err) {
            if (err.code === "auth/too-many-requests") {
                setError("Too many requests. Please wait a few moments before trying again.");
            } else {
                setError(err.message.replace("Firebase: ", ""));
            }
        } finally {
            setResendLoading(false);
        }
    };

    const handleSendPasswordReset = async (e) => {
        e.preventDefault();
        setForgotError('');
        setForgotSuccess('');
        const trimmedEmail = forgotEmail.trim().toLowerCase();

        if (!trimmedEmail) {
            setForgotError("Please enter your Admin email address.");
            return;
        }

        try {
            setForgotLoading(true);
            await sendPasswordResetEmail(auth, trimmedEmail);
            setForgotSuccess(`Password reset link sent to ${trimmedEmail}! Please check your inbox (and spam folder) to create your new password.`);
        } catch (err) {
            if (err.code === "auth/user-not-found") {
                setForgotError("No account found with this email address. Please make sure you entered the correct Admin email.");
            } else if (err.code === "auth/invalid-email") {
                setForgotError("Please enter a valid email address.");
            } else if (err.code === "auth/too-many-requests") {
                setForgotError("Too many attempts. Please wait a few moments before trying again.");
            } else {
                setForgotError(err.message.replace("Firebase: ", ""));
            }
        } finally {
            setForgotLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setUnverifiedEmail('');
        setLoading(true);
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Ensure Google account is verified
            if (!user.emailVerified) {
                setError("Your Google account email is not verified. Please verify your Google account first.");
                await signOut(auth);
                setLoading(false);
                return;
            }

            // Check if profile exists
            let profile = null;
            const profileDoc = await getDoc(doc(db, "profiles", user.uid));
            if (profileDoc.exists() && profileDoc.data().role === 'admin') {
                profile = profileDoc.data();
            } else {
                const q = query(collection(db, "profiles"), where("email", "==", (user.email || '').toLowerCase()), where("role", "==", "admin"));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    profile = snap.docs[0].data();
                }
            }
            
            if (profile) {
                login({
                    id: profile.id || user.uid,
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
                const all = snap.docs.map(d => d.data());
                const adminProf = all.find(d => d.role === 'admin');
                const studentProf = all.find(d => d.role === 'student');

                if (roomId && adminProf && adminProf.room_id && roomId.trim().toUpperCase() === adminProf.room_id.toUpperCase()) {
                    setError(`ℹ️ Note: You are the Event Administrator for Room ${roomId.toUpperCase()}. Please switch to Admin login to manage your room.`);
                } else {
                    if (studentProf) {
                        if (!studentName && studentProf.name) setStudentName(studentProf.name);
                        if (!studentBranch && studentProf.branch) setStudentBranch(studentProf.branch);
                        if (!studentYear && studentProf.year) setStudentYear(studentProf.year);
                        if (!roomId && studentProf.room_id) setRoomId(studentProf.room_id);
                    } else if (adminProf) {
                        if (!studentName && adminProf.name) setStudentName(adminProf.name);
                    }
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

            if (!user.emailVerified) {
                setError("Your Google account email is not verified. Please use a verified Google account.");
                return;
            }

            const normalizedGoogleEmail = (user.email || '').trim().toLowerCase();
            setStudentEmail(normalizedGoogleEmail);
            setStudentName(user.displayName || '');

            // Auto-populate existing profile details if this Google email is already registered
            const q = query(collection(db, "profiles"), where("email", "==", normalizedGoogleEmail));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const all = snap.docs.map(d => d.data());
                const adminProf = all.find(d => d.role === 'admin');
                const studentProf = all.find(d => d.role === 'student');

                if (roomId && adminProf && adminProf.room_id && roomId.trim().toUpperCase() === adminProf.room_id.toUpperCase()) {
                    setError(`ℹ️ Note: This Google account is the Event Administrator of Room ${roomId.toUpperCase()}. Please switch to Admin login to manage your room.`);
                    return;
                }

                if (studentProf) {
                    if (studentProf.name) setStudentName(studentProf.name);
                    if (studentProf.branch) setStudentBranch(studentProf.branch);
                    if (studentProf.year) setStudentYear(studentProf.year);
                    if (studentProf.room_id) setRoomId(studentProf.room_id);
                } else if (adminProf) {
                    if (adminProf.name) setStudentName(adminProf.name);
                }
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

                    {showForgotPassword ? (
                    <div>
                        <div style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setForgotError('');
                                    setForgotSuccess('');
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: 0 }}
                            >
                                ← Back to Login
                            </button>
                        </div>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔑</div>
                        <h2 style={{ fontWeight: 800, margin: '0 0 0.5rem 0' }}>Reset Password</h2>
                        <p className="text-secondary" style={{ fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                            Enter your Admin email address. We'll send you a link to create your new password.
                        </p>

                        {forgotSuccess && (
                            <div className="p-3 mb-3 rounded-lg text-xs font-bold" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'left', lineHeight: 1.5 }}>
                                ✅ {forgotSuccess}
                            </div>
                        )}

                        {forgotError && (
                            <div className="auth-error-banner mb-3">
                                <span>⚠️</span>
                                <span>{forgotError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSendPasswordReset}>
                            <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
                                <label style={{ fontWeight: 700 }}>Admin Email ID</label>
                                <input 
                                    type="email" 
                                    className="form-control" 
                                    placeholder="admin@college.edu" 
                                    value={forgotEmail} 
                                    onChange={e => setForgotEmail(e.target.value)} 
                                    required 
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-100" disabled={forgotLoading} style={{ minHeight: '42px', fontWeight: 800 }}>
                                {forgotLoading ? "Sending Link..." : "Send Password Reset Link"}
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        {unverifiedEmail && (
                            <div className="auth-verification-banner mb-3">
                                <div className="flex items-center gap-2 mb-1" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                                    <span style={{ fontSize: '1.25rem' }}>✉️</span>
                                    <span>Email Verification Required</span>
                                </div>
                                <p style={{ fontSize: '0.82rem', margin: '0 0 0.5rem 0', opacity: 0.9 }}>
                                    A verification link was sent to <strong>{unverifiedEmail}</strong>. Please check your inbox (and spam folder) and verify your email before logging in.
                                </p>
                                {resendSuccess ? (
                                    <div className="p-2 rounded-md text-xs font-bold" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                        ✅ {resendSuccess}
                                    </div>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={handleResendVerification} 
                                        disabled={resendLoading}
                                        className="btn btn-outline btn-xs w-100 mt-1"
                                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', fontWeight: 700 }}
                                    >
                                        {resendLoading ? "Resending..." : "🔁 Resend Verification Email"}
                                    </button>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="auth-error-banner">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label style={{ fontWeight: 700, display: 'block', textAlign: 'left', marginBottom: '0.5rem' }}>Login As</label>
                                <select 
                                    className="form-control" 
                                    value={role} 
                                    onChange={(e) => {
                                        setRole(e.target.value);
                                        setError('');
                                        setUnverifiedEmail('');
                                    }}
                                >
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
                                    <div className="form-group" style={{ textAlign: 'left' }}>
                                        <div className="flex justify-between items-center mb-1">
                                            <label style={{ fontWeight: 700, margin: 0 }}>Password</label>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setForgotEmail(email.trim() || '');
                                                    setForgotError('');
                                                    setForgotSuccess('');
                                                    setShowForgotPassword(true);
                                                }}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <input type={showPassword ? "text" : "password"} className="form-control" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: '2.75rem' }} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', bottom: '10px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, display: 'flex', color: 'var(--text-primary)' }}>
                                                {showPassword ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-secondary text-xs mb-2">Or continue with</div>
                                    <button type="button" className="btn btn-outline w-100" onClick={handleGoogleLogin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
                                        Google
                                    </button>
                                </div>
                            ) : (
                        <div className="flex flex-col gap-2">
                            <div className="form-group" style={{ marginBottom: '0.25rem' }}>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Room ID (e.g. ADM-12345)" 
                                    value={roomId} 
                                    onChange={e => setRoomId(e.target.value.toUpperCase())} 
                                    required 
                                />
                                <small className="text-secondary" style={{ fontSize: '0.72rem', display: 'block', textAlign: 'left', marginTop: '2px' }}>
                                    🔑 Enter any active Room ID you want to join or switch to.
                                </small>
                            </div>
                            <div className="form-group"><input type="text" className="form-control" placeholder="Full Name" value={studentName} onChange={e => setStudentName(e.target.value)} required /></div>
                            <div className="form-group">
                                <input 
                                    type="email" 
                                    className="form-control" 
                                    placeholder="Email" 
                                    value={studentEmail} 
                                    onChange={e => setStudentEmail(e.target.value)} 
                                    onBlur={handleEmailBlur}
                                    required 
                                />
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
                </>
            )}
            </div>
        </div>
    );
};

export default Login;