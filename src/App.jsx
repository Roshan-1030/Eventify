import React, { useState, useEffect } from 'react';
import { useAppState } from './context/StateContext';

// Auth Components
import Login from './components/Login';
import Register from './components/Register';

// Layout & Dashboard
import Header from './components/Header';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';

// Shared / Feature Components
import Announcements from './components/Announcements';
import Chat from './components/Chat';
import Feedback from './components/Feedback';
import Reports from './components/Reports';
import Gallery from './components/Gallery';
import Polls from './components/Polls';
import Groups from './components/Groups';

// Simple Placeholder for other views
const Placeholder = ({ title }) => (
    <div className="glass-panel text-center">
        <h1>{title}</h1>
        <p>This section is coming soon in the React migration!</p>
        <button className="btn btn-primary" onClick={() => window.location.hash = '#dashboard'}>Back to Home</button>
    </div>
);

const App = () => {
    const { state } = useAppState();
    const [hash, setHash] = useState(window.location.hash || '#login');

    useEffect(() => {
        const handleHashChange = () => setHash(window.location.hash || '#login');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Auth Guard
    useEffect(() => {
        if (!state.user && !['#login', '#register'].some(h => hash.startsWith(h))) {
            window.location.hash = '#login';
        } else if (state.user && ['#login', '#register'].some(h => hash.startsWith(h))) {
            window.location.hash = '#dashboard';
        }
    }, [state.user, hash]);

    const renderContent = () => {
        if (hash.startsWith('#login')) return <Login />;
        if (hash.startsWith('#register')) return <Register />;
        
        if (!state.user) return <Login />;

        if (hash === '#dashboard') {
            return state.user.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />;
        }
        
        if (hash === '#announcements') return <Announcements />;
        if (hash === '#chat') return <Chat />;
        if (hash === '#feedback') return <Feedback />;
        if (hash === '#reports') return <Reports />;
        if (hash.startsWith('#gallery')) return <Gallery />;
        if (hash === '#polls') return <Polls />;
        if (hash.startsWith('#groups')) return <Groups />;
        
        // Match specific routes (placeholders for now)
        if (hash.startsWith('#event-details')) return <Placeholder title="Event Details" />;
        if (hash === '#profile') return <Placeholder title="User Profile" />;

        return <AdminDashboard />;
    };

    const isAuthPage = hash.startsWith('#login') || hash.startsWith('#register');

    return (
        <div className="app-container">
            {!isAuthPage && <Header />}
            <main className="main-content" style={{ padding: !isAuthPage ? '2rem' : '0' }}>
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
