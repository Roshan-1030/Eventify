import React from 'react';
import Header from './Header';

const About = () => {
    return (
        <div className="app-container">
            <Header />
            <main className="main-content">
                <div className="glass-panel text-center mb-8">
                    <h1 style={{ marginBottom: '1rem' }}>About Eventify</h1>
                    <p className="text-secondary" style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.2rem' }}>
                        The ultimate, premium College Event Management platform designed to bridge the gap between organizers and attendees. 
                        Eventify blends cutting-edge technology with high-end aesthetics to provide a seamless event experience.
                    </p>
                </div>

                <div className="grid-cards">
                    <div className="glass-panel">
                        <h3>Our Mission</h3>
                        <p>To empower students to lead, coordinate, and experience campus life at its peak, with modern tools and zero friction.</p>
                    </div>
                    <div className="glass-panel">
                        <h3>Built for Groups</h3>
                        <p>Real-time chat, collaborative planning, and room-based privacy make it perfect for college hostels and clubs.</p>
                    </div>
                    <div className="glass-panel">
                        <h3>Data-Driven</h3>
                        <p>From analytics to reports, we provide organizers with the insights they need to run successful events.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default About;
