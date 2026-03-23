import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { state, toggleTheme } = useAppState();

    if (state.user) return null;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '2rem' }}>
            {/* Theme Toggle for Landing */}
            <div className="flex justify-end mb-4 pr-4">
                <button className="btn btn-outline" onClick={toggleTheme} style={{ borderRadius: '50px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {state.theme === 'dark' ? '🔆 Light Mode' : '🌙 Dark Mode'}
                </button>
            </div>

            {/* Hero Section */}
            <div className="glass-panel text-center" style={{ padding: '4rem 2rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.1 }}></div>
                
                <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, marginBottom: '1.5rem', background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Celebrate Every Moment with Eventify
                </h1>
                <p className="text-secondary" style={{ fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
                    The complete campus event management system. From tech fests to cultural nights, manage your university experience all in one place.
                </p>

                <div className="flex gap-4 justify-center flex-wrap mb-8">
                    <button className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }} onClick={() => navigate('/register')}>Get Started Now</button>
                    <button className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }} onClick={() => navigate('/login')}>Login to Account</button>
                </div>

                <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Our Mission</h4>
                    <p style={{ fontSize: '0.9rem', margin: 0, opacity: 0.8 }}>
                        To bridge the gap between campus organizers and students by providing a seamless, digital-first experience that fosters community and participation.
                    </p>
                </div>
            </div>

            {/* Why Choose Eventify - New Detailed Section */}
            <div className="grid grid-2 gap-8 mb-12">
                <div className="glass-panel" style={{ padding: '2.5rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Digital Campus Revolution</h2>
                    <p className="text-secondary" style={{ lineHeight: 1.8 }}>
                        Eventify isn't just a website; it's a digital ecosystem designed for the modern university. We replace messy WhatsApp groups and paper-based registrations with a centralized hub for all campus activities. 
                    </p>
                    <p className="text-secondary mt-4" style={{ lineHeight: 1.8 }}>
                        Whether it's a high-stakes hackathon or a casual club meeting, Eventify ensures that every student has equal access to opportunities within the campus walls.
                    </p>
                </div>
                <div className="glass-panel" style={{ padding: '2.5rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Unified Community</h2>
                    <p className="text-secondary" style={{ lineHeight: 1.8 }}>
                        We believe that the best parts of college happen outside the classroom. Eventify provides the tools to build that community—featuring real-time discussion groups, instant announcements, and collaborative student feedback.
                    </p>
                    <p className="text-secondary mt-4" style={{ lineHeight: 1.8 }}>
                        Our platform empowers student leaders to organize better and helps every participant feel like a valued part of the campus culture.
                    </p>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-4 gap-6 mb-12">
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
                    <h3>Smart Events</h3>
                    <p className="text-secondary">Explore tech fests, cultural nights, and workshops with simplified one-click RSVP.</p>
                </div>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔖</div>
                    <h3>Personal Groups</h3>
                    <p className="text-secondary">Create private circles for your friends or project teams to coordinate event visits together.</p>
                </div>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎟️</div>
                    <h3>Secure Passes</h3>
                    <p className="text-secondary">Get official digital tickets with unique QR codes for verified campus entry.</p>
                </div>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
                    <h3>Interactive Polls</h3>
                    <p className="text-secondary">Participate in event surveys and live polls to shape the future of campus activities.</p>
                </div>
            </div>

            {/* Developer Section */}
            <div className="glass-panel text-center" style={{ padding: '3rem 2rem', borderTop: '4px solid var(--primary)' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Meet the Developer</h2>
                <div className="flex justify-center gap-4 mb-6">
                    <a href="https://www.linkedin.com/in/roshan-462515387" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 3rem', fontSize: '1.1rem' }}>
                        🔗 Connect on LinkedIn
                    </a>
                </div>
                <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>Bringing college campus events into the digital age with seamless automation and community tools.</p>
            </div>

            <p className="text-center text-secondary mt-12 mb-8" style={{ fontSize: '0.9rem' }}>
                © 2026 Eventify System. Designed and Developed by Roshan.
            </p>
        </div>
    );
};

export default LandingPage;
