import React, { createContext, useContext, useState, useEffect } from 'react';

const STATE_KEY = 'eventify_state_react_v1';
import { db } from '../firebase/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const initialState = {
    user: null,
    users: [],
    events: [],
    feedbacks: [],
    folders: [],
    gallery: [],
    announcements: [],
    chats: [],
    polls: [],
    groups: [],
    payments: [],
    contactInfo: {
        email: 'support@eventify.edu',
        phone: '+91 98765 43210',
        address: 'Academic Block-A, University Campus',
        instagram: '@eventify_official',
        twitter: '@eventify_org'
    },
    theme: 'light'
};

const StateContext = createContext();

export const StateProvider = ({ children }) => {
    const [state, setState] = useState(() => {
        try {
            const saved = localStorage.getItem(STATE_KEY);
            if (!saved) return initialState;

            const parsed = JSON.parse(saved);
            
            // 🔥 Robust Deep Merge of Initial State
            const merged = { ...initialState, ...parsed };

            // Sanitize user object to prevent missing name crashes
            if (merged.user) {
                if (!merged.user.name) {
                    merged.user.name = merged.user.email ? merged.user.email.split('@')[0] : 'User';
                }
            }

            // Ensure specific arrays remain arrays
            ['announcements', 'chats', 'polls', 'groups', 'payments', 'feedbacks', 'events', 'users'].forEach(key => {
                if (!Array.isArray(merged[key])) merged[key] = initialState[key];
            });

            return merged;
        } catch (e) {
            console.error("🔥 State corruption detected, resetting to defaults:", e);
            localStorage.removeItem(STATE_KEY);
            return initialState;
        }
    });

    useEffect(() => {
        const unsubscribes = [];

        const subscribe = (colName, key) => {
            const unsub = onSnapshot(collection(db, colName), (snapshot) => {
                const items = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { 
                        ...data, 
                        id: doc.id, 
                        _id: data.id || doc.id,
                        roomId: data.roomId || data.room_id // normalization
                    };
                });

                setState(prev => {
                    if (items.length === 0 && initialState[key] && initialState[key].length > 0) {
                        return { ...prev, [key]: initialState[key] };
                    }
                    return { ...prev, [key]: items };
                });
            }, err => console.error(`Sync error on ${colName}:`, err));
            unsubscribes.push(unsub);
        };

        subscribe("events", "events");
        subscribe("announcements", "announcements");
        subscribe("polls", "polls");
        subscribe("chats", "chats");
        subscribe("feedbacks", "feedbacks");
        subscribe("groups", "groups");
        subscribe("profiles", "users");
        subscribe("payments", "payments");
        subscribe("folders", "folders");
        subscribe("gallery", "gallery");

        return () => unsubscribes.forEach(fn => fn());
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STATE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn("Storage quota exceeded. Using in-memory state only.");
        }
    }, [state]);

    const login = (user) => {
        if (user && !user.name) {
            user.name = user.email ? user.email.split('@')[0] : 'User';
        }
        setState(prev => ({ ...prev, user }));
    };

    const logout = () => setState(prev => ({ ...prev, user: null }));
    
    const updateEvents = (newEvents) => setState(prev => ({ ...prev, events: newEvents }));
    const updateUsers = (newUsers) => setState(prev => ({ ...prev, users: newUsers }));
    const addFeedback = (fb) => setState(prev => ({ ...prev, feedbacks: [...prev.feedbacks, fb] }));
    const addAnnouncement = (ann) => setState(prev => ({ ...prev, announcements: [...prev.announcements, ann] }));
    const addChat = (chat) => setState(prev => ({ ...prev, chats: [...prev.chats, chat] }));
    const toggleTheme = () => setState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', state.theme || 'light');
    }, [state.theme]);
    
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
            addChat, 
            toggleTheme 
        }}>
            {children}
        </StateContext.Provider>
    );
};

export const useAppState = () => useContext(StateContext);
