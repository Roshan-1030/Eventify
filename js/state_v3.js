// State Management
const STATE_KEY = 'eventify_state_v2';
window.state = {
    user: null,
    users: [
        { id: 1, name: 'Admin Account', email: 'admin@college.edu', password: 'admin', role: 'admin', roomId: 'ADM-12345' }
    ],
    events: [
        {
            id: 1, roomId: 'ADM-12345', title: 'Nebula Tech Fest 2026', date: '2026-04-15', time: '10:00 AM', location: 'Main Auditorium', category: 'Technology',
            desc: 'Experience the future of tech. Hackathons, robotics, and AR/VR showcases.', image: 'assets/images/tech_fest.png', attendees: [],
            coordinators: [
                { name: 'Dr. Sarah Wilson', role: 'Head Coordinator' },
                { name: 'Prof. Mark Johnson', role: 'Tech Lead' },
                { name: 'Emily Chen', role: 'Student Volunteer Head' }
            ]
        },
        {
            id: 2, roomId: 'ADM-12345', title: 'Prism Cultural Night', date: '2026-04-20', time: '06:30 PM', location: 'Open Air Theatre', category: 'Cultural',
            desc: 'A vivid celebration of arts, music, and dance featuring top student performers.', image: 'assets/images/cultural.png', attendees: [],
            coordinators: [
                { name: 'Dr. James Miller', role: 'Head Coordinator' },
                { name: 'Alice Wong', role: 'Stage Manager' }
            ]
        },
        {
            id: 3, roomId: 'ADM-12345', title: 'Velocity Sports Meet', date: '2026-04-25', time: '08:00 AM', location: 'University Stadium', category: 'Sports',
            desc: 'Annual track and field events. Show your athleticism under the stadium lights.', image: 'assets/images/sports.png', attendees: [],
            coordinators: [
                { name: 'Coach Robert Taylor', role: 'Head Coordinator' },
                { name: 'Kevin Durant', role: 'Referee Head' }
            ]
        }
    ],
    feedbacks: [],
    folders: [
        { id: 1, roomId: 'ADM-12345', name: 'Main Gallery' }
    ],
    gallery: [
        { id: 1, roomId: 'ADM-12345', folderId: 1, url: 'assets/images/tech_fest.png', title: 'Tech Fest Highlights' },
        { id: 2, roomId: 'ADM-12345', folderId: 1, url: 'assets/images/cultural.png', title: 'Cultural Dance Off' },
        { id: 3, roomId: 'ADM-12345', folderId: 1, url: 'assets/images/sports.png', title: 'Athletics Final 100m' }
    ],
    polls: [
        {
            id: 1, roomId: 'ADM-12345', question: 'Which tech stack should we focus on for the hackathon?',
            options: [
                { id: 1, text: 'Web Development (MERN)', votes: 12 },
                { id: 2, text: 'Artificial Intelligence (Python)', votes: 8 },
                { id: 3, text: 'App Development (React Native)', votes: 5 }
            ],
            votedBy: [] // User IDs
        }
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
            if (e.registrationOpen === undefined) e.registrationOpen = true;
            if (!e.coordinators) {
                e.coordinators = [
                    { name: 'TBD', role: 'Head Coordinator' },
                    { name: 'TBD', role: 'Co-Coordinator' }
                ];
            }
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
    if (!state.polls) state.polls = [];
    state.polls.forEach(p => {
        if (!p.roomId) p.roomId = 'ADM-12345';
        if (!p.votedBy) p.votedBy = [];
    });

    if (!state.groups) state.groups = [];
    state.groups.forEach(g => {
        if (!g.members) g.members = [];
        if (!g.requests) g.requests = [];
        if (!g.messages) g.messages = [];
        if (g.isMuted === undefined) g.isMuted = false;
        if (!g.otherAdmins) g.otherAdmins = [];
    });
};

// Save state to local storage
window.saveState = function () {
    localStorage.setItem(STATE_KEY, JSON.stringify(window.state));
};
