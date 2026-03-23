import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const Header = () => {
    const { state, logout } = useAppState();
    const location = useLocation();
    
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleNav = (e) => { e.stopPropagation(); setIsNavOpen(!isNavOpen); setIsProfileOpen(false); };
    const toggleProfile = (e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); setIsNavOpen(false); };
    const closeAll = () => { setIsNavOpen(false); setIsProfileOpen(false); };

    const [viewedCounts, setViewedCounts] = useState({ announcements: 0, polls: 0 });
    const roomAnnouncementsCount = (state.announcements || []).filter(a => a.roomId === state.user?.roomId).length;
    const roomPollsCount = (state.polls || []).filter(p => p.roomId === state.user?.roomId).length;
    const newAnnouncements = Math.max(0, roomAnnouncementsCount - viewedCounts.announcements);
    const newPolls = Math.max(0, roomPollsCount - viewedCounts.polls);

    useEffect(() => {
        if (!state.user) return;
        const stored = localStorage.getItem(`viewedData_${state.user.id}`);
        if (stored) {
            try { setViewedCounts(JSON.parse(stored)); } catch (e) { }
        }
    }, [state.user]);

    useEffect(() => {
        if (!state.user) return;
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

    const navItems = [
        { path: '/', icon: '🏠', text: 'Dashboard', isPublic: false },
        { path: '/announcements', icon: '📢', text: 'Announcements', isPublic: false },
        { path: '/polls', icon: '📊', text: 'Polls', isPublic: false },
        { path: '/groups', icon: '👥', text: 'Groups', isPublic: false },
        { path: '/chat', icon: '💬', text: 'Discussion', isPublic: false },
        { path: '/reports', icon: '📈', text: 'Reports', isPublic: false, isAdminOnly: true },
    ];

    // Filter nav items based on user role and existence
    const filteredNavItems = navItems.filter(item => {
        if (item.isAdminOnly && state.user?.role !== 'admin') return false;
        if (!item.isPublic && !state.user) return false;
        return true;
    });

    const isActive = (item) => {
        if (item.path === '/') return location.pathname === '/';
        return location.pathname.startsWith(item.path);
    };

    return (
        <header className="glass-panel" style={{ borderRadius: 0, width: '100%', position: 'sticky', top: 0, zIndex: 100, padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div className="app-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                <div className="header-left-actions" style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <button className="btn" onClick={toggleNav} style={{ background: 'transparent', border: 'none', fontSize: '2rem', color: 'var(--text-primary)', cursor: 'pointer', padding: 0 }}>☰</button>
                    
                    {isNavOpen && (
                        <div id="nav-options" className="glass-panel" style={{ display: 'block', position: 'fixed', top: '80px', left: '20px', minWidth: '250px', zIndex: 10000, padding: '1.5rem', border: '2px solid var(--text-primary)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                            <div className="nav-links-vertical" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {filteredNavItems.map(item => {
                                    if (item.path.startsWith('/#')) {
                                        return (
                                            <a key={item.path} href={item.path} className="nav-link" style={{ width: '100%' }} onClick={(e) => {
                                                if (location.pathname === '/') {
                                                    e.preventDefault();
                                                    const target = document.getElementById(item.path.substring(2));
                                                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                                                }
                                                closeAll();
                                            }}>
                                                <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>{item.icon}</span>
                                                {item.text}
                                            </a>
                                        );
                                    }
                                    return (
                                        <Link key={item.path} to={item.path} className={`nav-link ${isActive(item) ? 'active' : ''}`} style={{ width: '100%', display: 'flex', alignItems: 'center' }} onClick={closeAll}>
                                            <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>{item.icon}</span>
                                            <span style={{ flex: 1 }}>{item.text}</span>
                                            {item.path === '/announcements' && newAnnouncements > 0 && (
                                                <span className="badge" style={{ background: 'var(--danger)', color: 'white', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                                                    {newAnnouncements} New
                                                </span>
                                            )}
                                            {item.path === '/polls' && newPolls > 0 && (
                                                <span className="badge" style={{ background: 'var(--danger)', color: 'white', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                                                    {newPolls} New
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                
                <Link to="/" className="logo-wrapper" style={{ textDecoration: 'none', textAlign: 'center', flex: 1 }}>
                    <h1 className="logo mb-0" style={{ fontSize: '2.5rem', margin: 0 }}>
                        Eventify
                    </h1>
                </Link>
                
                <div className="header-right-actions" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 1, position: 'relative' }}>
                    {state.user ? (
                        <>
                            <div className="user-profile-sm" style={{ margin: 0, padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={toggleProfile}>
                                <div className="hide-on-mobile" style={{ marginRight: '0.5rem', textAlign: 'right' }}>
                                    <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{state.user.name}</div>
                                    <span className={`badge badge-${state.user.role}`} style={{ fontSize: '0.65rem' }}>{state.user.role}</span>
                                </div>
                                <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1.1rem', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold' }}>{state.user.name.charAt(0).toUpperCase()}</div>
                            </div>
                            
                            {isProfileOpen && (
                                <div id="profile-dropdown" className="glass-panel" style={{ display: 'block', position: 'absolute', top: '100%', right: 0, minWidth: '200px', zIndex: 1000, padding: '0.5rem 0', marginTop: '1rem', border: '2px solid var(--text-primary)' }}>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        <li><Link to="/profile" className="dropdown-item" onClick={closeAll}>👤 View Profile</Link></li>
                                        <li><hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} /></li>
                                        <li><button className="dropdown-item" onClick={() => { logout(); closeAll(); }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 'inherit', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            🚪 Sign Out
                                        </button></li>
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary" style={{ padding: '0.6rem 1.4rem' }}>Login</Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
