import React, { createContext, useContext, useState, useEffect } from 'react';

const STATE_KEY = 'eventify_state_react_v1';
import { db } from '../firebase/firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';

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
    
    const [selectedProfileUser, setSelectedProfileUser] = useState(null);

    const openUserProfile = async (userOrIdentifier) => {
        if (!userOrIdentifier) return;

        let target = null;
        let identifierStr = '';

        if (typeof userOrIdentifier === 'object') {
            target = { ...userOrIdentifier };
            identifierStr = target.id || target.userId || target.email || target.name || '';
        } else {
            identifierStr = String(userOrIdentifier).trim();
            target = { name: identifierStr };
        }

        // Try matching in state.users (populated via profiles listener)
        const match = (state.users || []).find(u => 
            (target.id && String(u.id) === String(target.id)) ||
            (target.userId && String(u.id) === String(target.userId)) ||
            (target.email && u.email && u.email.toLowerCase() === target.email.toLowerCase()) ||
            (target.name && u.name && u.name.toLowerCase() === target.name.toLowerCase()) ||
            (identifierStr && (String(u.id) === identifierStr || (u.name && u.name.toLowerCase() === identifierStr.toLowerCase()) || (u.email && u.email.toLowerCase() === identifierStr.toLowerCase())))
        );

        // If current logged-in user is viewing themselves
        const isSelf = state.user && (
            (target.id && String(state.user.id) === String(target.id)) ||
            (target.userId && String(state.user.id) === String(target.userId)) ||
            (target.email && state.user.email && state.user.email.toLowerCase() === target.email.toLowerCase()) ||
            (target.name && state.user.name && state.user.name.toLowerCase() === target.name.toLowerCase()) ||
            (identifierStr && (state.user.id === identifierStr || state.user.name.toLowerCase() === identifierStr.toLowerCase()))
        );

        const merged = {
            ...target,
            ...(match || {}),
            ...(isSelf ? state.user : {})
        };

        setSelectedProfileUser(merged);

        // Also attempt a direct fetch from Firestore if missing phone or details and we have an id
        const lookupId = merged.id || merged.userId;
        if (lookupId && (!merged.phone || !merged.email)) {
            try {
                const snap = await getDoc(doc(db, "profiles", String(lookupId)));
                if (snap.exists()) {
                    const fresh = snap.data();
                    setSelectedProfileUser(prev => prev && (prev.id === lookupId || prev.userId === lookupId) ? { ...prev, ...fresh } : prev);
                }
            } catch (e) {
                console.debug("Background profile fetch:", e);
            }
        }
    };

    const closeUserProfile = () => setSelectedProfileUser(null);

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
            toggleTheme,
            selectedProfileUser,
            openUserProfile,
            closeUserProfile
        }}>
            {children}
        </StateContext.Provider>
    );
};

export const useAppState = () => useContext(StateContext);
