import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const Header = () => {
    const { state, logout, toggleTheme } = useAppState();
    const location = useLocation();
    
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleNav = (e) => { 
        e.stopPropagation(); 
        setIsNavOpen(!isNavOpen); 
        setIsProfileOpen(false); 
    };

    const toggleProfile = (e) => { 
        e.stopPropagation(); 
        setIsProfileOpen(!isProfileOpen); 
        setIsNavOpen(false); 
    };

    const closeAll = () => { 
        setIsNavOpen(false); 
        setIsProfileOpen(false); 
    };

    const [viewedCounts, setViewedCounts] = useState({ announcements: 0, polls: 0 });
    const userRoomId = state.user?.roomId || '';
    const roomAnnouncementsCount = (state.announcements || []).filter(a => a.roomId === userRoomId).length;
    const roomPollsCount = (state.polls || []).filter(p => p.roomId === userRoomId && !p.groupId).length;
    const newAnnouncements = Math.max(0, roomAnnouncementsCount - viewedCounts.announcements);
    const newPolls = Math.max(0, roomPollsCount - viewedCounts.polls);

    useEffect(() => {
        if (!state.user?.id) return;
        const stored = localStorage.getItem(`viewedData_${state.user.id}`);
        if (stored) {
            try { setViewedCounts(JSON.parse(stored)); } catch (e) { }
        }
    }, [state.user]);

    useEffect(() => {
        if (!state.user?.id) return;
        let changed = false;
        let newCounts = { ...viewedCounts };
        
        if (location.pathname === '/announcements' && viewedCounts.announcements !== roomAnnouncementsCount) {
            newCounts.announcements = roomAnnouncementsCount;
            changed = true;
        }
        if (location.pathname === '/polls' && viewedCounts.polls !== roomPollsCount) {
            newCounts.polls = roomPollsCount;
            changed = true;
        }
        
        if (changed) {
            setViewedCounts(newCounts);
            localStorage.setItem(`viewedData_${state.user.id}`, JSON.stringify(newCounts));
        }
    }, [location.pathname, roomAnnouncementsCount, roomPollsCount, state.user, viewedCounts]);

    useEffect(() => {
        const handleClickOutside = () => closeAll();
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Prevent body scrolling when mobile drawer is open
    useEffect(() => {
        if (isNavOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isNavOpen]);

    const navItems = [
        // Public links for guests
        { path: '/', icon: '🏠', text: 'Home', isPublic: true, isGuestOnly: true },
        { path: '/login', icon: '🔑', text: 'Login', isPublic: true, isGuestOnly: true },
        { path: '/register', icon: '✨', text: 'Create Room', isPublic: true, isGuestOnly: true },
        
        // Logged-in user routes
        { path: '/', icon: '🏠', text: 'Dashboard', isPublic: false },
        { path: '/announcements', icon: '📢', text: 'Announcements', isPublic: false },
        { path: '/polls', icon: '📊', text: 'Polls', isPublic: false },
        { path: '/groups', icon: '👥', text: 'Communities', isPublic: false },
        { path: '/chat', icon: '💬', text: 'Discussion', isPublic: false },
        { path: '/gallery', icon: '🖼️', text: 'Gallery', isPublic: false },
        { path: '/payment', icon: '💳', text: 'Payments', isPublic: false },
        { path: '/#about', icon: 'ℹ️', text: 'About Room', isPublic: false },
        { path: '/#contact', icon: '📞', text: 'Contact Info', isPublic: false },
        { path: '/#feedback', icon: '⭐', text: 'Feedback', isPublic: false },
    ];

    // Filter nav items based on user role and existence
    const filteredNavItems = navItems.filter(item => {
        if (item.isAdminOnly && state.user?.role !== 'admin') return false;
        if (item.isGuestOnly && state.user) return false;
        if (!item.isPublic && !state.user) return false;
        return true;
    });

    const isActive = (item) => {
        if (item.path === '/') return location.pathname === '/' && !location.hash;
        if (item.path.startsWith('/#')) return location.hash === item.path.substring(1);
        return location.pathname.startsWith(item.path);
    };

    const userName = state.user?.name || state.user?.email || 'User';
    const userInitial = (state.user?.name || state.user?.email || 'U').charAt(0).toUpperCase();

    return (
        <header className="glass-panel">
            <div className="app-header-container">
                {/* Left: Navigation Menu Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-start' }}>
                    <button 
                        className="btn btn-sm" 
                        onClick={toggleNav} 
                        aria-label="Toggle Navigation Menu"
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            fontSize: '1.6rem', 
                            color: 'var(--text-primary)', 
                            cursor: 'pointer', 
                            padding: '0.4rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '40px',
                            minWidth: '40px'
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                {/* Center: Brand Logo */}
                <Link to="/" onClick={closeAll} style={{ textDecoration: 'none', textAlign: 'center', flex: 2, display: 'flex', justifyContent: 'center' }}>
                    <span className="logo">
                        Eventify
                    </span>
                </Link>
                
                {/* Right: Profile or Login */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 1, position: 'relative' }}>
                    {state.user ? (
                        <>
                            <button 
                                className="user-profile-sm" 
                                style={{ 
                                    margin: 0, 
                                    padding: '0.2rem 0.4rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    border: 'none', 
                                    background: 'transparent', 
                                    cursor: 'pointer',
                                    gap: '0.5rem',
                                    borderRadius: '999px'
                                }} 
                                onClick={toggleProfile}
                            >
                                <div className="hide-on-mobile" style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{userName}</div>
                                    <span className={`badge badge-${state.user.role || 'student'}`} style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem' }}>{state.user.role || 'student'}</span>
                                </div>
                                <div className="avatar" style={{ width: '38px', height: '38px', fontSize: '1rem' }}>
                                    {userInitial}
                                </div>
                            </button>
                            
                            {isProfileOpen && (
                                <div 
                                    className="glass-panel" 
                                    style={{ 
                                        position: 'absolute', 
                                        top: 'calc(100% + 10px)', 
                                        right: 0, 
                                        minWidth: '220px', 
                                        maxWidth: '90vw', 
                                        zIndex: 10001, 
                                        padding: '0.5rem 0', 
                                        boxShadow: 'var(--premium-shadow)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)'
                                    }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{userName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{state.user.email || 'No email'}</div>
                                        {state.user.phone && (
                                            <div style={{ fontSize: '0.74rem', color: 'var(--success)', marginTop: '2px', fontWeight: 600 }}>
                                                📱 {state.user.phone}
                                            </div>
                                        )}
                                        <div className="mt-2">
                                            <span className="badge badge-admin" style={{ fontSize: '0.65rem' }}>Room: {state.user.roomId || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: '0.25rem 0', margin: 0 }}>
                                        <li>
                                            <Link to="/profile" className="dropdown-item" onClick={closeAll} style={{ gap: '0.6rem' }}>
                                                <span>👤</span> Manage Profile
                                            </Link>
                                        </li>
                                        <li>
                                            <button 
                                                className="dropdown-item" 
                                                onClick={() => { toggleTheme(); }} 
                                                style={{ gap: '0.6rem' }}
                                            >
                                                <span>{state.theme === 'dark' ? '🔆' : '🌙'}</span> {state.theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                                            </button>
                                        </li>
                                        <li><hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '0.4rem 0' }} /></li>
                                        <li>
                                            <button 
                                                className="dropdown-item dropdown-item-danger" 
                                                onClick={() => { logout(); closeAll(); }} 
                                                style={{ gap: '0.6rem', fontWeight: 700 }}
                                            >
                                                <span>🚪</span> Sign Out
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1.25rem' }}>Login</Link>
                    )}
                </div>
            </div>

            {/* Modern Slide-in Navigation Drawer rendered in portal */}
            {isNavOpen && createPortal(
                <>
                    <div className="nav-drawer-backdrop" onClick={closeAll} />
                    <div className="nav-drawer" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="logo" style={{ fontSize: '1.4rem' }}>Eventify</span>
                            </div>
                            <button 
                                className="btn btn-sm" 
                                onClick={closeAll}
                                aria-label="Close Navigation"
                                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem', minHeight: '36px', minWidth: '36px' }}
                            >
                                ✕
                            </button>
                        </div>

                        {state.user && (
                            <div style={{ padding: '0.75rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid rgba(37, 99, 235, 0.15)' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{userName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                    Room ID: <strong style={{ color: 'var(--primary)' }}>{state.user.roomId || 'N/A'}</strong>
                                </div>
                                {state.user.phone && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.2rem', fontWeight: 600 }}>
                                        📱 {state.user.phone}
                                    </div>
                                )}
                            </div>
                        )}

                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, overflowY: 'auto' }}>
                            {filteredNavItems.map(item => {
                                if (item.path.startsWith('/#')) {
                                    return (
                                        <a 
                                            key={item.path} 
                                            href={item.path} 
                                            className="nav-link" 
                                            onClick={(e) => {
                                                if (location.pathname === '/') {
                                                    e.preventDefault();
                                                    const target = document.getElementById(item.path.substring(2));
                                                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                                                }
                                                closeAll();
                                            }}
                                        >
                                            <span style={{ fontSize: '1.15rem' }}>{item.icon}</span>
                                            <span>{item.text}</span>
                                        </a>
                                    );
                                }
                                return (
                                    <Link 
                                        key={item.path} 
                                        to={item.path} 
                                        className={`nav-link ${isActive(item) ? 'active' : ''}`} 
                                        onClick={closeAll}
                                    >
                                        <span style={{ fontSize: '1.15rem' }}>{item.icon}</span>
                                        <span style={{ flex: 1 }}>{item.text}</span>
                                        {item.path === '/announcements' && newAnnouncements > 0 && (
                                            <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                                                {newAnnouncements} New
                                            </span>
                                        )}
                                        {item.path === '/polls' && newPolls > 0 && (
                                            <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                                                {newPolls} New
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <button 
                                className="btn btn-outline w-100" 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', fontSize: '0.85rem' }} 
                                onClick={toggleTheme}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>{state.theme === 'dark' ? '🔆' : '🌙'}</span>
                                    <span>{state.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                </span>
                                <span className="badge" style={{ fontSize: '0.65rem' }}>Theme</span>
                            </button>

                            {state.user && (
                                <button 
                                    className="btn btn-danger btn-sm w-100 mt-2" 
                                    onClick={() => { logout(); closeAll(); }}
                                    style={{ padding: '0.6rem' }}
                                >
                                    🚪 Sign Out
                                </button>
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </header>
    );
};

export default Header;
