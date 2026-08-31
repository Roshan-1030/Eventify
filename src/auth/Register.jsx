import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase.js';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const Register = () => {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!name || !email || !password) {
            setError("Please fill out all fields.");
            setLoading(false);
            return;
        }

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const user = userCred.user;

            if (!user) throw new Error("User creation failed");

            // Generate unique Room ID
            const randomStr = Math.floor(10000 + Math.random() * 90000);
            const roomId = `ADM-${randomStr}`;

            const docRef = doc(db, "profiles", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    id: user.uid,
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    role: "admin",
                    room_id: roomId,
                    createdAt: new Date()
                });
            }

            alert(`🎉 Registration Successful!\n\nYour Admin Room ID: ${roomId}`);
            navigate("/login");

        } catch (err) {
            console.error(err);
            if (err.code === "auth/email-already-in-use") {
                setError("Email already registered. Please login.");
            } else if (err.code === "auth/weak-password") {
                setError("Password should be at least 6 characters.");
            } else {
                setError(err.message.replace("Firebase: ", ""));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setError('');
        setLoading(true);
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const docRef = doc(db, "profiles", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                const randomStr = Math.floor(10000 + Math.random() * 90000);
                const roomId = `ADM-${randomStr}`;

                await setDoc(docRef, {
                    id: user.uid,
                    name: user.displayName || "Admin User",
                    email: user.email,
                    role: "admin",
                    room_id: roomId,
                    createdAt: new Date()
                });
                alert(`🎉 Room Created Successfully!\n\nYour Admin Room ID: ${roomId}`);
            } else {
                alert("Account already exists. Logging you in...");
            }
            
            navigate("/login");
        } catch (err) {
            setError(err.message.replace("Firebase: ", ""));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper flex items-center justify-center w-100" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
            <div className="glass-panel login-container text-center" style={{ maxWidth: '450px', width: '100%' }}>
                <h1 className="logo mb-2">Eventify</h1>
                <p className="mb-4">Become an <strong>Organization Admin</strong> to host your own event rooms.</p>

                {error && <div className="p-3 mb-4 rounded-lg bg-danger text-white font-bold" style={{ fontSize: '0.85rem' }}>{error}</div>}

                <form onSubmit={handleRegister}>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label style={{ fontWeight: 700 }}>Admin/Organization Name *</label>
                        <input type="text" className="form-control" placeholder="e.g. Science Club or John Doe" value={name} onChange={e => setName(e.target.value)} required />
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