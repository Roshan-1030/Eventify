import React, { createContext, useContext, useState, useEffect } from 'react';

const STATE_KEY = 'eventify_state_react_v1';

const initialState = {
    user: null,
    users: [
        { id: 1, name: 'Admin Account', email: 'admin@college.edu', password: 'admin', role: 'admin', roomId: 'ADM-12345' }
    ],
    events: [
        { id: 1, roomId: 'ADM-12345', title: 'Nebula Tech Fest 2026', date: '2026-04-15', location: 'Main Auditorium', category: 'Technology', desc: 'Experience the future of tech. Hackathons, robotics, and AR/VR showcases.', image: '/assets/images/tech_fest.png', attendees: [] },
        { id: 2, roomId: 'ADM-12345', title: 'Prism Cultural Night', date: '2026-04-20', location: 'Open Air Theatre', category: 'Cultural', desc: 'A vivid celebration of arts, music, and dance featuring top student performers.', image: '/assets/images/cultural.png', attendees: [] },
        { id: 3, roomId: 'ADM-12345', title: 'Velocity Sports Meet', date: '2026-04-25', location: 'University Stadium', category: 'Sports', desc: 'Annual track and field events. Show your athleticism under the stadium lights.', image: '/assets/images/sports.png', attendees: [] }
    ],
    feedbacks: [],
    folders: [
        { id: 1, roomId: 'ADM-12345', name: 'Main Gallery' }
    ],
    gallery: [
        { id: 1, roomId: 'ADM-12345', folderId: 1, url: '/assets/images/tech_fest.png', title: 'Tech Fest Highlights' },
        { id: 2, roomId: 'ADM-12345', folderId: 1, url: '/assets/images/cultural.png', title: 'Cultural Dance Off' },
        { id: 3, roomId: 'ADM-12345', folderId: 1, url: '/assets/images/sports.png', title: 'Athletics Final 100m' }
    ],
    announcements: [],
    chats: [],
    polls: [],
    groups: [],
    contactInfo: {
        email: 'support@eventify.edu',
        phone: '+91 98765 43210',
        address: 'Academic Block-A, University Campus, New Delhi',
        instagram: '@eventify_official',
        twitter: '@eventify_org'
    }
};

const StateContext = createContext();

export const StateProvider = ({ children }) => {
    const [state, setState] = useState(() => {
        const saved = localStorage.getItem(STATE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Simple migration / validation
                if (!parsed.announcements) parsed.announcements = [];
                if (!parsed.chats) parsed.chats = [];
                if (!parsed.polls) parsed.polls = [];
                if (!parsed.groups) parsed.groups = [];
                return parsed;
            } catch (e) {
                console.error("Failed to parse state", e);
            }
        }
        return initialState;
    });

    useEffect(() => {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
    }, [state]);

    const login = (user) => setState(prev => ({ ...prev, user }));
    const logout = () => setState(prev => ({ ...prev, user: null }));
    
    const updateEvents = (newEvents) => setState(prev => ({ ...prev, events: newEvents }));
    const updateUsers = (newUsers) => setState(prev => ({ ...prev, users: newUsers }));
    const addFeedback = (fb) => setState(prev => ({ ...prev, feedbacks: [...prev.feedbacks, fb] }));
    const addAnnouncement = (ann) => setState(prev => ({ ...prev, announcements: [...prev.announcements, ann] }));
    const addChat = (chat) => setState(prev => ({ ...prev, chats: [...prev.chats, chat] }));
    
    return (
        <StateContext.Provider value={{ 
            state, 
            setState, 
            login, 
            logout, 
            updateEvents, 
            updateUsers,
            addFeedback,
            addAnnouncement,
            addChat
        }}>
            {children}
        </StateContext.Provider>
    );
};

export const useAppState = () => useContext(StateContext);
