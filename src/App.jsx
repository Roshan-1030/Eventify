import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppState } from './context/StateContext';

// Components
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import Announcements from './components/Announcements';
import Chat from './components/Chat';
import Feedback from './components/Feedback';
import Reports from './components/Reports';
import Gallery from './components/Gallery';
import Polls from './components/Polls';
import Groups from './components/Groups';
import About from './components/About';
import Contact from './components/Contact';
import EventDetails from './components/EventDetails';
import Profile from './components/Profile';

// Protected Route Wrapper
const AuthGuard = ({ children }) => {
    const { state } = useAppState();
    return state.user ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => (
    <div className="app-container">
        <Header />
        <main className="main-content" style={{ padding: '2rem' }}>
            {children}
        </main>
    </div>
);

const DashboardLayout = () => {
    const { state } = useAppState();
    return state.user?.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />;
};

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Pages */}
                <Route path="/about" element={<Layout><About /></Layout>} />
                <Route path="/contact" element={<Layout><Contact /></Layout>} />
                
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Secure App Structure */}
                <Route 
                    path="/" 
                    element={
                        <AuthGuard>
                            <Layout><DashboardLayout /></Layout>
                        </AuthGuard>
                    } 
                />

                <Route path="/announcements" element={<AuthGuard><Layout><Announcements /></Layout></AuthGuard>} />
                <Route path="/chat" element={<AuthGuard><Layout><Chat /></Layout></AuthGuard>} />
                <Route path="/feedback" element={<AuthGuard><Layout><Feedback /></Layout></AuthGuard>} />
                <Route path="/reports" element={<AuthGuard><Layout><Reports /></Layout></AuthGuard>} />
                <Route path="/gallery" element={<AuthGuard><Layout><Gallery /></Layout></AuthGuard>} />
                <Route path="/polls" element={<AuthGuard><Layout><Polls /></Layout></AuthGuard>} />
                <Route path="/groups" element={<AuthGuard><Layout><Groups /></Layout></AuthGuard>} />
                <Route path="/event/:id" element={<AuthGuard><Layout><EventDetails /></Layout></AuthGuard>} />
                <Route path="/profile" element={<AuthGuard><Layout><Profile /></Layout></AuthGuard>} />

                {/* Redirect any legacy hash-links manually if they exist, or just fallback to root */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
