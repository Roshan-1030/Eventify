import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const Header = () => {
    const { state, logout } = useAppState();
    const location = useLocation();
    
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const currentHash = window.location.hash || '#dashboard';

    const toggleNav = (e) => { e.stopPropagation(); setIsNavOpen(!isNavOpen); setIsProfileOpen(false); };
    const toggleProfile = (e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); setIsNavOpen(false); };
    const closeAll = () => { setIsNavOpen(false); setIsProfileOpen(false); };

    useEffect(() => {
        const handleClickOutside = () => closeAll();
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const navItems = [
        { path: '/', icon: '🏠', text: 'Home', isPage: true, isPublic: true },
        { path: '/about', icon: 'ℹ️', text: 'About', isPage: true, isPublic: true },
        { path: '/contact', icon: '📞', text: 'Contact', isPage: true, isPublic: true },
        { path: '/#dashboard', icon: '📊', text: 'Dashboard', isPublic: false },
        { path: '/#announcements', icon: '📢', text: 'Announcements', isPublic: false },
        { path: '/#polls', icon: '📊', text: 'Polls', isPublic: false },
        { path: '/#groups', icon: '👥', text: 'Groups', isPublic: false },
        { path: '/#chat', icon: '💬', text: 'Discussion', isPublic: false },
        { path: '/#feedback', icon: '📝', text: 'Feedback', isPublic: false },
        { path: '/#reports', icon: '📈', text: 'Reports', isPublic: false, isAdminOnly: true }
    ];

    // Filter nav items based on user role and existence
    const filteredNavItems = navItems.filter(item => {
        if (item.isAdminOnly && state.user?.role !== 'admin') return false;
        if (!item.isPublic && !state.user) return false;
        return true;
    });

    const isActive = (item) => {
        if (item.isPage) return location.pathname === item.path;
        return currentHash.startsWith(item.path.split('#')[1] || 'dashboard');
    };

    return (
        <header className="glass-panel" style={{ borderRadius: 0, width: '100%', position: 'sticky', top: 0, zIndex: 100, padding: '1rem 2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <button className="btn" onClick={toggleNav} style={{ background: 'transparent', border: 'none', fontSize: '2rem', color: 'var(--text-primary)', cursor: 'pointer', padding: 0 }}>☰</button>
                    
                    {isNavOpen && (
                        <div id="nav-options" className="glass-panel" style={{ display: 'block', position: 'fixed', top: '80px', left: '20px', minWidth: '250px', zIndex: 10000, padding: '1.5rem', border: '2px solid var(--text-primary)' }}>
                            <div className="nav-links-vertical" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {filteredNavItems.map(item => (
                                    <Link key={item.path} to={item.path} className={`nav-link ${isActive(item) ? 'active' : ''}`} style={{ width: '100%' }} onClick={closeAll}>
                                        <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>{item.icon}</span>
                                        {item.text}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <Link to="/" style={{ textDecoration: 'none', textAlign: 'center', flex: 1 }}>
                    <h1 className="logo mb-0" style={{ fontSize: '2.5rem', margin: 0 }}>
                        Eventify
                    </h1>
                </Link>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 1, position: 'relative' }}>
                    {state.user ? (
                        <>
                            <div className="user-profile-sm" style={{ margin: 0, padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={toggleProfile}>
                                <span className={`badge badge-${state.user.role} hide-on-mobile`} style={{ marginRight: '0.5rem' }}>{state.user.role}</span>
                                <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>{state.user.name.charAt(0).toUpperCase()}</div>
                            </div>
                            
                            {isProfileOpen && (
                                <div id="profile-dropdown" className="glass-panel" style={{ display: 'block', position: 'absolute', top: '100%', right: 0, minWidth: '180px', zIndex: 1000, padding: '0.5rem 0', marginTop: '0.5rem', border: '2px solid var(--text-primary)' }}>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        <li><Link to="/#profile" className="dropdown-item" onClick={closeAll}>👤 View Profile</Link></li>
                                        <li><hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} /></li>
                                        <li><button className="dropdown-item" onClick={() => { logout(); closeAll(); }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 'inherit', cursor: 'pointer', color: 'var(--danger)' }}>🚪 Logout</button></li>
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem' }}>Login</Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
