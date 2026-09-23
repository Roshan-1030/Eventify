import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { state } = useAppState();

    if (state.user) return null;

    return (
        <div style={{ maxWidth: '1040px', margin: '0 auto', paddingTop: '1.5rem' }}>
            {/* Hero Section */}
            <div className="glass-panel text-center" style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 1.5rem', marginBottom: '2rem' }}>
                <div className="badge badge-primary mb-3" style={{ fontSize: '0.78rem', padding: '0.3rem 0.85rem' }}>
                    Campus Event Management Platform
                </div>
                
                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 800, marginBottom: '1rem', maxWidth: '800px', margin: '0 auto 1rem auto' }}>
                    Coordinate campus events simply and reliably
                </h1>
                <p className="text-secondary" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', maxWidth: '640px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
                    The central hub for college fests, workshops, registrations, and student community interactions.
                </p>

                <div className="flex gap-3 justify-center flex-wrap mb-6">
                    <button className="btn btn-primary" style={{ padding: '0.65rem 1.75rem', fontSize: '0.95rem' }} onClick={() => navigate('/register')}>
                        Get Started
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.65rem 1.75rem', fontSize: '0.95rem' }} onClick={() => navigate('/login')}>
                        Log In
                    </button>
                </div>

                <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1rem 1.25rem', background: 'var(--primary-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-border)' }}>
                    <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--primary)', lineHeight: '1.5', fontWeight: 500 }}>
                        💡 Create a room for your college or join an existing room with your campus Room ID.
                    </p>
                </div>
            </div>

            {/* Why Choose Eventify */}
            <div className="grid grid-2 mb-8">
                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                    <h2 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>Digital Campus Coordination</h2>
                    <p className="text-secondary" style={{ lineHeight: 1.7, fontSize: '0.92rem' }}>
                        Eventify replaces scattered messaging groups and manual paper lists with a structured, centralized hub for all university activities.
                    </p>
                    <p className="text-secondary mt-3" style={{ lineHeight: 1.7, fontSize: '0.92rem' }}>
                        From hackathons to cultural nights, manage registrations, schedules, and entry passes seamlessly.
                    </p>
                </div>
                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                    <h2 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>Active Community</h2>
                    <p className="text-secondary" style={{ lineHeight: 1.7, fontSize: '0.92rem' }}>
                        Stay connected with real-time room announcements, interactive discussion channels, and quick polls.
                    </p>
                    <p className="text-secondary mt-3" style={{ lineHeight: 1.7, fontSize: '0.92rem' }}>
                        Every participant has direct access to coordinators and can voice feedback on completed events.
                    </p>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-4 mb-8">
                <div className="glass-panel text-center" style={{ padding: '1.5rem 1rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Events</h3>
                    <p className="text-secondary" style={{ fontSize: '0.84rem', margin: 0 }}>Discover workshops and fests with quick registration.</p>
                </div>
                <div className="glass-panel text-center" style={{ padding: '1.5rem 1rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Communities</h3>
                    <p className="text-secondary" style={{ fontSize: '0.84rem', margin: 0 }}>Join circles and student interest groups easily.</p>
                </div>
                <div className="glass-panel text-center" style={{ padding: '1.5rem 1rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎟️</div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Passes</h3>
                    <p className="text-secondary" style={{ fontSize: '0.84rem', margin: 0 }}>Digital entry tickets with instant QR verification.</p>
                </div>
                <div className="glass-panel text-center" style={{ padding: '1.5rem 1rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Live Polls</h3>
                    <p className="text-secondary" style={{ fontSize: '0.84rem', margin: 0 }}>Participate in live surveys and event voting.</p>
                </div>
            </div>

            {/* Developer Section */}
            <div className="glass-panel text-center" style={{ padding: '2rem 1.5rem' }}>
                <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Meet the Developer</h2>
                <p className="text-secondary" style={{ maxWidth: '480px', margin: '0 auto 1.25rem', fontSize: '0.88rem' }}>
                    Designed and engineered by Roshan to modernize college campus event coordination.
                </p>
                <div className="flex justify-center">
                    <a 
                        href="https://www.linkedin.com/in/roshan-462515387" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-outline" 
                        style={{ padding: '0.5rem 1.5rem', fontSize: '0.88rem' }}
                    >
                        Connect on LinkedIn
                    </a>
                </div>
            </div>

            <p className="text-center text-secondary mt-6 mb-6" style={{ fontSize: '0.82rem' }}>
                © 2026 Eventify. Designed and Developed by Roshan.
            </p>
        </div>
    );
};

export default LandingPage;
