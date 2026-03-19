import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/StateContext';

const Header = () => {
    const { state, logout } = useAppState();
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const currentHash = window.location.hash || '#dashboard';

    const navItems = [
        { hash: '#dashboard', icon: '🏠', text: 'Home' },
        { hash: '#announcements', icon: '📢', text: 'Announcements' },
        { hash: '#polls', icon: '📊', text: 'Polls' },
        { hash: '#groups', icon: '👥', text: 'Groups' },
        { hash: '#chat', icon: '💬', text: 'Discussion' },
        { hash: '#feedback', icon: '📝', text: 'Feedback' },
        ...(state.user?.role === 'admin' ? [{ hash: '#reports', icon: '📈', text: 'Reports' }] : [])
    ];

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

    useEffect(() => {
        const handleClickOutside = () => closeAll();
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    if (!state.user) return null;

    return (
        <header className="glass-panel" style={{ borderRadius: 0, width: '100%', position: 'sticky', top: 0, zIndex: 100, padding: '1rem 2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <button className="btn" onClick={toggleNav} style={{ background: 'transparent', border: 'none', fontSize: '2rem', color: 'var(--text-primary)', cursor: 'pointer', padding: 0 }}>☰</button>
                    
                    {isNavOpen && (
                        <div id="nav-options" className="glass-panel" style={{ display: 'block', position: 'fixed', top: '80px', left: '20px', minWidth: '250px', zIndex: 10000, padding: '1.5rem', border: '2px solid var(--text-primary)' }}>
                            <div className="nav-links-vertical" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {navItems.map(item => (
                                    <a key={item.hash} href={item.hash} className={`nav-link ${currentHash.startsWith(item.hash) ? 'active' : ''}`} style={{ width: '100%' }} onClick={closeAll}>
                                        <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>{item.icon}</span>
                                        {item.text}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <h1 className="logo mb-0" style={{ cursor: 'pointer', fontSize: '2.5rem', margin: 0, textAlign: 'center', flex: 1 }} onClick={() => { window.location.hash = '#dashboard'; closeAll(); }}>
                    Eventify
                </h1>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 1, position: 'relative' }}>
                    <div className="user-profile-sm" style={{ margin: 0, padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={toggleProfile}>
                        <span className={`badge badge-${state.user.role} hide-on-mobile`} style={{ marginRight: '0.5rem' }}>{state.user.role}</span>
                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>{state.user.name.charAt(0).toUpperCase()}</div>
                    </div>
                    
                    {isProfileOpen && (
                        <div id="profile-dropdown" className="glass-panel" style={{ display: 'block', position: 'absolute', top: '100%', right: 0, minWidth: '180px', zIndex: 1000, padding: '0.5rem 0', marginTop: '0.5rem', border: '2px solid var(--text-primary)' }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li><a href="#profile" className="dropdown-item" onClick={closeAll}>👤 View Profile</a></li>
                                <li><hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} /></li>
                                <li><button className="dropdown-item" onClick={() => { logout(); closeAll(); }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 'inherit', cursor: 'pointer', color: 'var(--danger)' }}>🚪 Logout</button></li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
