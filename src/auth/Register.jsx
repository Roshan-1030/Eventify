import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const Register = () => {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
            // 🔐 Create user in Firebase Auth
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCred.user;

            if (!user) throw new Error("User creation failed");

            // 🎯 Generate unique Room ID
            const randomStr = Math.floor(10000 + Math.random() * 90000);
            const roomId = `ADM-${randomStr}`;

            // 🔍 Check if profile already exists (safety)
            const docRef = doc(db, "profiles", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // 💾 Store data in Firestore
                await setDoc(docRef, {
                    id: user.uid,
                    name,
                    email,
                    role: "admin",
                    room_id: roomId,
                    createdAt: new Date()
                });
            }

            alert(`🎉 Registration Successful!\n\nYour Room ID: ${roomId}`);

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

    return (
        <div className="auth-page-wrapper flex items-center justify-center w-100" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
            <div className="glass-panel login-container text-center" style={{ maxWidth: '450px', width: '90%' }}>
                <h1 className="logo mb-2">Eventify</h1>
                <p className="mb-4">Become an <strong>Organization Admin</strong> to host your own event rooms.</p>

                {error && <div className="p-3 mb-4 rounded-lg bg-danger text-white font-bold" style={{ fontSize: '0.85rem' }}>{error}</div>}

                <form onSubmit={handleRegister}>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label style={{ fontWeight: 700 }}>Admin/Organization Name</label>
                        <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                    </div>

                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label style={{ fontWeight: 700 }}>Email ID</label>
                        <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>

                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label style={{ fontWeight: 700 }}>Password</label>
                        <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading}>
                        {loading ? "Creating Account..." : "Create My Event Room"}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem' }}>
                        Already an admin? <Link to="/login">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;