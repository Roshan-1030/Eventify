// State Management
const STATE_KEY = 'eventify_state_v2';
window.state = {
    user: null,
    users: [
        { id: 1, name: 'Admin Account', email: 'admin@college.edu', password: 'admin', role: 'admin', roomId: 'ADM-12345' }
    ],
    events: [
        { id: 1, roomId: 'ADM-12345', title: 'Nebula Tech Fest 2026', date: '2026-04-15', location: 'Main Auditorium', category: 'Technology', desc: 'Experience the future of tech. Hackathons, robotics, and AR/VR showcases.', image: 'assets/images/tech_fest.png', attendees: [] },
        { id: 2, roomId: 'ADM-12345', title: 'Prism Cultural Night', date: '2026-04-20', location: 'Open Air Theatre', category: 'Cultural', desc: 'A vivid celebration of arts, music, and dance featuring top student performers.', image: 'assets/images/cultural.png', attendees: [] },
        { id: 3, roomId: 'ADM-12345', title: 'Velocity Sports Meet', date: '2026-04-25', location: 'University Stadium', category: 'Sports', desc: 'Annual track and field events. Show your athleticism under the stadium lights.', image: 'assets/images/sports.png', attendees: [] }
    ],
    feedbacks: [],
    folders: [
        { id: 1, roomId: 'ADM-12345', name: 'Main Gallery' }
    ],
    gallery: [
        { id: 1, roomId: 'ADM-12345', folderId: 1, url: 'assets/images/tech_fest.png', title: 'Tech Fest Highlights' },
        { id: 2, roomId: 'ADM-12345', folderId: 1, url: 'assets/images/cultural.png', title: 'Cultural Dance Off' },
        { id: 3, roomId: 'ADM-12345', folderId: 1, url: 'assets/images/sports.png', title: 'Athletics Final 100m' }
    ]
};

// Load state from local storage
window.loadState = function () {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
            window.state = parsed;
        }
    }

    // --- Data Migration for Room ID feature ---
    if (state.users) {
        state.users.forEach(u => {
            if (u.role === 'admin' && !u.roomId) {
                u.roomId = 'ADM-12345';
            }
        });
    }

    if (state.user && !state.user.roomId) {
        state.user.roomId = 'ADM-12345';
    }

    if (!state.folders) state.folders = [{ id: 1, roomId: 'ADM-12345', name: 'Main Gallery' }];

    if (state.events) {
        state.events.forEach(e => { 
            if (!e.roomId) e.roomId = 'ADM-12345'; 
            if (!e.attendees) e.attendees = [];
        });
    }
    if (state.gallery) {
        state.gallery.forEach(img => {
            if (!img.roomId) img.roomId = 'ADM-12345';
            if (!img.folderId) img.folderId = 1;
        });
    }
    if (state.feedbacks) {
        state.feedbacks.forEach(f => { if (!f.roomId) f.roomId = 'ADM-12345'; });
    }
    if (state.folders) {
        state.folders.forEach(f => { if (!f.roomId) f.roomId = 'ADM-12345'; });
    }
};

// Save state to local storage
window.saveState = function () {
    localStorage.setItem(STATE_KEY, JSON.stringify(window.state));
};
