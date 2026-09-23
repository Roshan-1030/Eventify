import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const Register = () => {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Verification sent state
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [createdRoomId, setCreatedRoomId] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMsg, setResendMsg] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!name || !email || !password) {
            setError("Please fill out all fields.");
            setLoading(false);
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        try {
            // Check if this email is already registered as an Admin room
            const adminQuery = query(
                collection(db, "profiles"), 
                where("email", "==", normalizedEmail),
                where("role", "==", "admin")
            );
            const adminSnap = await getDocs(adminQuery);
            if (!adminSnap.empty) {
                setError("Email is already registered");
                setLoading(false);
                return;
            }

            const userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
            const user = userCred.user;

            if (!user) throw new Error("User creation failed");

            // ✉️ Send Firebase Email Verification
            await sendEmailVerification(user);

            // Generate unique Room ID
            const randomStr = Math.floor(10000 + Math.random() * 90000);
            const roomId = `ADM-${randomStr}`;

            const docRef = doc(db, "profiles", user.uid);
            await setDoc(docRef, {
                id: user.uid,
                name: name.trim(),
                email: normalizedEmail,
                role: "admin",
                room_id: roomId,
                emailVerified: false,
                createdAt: new Date()
            }, { merge: true });

            // Immediately sign out so unverified session cannot access private views
            await signOut(auth);

            setCreatedRoomId(roomId);
            setRegisteredEmail(normalizedEmail);

        } catch (err) {
            console.error(err);
            if (err.code === "auth/email-already-in-use") {
                const adminQuery = query(
                    collection(db, "profiles"), 
                    where("email", "==", normalizedEmail),
                    where("role", "==", "admin")
                );
                const adminSnap = await getDocs(adminQuery);
                if (!adminSnap.empty) {
                    setError("Email is already registered");
                    return;
                }

                // If user was registered via student or Google previously without admin profile, attempt sign-in to attach admin room
                try {
                    const userCred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
                    const user = userCred.user;
                    await sendEmailVerification(user);

                    const randomStr = Math.floor(10000 + Math.random() * 90000);
                    const roomId = `ADM-${randomStr}`;
                    const docRef = doc(db, "profiles", user.uid);
                    await setDoc(docRef, {
                        id: user.uid,
                        name: name.trim(),
                        email: normalizedEmail,
                        role: "admin",
                        room_id: roomId,
                        emailVerified: user.emailVerified || false,
                        createdAt: new Date()
                    }, { merge: true });

                    await signOut(auth);
                    setCreatedRoomId(roomId);
                    setRegisteredEmail(normalizedEmail);
                    return;
                } catch (subErr) {
                    setError("Email is already registered");
                    return;
                }
            } else if (err.code === "auth/weak-password") {
                setError("Password should be at least 6 characters.");
            } else {
                setError(err.message.replace("Firebase: ", ""));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendFromRegister = async () => {
        if (!registeredEmail || !password) {
            navigate('/login');
            return;
        }
        try {
            setResendLoading(true);
            setResendMsg('');
            const cred = await signInWithEmailAndPassword(auth, registeredEmail, password);
            if (cred?.user) {
                await sendEmailVerification(cred.user);
                await signOut(auth);
                setResendMsg("✅ Verification email resent! Please check your inbox.");
            }
        } catch (err) {
            if (err.code === "auth/too-many-requests") {
                setResendMsg("⚠️ Too many attempts. Please wait a moment before requesting another email.");
            } else {
                setResendMsg("ℹ️ Please proceed to the Login page to resend your verification link.");
            }
        } finally {
            setResendLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setError('');
        setLoading(true);
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Ensure Google email is verified
            if (!user.emailVerified) {
                setError("Google account email is not verified. Please verify your Google account first.");
                await signOut(auth);
                setLoading(false);
                return;
            }

            const normalizedEmail = (user.email || '').trim().toLowerCase();
            const adminQuery = query(
                collection(db, "profiles"), 
                where("email", "==", normalizedEmail),
                where("role", "==", "admin")
            );
            const adminSnap = await getDocs(adminQuery);

            if (!adminSnap.empty) {
                setError("Email is already registered");
                await signOut(auth);
                setLoading(false);
                return;
            }

            const randomStr = Math.floor(10000 + Math.random() * 90000);
            const roomId = `ADM-${randomStr}`;
            const docRef = doc(db, "profiles", user.uid);

            await setDoc(docRef, {
                id: user.uid,
                name: user.displayName || "Admin User",
                email: normalizedEmail,
                role: "admin",
                room_id: roomId,
                emailVerified: true,
                createdAt: new Date()
            }, { merge: true });
            alert(`🎉 Room Created Successfully!\n\nYour Admin Room ID: ${roomId}`);
            navigate("/login");
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

    // Verification Sent Confirmation Screen
    if (registeredEmail) {
        return (
            <div className="auth-page-wrapper flex items-center justify-center w-100" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
                <div className="glass-panel login-container text-center" style={{ maxWidth: '460px', width: '100%', padding: '2.25rem 2rem' }}>
                    <div style={{ fontSize: '3.25rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3))' }}>✉️</div>
                    <h2 style={{ fontWeight: 800, margin: '0 0 0.5rem 0' }}>Verify Your Email</h2>
                    <p className="text-secondary" style={{ fontSize: '0.92rem', marginBottom: '1.25rem' }}>
                        We sent a verification link to:<br />
                        <strong style={{ color: 'var(--primary)', fontSize: '1.05rem', wordBreak: 'break-all' }}>{registeredEmail}</strong>
                    </p>

                    <div className="p-3 mb-4 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.07)', border: '1px solid rgba(99, 102, 241, 0.22)', textAlign: 'left', fontSize: '0.84rem' }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: 'var(--primary)' }}>
                            📌 Next Steps to Activate Your Room:
                        </p>
                        <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <li>Open your email inbox (and check Spam / Junk folders).</li>
                            <li>Click the verification link from <strong>Firebase</strong>.</li>
                            <li>Your Room ID is: <strong style={{ color: 'var(--primary)' }}>{createdRoomId}</strong></li>
                            <li>Return and log in with your verified email & password.</li>
                        </ol>
                    </div>

                    {resendMsg && (
                        <div className="p-2 mb-3 rounded-lg text-xs font-bold" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                            {resendMsg}
                        </div>
                    )}

                    <Link to="/login" className="btn btn-primary w-100 mb-3" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', fontWeight: 800 }}>
                        Proceed to Login
                    </Link>

                    <button 
                        type="button" 
                        onClick={handleResendFromRegister} 
                        disabled={resendLoading}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {resendLoading ? "Resending..." : "Didn't receive email? Resend verification link"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page-wrapper flex items-center justify-center w-100" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
            <div className="glass-panel login-container text-center" style={{ maxWidth: '450px', width: '100%' }}>
                <h1 className="logo mb-2">Eventify</h1>
                <p className="mb-4">Become an <strong>Organization Admin</strong> to host your own event rooms.</p>

                {error && (
                    <div className="auth-error-banner">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label style={{ fontWeight: 700 }}>Admin/Organization Name *</label>
                        <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                    </div>

                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label style={{ fontWeight: 700 }}>Email Address *</label>
                        <input type="email" className="form-control" placeholder="admin@college.edu" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>

                    <div className="form-group" style={{ textAlign: 'left', position: 'relative' }}>
                        <label style={{ fontWeight: 700 }}>Password *</label>
                        <input type={showPassword ? "text" : "password"} className="form-control" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: '2.75rem' }} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', bottom: '12px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, display: 'flex', color: 'var(--text-primary)' }}>
                            {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            )}
                        </button>
                    </div>

                    <button type="submit" className="btn btn-primary w-100 mt-3" disabled={loading}>
                        {loading ? "Creating Account..." : "Create My Event Room"}
                    </button>

                    <div className="text-secondary text-xs my-4">Or sign up with</div>
                    <button type="button" className="btn btn-outline w-100" onClick={handleGoogleRegister} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
                        Google
                    </button>
                </form>

                <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', margin: 0 }}>
                        Already an admin? <Link to="/login" style={{ fontWeight: 800 }}>Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;