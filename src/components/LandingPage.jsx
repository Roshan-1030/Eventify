import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { state } = useAppState();

    if (state.user) return null;

    return (
        <div style={{ maxWidth: '1080px', margin: '0 auto', paddingTop: '1rem' }}>
            {/* Hero Section */}
            <div className="glass-panel text-center" style={{ padding: 'clamp(2.5rem, 5vw, 4.5rem) clamp(1rem, 3vw, 2.5rem)', marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.15 }}></div>
                
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', fontWeight: 900, marginBottom: '1.25rem', background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Celebrate Every Moment with Eventify
                </h1>
                <p className="text-secondary" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', maxWidth: '680px', margin: '0 auto 2rem', lineHeight: '1.7' }}>
                    The complete campus event management system. From tech fests to cultural nights, manage your university experience all in one place.
                </p>

                <div className="flex gap-3 justify-center flex-wrap mb-8">
                    <button className="btn btn-primary" style={{ padding: '0.9rem 2.25rem', fontSize: '1.05rem' }} onClick={() => navigate('/register')}>
                        Get Started Now
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.9rem 2.25rem', fontSize: '1.05rem' }} onClick={() => navigate('/login')}>
                        Login to Account
                    </button>
                </div>

                <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.25rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.35rem', fontSize: '1rem' }}>Our Mission</h4>
                    <p style={{ fontSize: '0.88rem', margin: 0, opacity: 0.85, lineHeight: '1.6' }}>
                        To bridge the gap between campus organizers and students with a seamless, digital-first experience that fosters community and participation.
                    </p>
                </div>
            </div>

            {/* Why Choose Eventify */}
            <div className="grid grid-2 mb-10">
                <div className="glass-panel" style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
                    <h2 style={{ marginBottom: '1rem', color: 'var(--primary)', fontSize: '1.35rem' }}>Digital Campus Revolution</h2>
                    <p className="text-secondary" style={{ lineHeight: 1.8 }}>
                        Eventify replaces messy messaging threads and paper registrations with a centralized hub for all campus activities. 
                    </p>
                    <p className="text-secondary mt-3" style={{ lineHeight: 1.8 }}>
                        Whether it's a high-stakes hackathon or a club meeting, Eventify ensures every student has equal access to campus opportunities.
                    </p>
                </div>
                <div className="glass-panel" style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
                    <h2 style={{ marginBottom: '1rem', color: 'var(--accent)', fontSize: '1.35rem' }}>Unified Community</h2>
                    <p className="text-secondary" style={{ lineHeight: 1.8 }}>
                        We believe the best parts of college happen together. Eventify provides the tools to build community with discussion rooms, real-time announcements, and student feedback.
                    </p>
                    <p className="text-secondary mt-3" style={{ lineHeight: 1.8 }}>
                        Our platform empowers student leaders to coordinate better and helps every participant feel valued.
                    </p>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-4 mb-10">
                <div className="glass-panel text-center" style={{ padding: '1.75rem 1.25rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>Smart Events</h3>
                    <p className="text-secondary" style={{ fontSize: '0.88rem', margin: 0 }}>Explore fests and workshops with simplified one-click RSVP.</p>
                </div>
                <div className="glass-panel text-center" style={{ padding: '1.75rem 1.25rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔖</div>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>Communities</h3>
                    <p className="text-secondary" style={{ fontSize: '0.88rem', margin: 0 }}>Join circles and clubs to coordinate activities together.</p>
                </div>
                <div className="glass-panel text-center" style={{ padding: '1.75rem 1.25rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎟️</div>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>Secure Passes</h3>
                    <p className="text-secondary" style={{ fontSize: '0.88rem', margin: 0 }}>Digital tickets with unique QR codes for verified campus entry.</p>
                </div>
                <div className="glass-panel text-center" style={{ padding: '1.75rem 1.25rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>Live Polls</h3>
                    <p className="text-secondary" style={{ fontSize: '0.88rem', margin: 0 }}>Voice your opinion in instant event surveys and live polls.</p>
                </div>
            </div>

            {/* Developer Section */}
            <div className="glass-panel text-center" style={{ padding: '2.5rem 1.5rem', borderTop: '4px solid var(--primary)' }}>
                <h2 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Meet the Developer</h2>
                <div className="flex justify-center mb-4">
                    <a 
                        href="https://www.linkedin.com/in/roshan-462515387" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-primary" 
                        style={{ padding: '0.8rem 2rem' }}
                    >
                        🔗 Connect on LinkedIn
                    </a>
                </div>
                <p className="text-secondary" style={{ maxWidth: '500px', margin: '0 auto', fontSize: '0.9rem' }}>
                    Bringing college campus events into the digital age with modern automation and community tools.
                </p>
            </div>

            <p className="text-center text-secondary mt-8 mb-6" style={{ fontSize: '0.85rem' }}>
                © 2026 Eventify System. Designed and Developed by Roshan.
            </p>
        </div>
    );
};

export default LandingPage;
