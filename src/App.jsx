import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppState } from './context/StateContext';

// Layout & Core
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';

// Dashboard Components
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import Announcements from './components/Announcements';
import Chat from './components/Chat';
import Feedback from './components/Feedback';
import Reports from './components/Reports';
import Gallery from './components/Gallery';
import Polls from './components/Polls';
import Groups from './components/Groups';

// New Project Pages
import About from './components/About';
import Contact from './components/Contact';

// Helper for protected routes
const AuthGuard = ({ children }) => {
    const { state } = useAppState();
    return state.user ? children : <Navigate to="/login" />;
};

const DashboardContainer = () => {
    const { state } = useAppState();
    const [hash, setHash] = React.useState(window.location.hash || '#dashboard');

    React.useEffect(() => {
        const handleHashChange = () => setHash(window.location.hash || '#dashboard');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    
    // Internal Dashboard Router (using hashes to preserve existing state logic)
    const renderSection = () => {
        if (!state.user) return <Navigate to="/login" />;

        if (hash === '#dashboard' || hash === '' || hash === '#index.html') {
            return state.user.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />;
        }
        if (hash === '#announcements') return <Announcements />;
        if (hash === '#chat') return <Chat />;
        if (hash === '#feedback') return <Feedback />;
        if (hash === '#reports') return <Reports />;
        if (hash.startsWith('#gallery')) return <Gallery />;
        if (hash === '#polls') return <Polls />;
        if (hash.startsWith('#groups')) return <Groups />;
        
        return state.user.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />;
    };

    return (
        <div className="app-container">
            {!['#login', '#register'].some(h => hash.startsWith(h)) && <Header />}
            <main className="main-content" style={{ padding: !['#login', '#register'].some(h => hash.startsWith(h)) ? '2rem' : '0' }}>
                {renderSection()}
            </main>
        </div>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Pages */}
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Secure App Root */}
                <Route 
                    path="/" 
                    element={
                        <AuthGuard>
                            <DashboardContainer />
                        </AuthGuard>
                    } 
                />

                {/* SPA Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
