import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppState } from './context/StateContext';
import Header from './components/Header';
import Login from './auth/Login';
import Register from './auth/Register';
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
import Payment from './components/Payment';
import TicketPage from './components/TicketPage';
import LandingPage from './components/LandingPage';


import UserProfileModal from './components/UserProfileModal';

const AuthGuard = ({ children }) => {
    const { state } = useAppState();
    return state.user ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => (
    <div className="app-container">
        <Header />
        <main className="main-content">
            {children}
        </main>
        <UserProfileModal />
    </div>
);

const DashboardLayout = () => {
    const { state } = useAppState();
    const location = useLocation();

    useEffect(() => {
        if (location.hash) {
            const id = location.hash.substring(1);
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    }, [location]);

    return (
        <div className="dashboard-content-wrapper">
            {state.user?.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />}
            <div id="about" style={{ paddingTop: '2rem' }}>
                <About />
            </div>
            <div id="contact" style={{ paddingTop: '2rem' }}>
                <Contact />
            </div>
            <div id="feedback" style={{ paddingTop: '2rem' }}>
                <Feedback />
            </div>
        </div>
    );
};

const App = () => {
    const { state } = useAppState();
    
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Pages (Moved to Dashboard) */}

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Secure App Structure */}
                <Route
                    path="/"
                    element={
                        state.user ? (
                            <AuthGuard>
                                <Layout><DashboardLayout /></Layout>
                            </AuthGuard>
                        ) : (
                            <Layout><LandingPage /></Layout>
                        )
                    }
                />

                <Route path="/announcements" element={<AuthGuard><Layout><Announcements /></Layout></AuthGuard>} />
                <Route path="/chat" element={<AuthGuard><Layout><Chat /></Layout></AuthGuard>} />
                <Route path="/reports" element={<AuthGuard><Layout><Reports /></Layout></AuthGuard>} />

                <Route path="/gallery" element={<AuthGuard><Layout><Gallery /></Layout></AuthGuard>} />
                <Route path="/gallery/:folderId" element={<AuthGuard><Layout><Gallery /></Layout></AuthGuard>} />

                <Route path="/polls" element={<AuthGuard><Layout><Polls /></Layout></AuthGuard>} />

                <Route path="/groups" element={<AuthGuard><Layout><Groups /></Layout></AuthGuard>} />
                <Route path="/groups/:groupId" element={<AuthGuard><Layout><Groups /></Layout></AuthGuard>} />

                <Route path="/event/:id" element={<AuthGuard><Layout><EventDetails /></Layout></AuthGuard>} />
                <Route path="/payment/:eventId" element={<AuthGuard><Layout><Payment /></Layout></AuthGuard>} />
                <Route path="/profile" element={<AuthGuard><Layout><Profile /></Layout></AuthGuard>} />
                <Route path="/ticket/:paymentId" element={<AuthGuard><Layout><TicketPage /></Layout></AuthGuard>} />

                {/* Redirect any legacy hash-links manually if they exist, or just fallback to root */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
