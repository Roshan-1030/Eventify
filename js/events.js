window.renderEvents = function (container) {
    const roomEvents = state.events.filter(e => e.roomId === state.user.roomId);

    container.innerHTML = `
        <h1>Explore & Register</h1>
        <p>Current Room: <strong style="color:var(--primary)">${state.user.roomId}</strong></p>
        <p>Stay updated with the latest happenings in this room.</p>
        
        <div class="grid-cards mt-4">
            ${roomEvents.length === 0 ? '<p class="text-secondary">No events scheduled for this room.</p>' : roomEvents.map(e => {
        const isReg = state.user.role === 'student' && e.attendees.some(a => a.id === state.user.id);
        return createEventCard(e, isReg);
    }).join('')}
        </div>
    `;
}

function createEventCard(event, isRegistered) {
    return `
        <div class="glass-panel event-card" onclick="window.location.hash = '#event-details?id=${event.id}'" style="cursor: pointer;">
            <div class="event-img-container">
                <span class="event-category-badge">${event.category || 'Event'}</span>
                <span class="event-date-badge">📅 ${event.date}</span>
                <img src="${event.image}" alt="${event.title}" class="event-img" onerror="this.src='https://via.placeholder.com/300x180?text=Event'">
            </div>
            <div class="event-details">
                <h3>${event.title}</h3>
                <div class="event-location">📍 ${event.location || 'College Campus'}</div>
                <p class="event-description text-truncate">${event.desc || ''}</p>
                <div class="event-actions" onclick="event.stopPropagation()">
                    ${state.user.role === 'admin' ? `
                        <div class="flex justify-between items-center" style="margin-top: 0.25rem;">
                            <span class="badge ${event.registrationOpen ? 'badge-success' : 'badge-danger'}" style="font-size: 0.75rem; padding: 0.2rem 0.6rem;">
                                ${event.registrationOpen ? '● OPEN' : '● CLOSED'}
                            </span>
                            <span class="badge" style="background: var(--dark); color: white; display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; padding: 0.2rem 0.6rem;">
                                👥 ${(event.attendees || []).length}
                            </span>
                        </div>
                    ` : (isRegistered ? `
                        <button class="btn btn-outline w-100" disabled>✓ Registered</button>
                        <button class="btn btn-danger w-100 mt-2" onclick="unregisterEvent(${event.id})">Cancel Registration</button>
                    ` : (event.registrationOpen ? `
                        <button class="btn btn-primary w-100" onclick="registerEvent(${event.id})">Register Now</button>
                    ` : `
                        <button class="btn btn-outline w-100" disabled style="opacity: 0.6; border-color: var(--danger); color: var(--danger);">Registration Closed</button>
                    `)) }
                </div>
            </div>
        </div>
    `;
}

window.renderEventFullPage = function (container, eventId) {
    const event = state.events.find(e => String(e.id) === String(eventId));
    if (!event) {
        container.innerHTML = `<h1>Event not found</h1><button class="btn btn-primary" onclick="window.location.hash='#events'">Back to Events</button>`;
        return;
    }

    const isRegistered = state.user.role === 'student' && (event.attendees || []).some(a => String(a.id) === String(state.user.id));

    // Default coordinators if none exist
    const coordinators = event.coordinators || [
        { name: 'TBD', role: 'Head Coordinator' },
        { name: 'TBD', role: 'Co-Coordinator' }
    ];

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <button class="btn btn-outline" onclick="window.history.back()">← Back</button>
            <div class="flex gap-2">
                ${state.user.role === 'admin' ? `
                    <button class="btn ${event.registrationOpen ? 'btn-danger' : 'btn-success'}" onclick="window.toggleRegistration(${event.id})">
                        ${event.registrationOpen ? 'End Registration' : 'Open Registration'}
                    </button>
                    <button class="btn btn-primary" onclick="window.openEditEventModal(${event.id})">Edit Event</button>
                    <button class="btn btn-danger" onclick="window.deleteEvent(${event.id})">Delete Event</button>
                ` : (isRegistered ? `
                    <button class="btn btn-danger" onclick="window.unregisterEvent(${event.id})">Cancel Registration</button>
                ` : (event.registrationOpen ? `
                    <button class="btn btn-primary" onclick="window.registerEvent(${event.id})">Register Now</button>
                ` : `
                    <button class="btn btn-outline" disabled style="border-color: var(--danger); color: var(--danger);">Registration Closed</button>
                `))}
            </div>
        </div>

        <div class="event-hero glass-panel" style="padding: 0; overflow: hidden; margin-bottom: 2rem;">
            <div class="hero-image-container" style="width: 100%; height: 400px; overflow: hidden;">
                <img src="${event.image}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.src='https://via.placeholder.com/1200x400?text=Event'">
            </div>
            <div class="hero-text-content" style="padding: 2rem;">
                <div class="modal-badge">${event.category || 'General'}</div>
                <h1 class="responsive-title" style="margin: 0.5rem 0;">${event.title}</h1>
                
                <div class="event-info-grid" style="border-bottom: none; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
                    <div class="info-item">
                        <span class="info-icon">📅</span>
                        <div class="info-text">
                            <label>Date</label>
                            <strong>${event.date}</strong>
                        </div>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">⏰</span>
                        <div class="info-text">
                            <label>Timing</label>
                            <strong>${event.time || 'TBD'}</strong>
                        </div>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">📍</span>
                        <div class="info-text">
                            <label>Venue</label>
                            <strong>${event.location || 'TBD'}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="event-details-layout">
            <div class="glass-panel">
                <h2>About the Event</h2>
                <p style="font-size: 1.1rem; line-height: 1.8;">${event.desc || 'No description provided.'}</p>
                
                <h2 style="margin-top: 2rem;">Event Roles & Coordinators</h2>
                <div class="coordinators-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                    ${coordinators.map(c => `
                        <div class="glass-panel" style="padding: 1.5rem; text-align: center; border: 1px solid var(--border);">
                            <div class="avatar" style="margin: 0 auto 1rem; width: 64px; height: 64px; font-size: 1.5rem;">${c.name.charAt(0)}</div>
                            <h3 style="font-size: 1.1rem; margin-bottom: 0.25rem;">${c.name}</h3>
                            <span class="badge badge-admin" style="font-size: 0.75rem;">${c.role}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="glass-panel">
                <h2>Registration Details</h2>
                <div style="padding: 1.5rem; background: rgba(0,0,0,0.05); border-radius: 12px; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; color: var(--primary);">${event.attendees ? event.attendees.length : 0}</h3>
                    <p style="margin: 0; font-weight: bold;">Participants Registered</p>
                </div>
                
                ${event.instaHandle ? `
                    <div class="glass-panel mb-4" style="padding: 1.25rem; border: 1.5px solid #E1306C; background: rgba(225, 48, 108, 0.05);">
                        <div class="flex items-center gap-3">
                            <span style="font-size: 1.5rem;">📸</span>
                            <div>
                                <h3 style="margin:0; font-size: 1rem; color: #E1306C;">Follow the Event</h3>
                                <a href="${event.instaLink || '#'}" target="_blank" style="text-decoration: none; font-weight: bold; color: var(--text-primary);">${event.instaHandle}</a>
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${isRegistered ? `
                    <div class="glass-panel" style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); padding: 1.5rem;">
                        <span style="color: var(--success); font-weight: 800; font-size: 1.2rem;">✓ You are Registered</span>
                        <p style="margin-top: 0.5rem; font-size: 0.9rem;">Check your email for the confirmation ticket. See you at the event!</p>
                    </div>
                ` : (event.registrationOpen !== false ? `
                    <button class="btn btn-primary w-100" style="padding: 1.5rem;" onclick="window.registerEvent(${event.id})">Register for Event</button>
                    <p class="text-center mt-2" style="font-size: 0.85rem;">Last date to register: ${event.date}</p>
                ` : `
                    <div class="glass-panel text-center" style="background: rgba(239, 68, 68, 0.05); border: 1px solid var(--danger); padding: 1.5rem;">
                        <span style="color: var(--danger); font-weight: 800; font-size: 1.2rem;">Registration Closed</span>
                        <p style="margin-top: 0.5rem; font-size: 0.9rem;">The deadline for this event has passed or the admin has closed registrations.</p>
                    </div>
                `)}
            </div>
        </div>

        <!-- Event Feedback Section -->
        <div class="mt-8">
            <h2 class="mb-4">📣 Event Feedback</h2>
            <div class="grid" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem;">
                <!-- Feedbak Form -->
                <div class="glass-panel" style="padding: 1.5rem;">
                    <h3>Submit Your Review</h3>
                    <p style="font-size: 0.85rem; margin-bottom: 1rem;">Share your experience with <strong>${event.title}</strong></p>
                    <div class="form-group">
                        <textarea id="eventFbContent" class="form-control" rows="4" placeholder="What did you think of the event?"></textarea>
                    </div>
                    <button class="btn btn-primary w-100" onclick="window.submitEventFeedback(${event.id})">Post Feedback</button>
                </div>

                <!-- Feedback List -->
                <div class="glass-panel" style="padding: 1.5rem;">
                    <h3>What others are saying</h3>
                    <div id="event-feedbacks" style="max-height: 400px; overflow-y: auto; margin-top: 1rem;">
                        ${renderEventFeedbacks(event.id)}
                    </div>
                </div>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderEventFeedbacks(eventId) {
    const eventFeedbacks = (state.feedbacks || []).filter(f => String(f.eventId) === String(eventId));
    if (eventFeedbacks.length === 0) return '<p class="text-secondary text-center p-4">No reviews yet. Be the first!</p>';
    
    return eventFeedbacks.map(f => `
        <div style="padding: 1rem; border-bottom: 1px solid var(--border); margin-bottom: 0.5rem; background: rgba(0,0,0,0.02); border-radius: 12px;">
            <div class="flex justify-between items-center mb-2">
                <strong>${f.author}</strong>
                <small class="text-secondary">${new Date(f.date).toLocaleDateString()}</small>
            </div>
            <p style="font-size: 0.9rem; margin: 0; line-height: 1.4;">${f.content}</p>
        </div>
    `).join('');
}

window.submitEventFeedback = function (eventId) {
    const input = document.getElementById('eventFbContent');
    const content = input.value.trim();
    if (!content) return alert('Feedback cannot be empty');

    if (!state.feedbacks) state.feedbacks = [];
    state.feedbacks.unshift({
        id: Date.now(),
        eventId: eventId,
        roomId: state.user.roomId,
        author: state.user.name,
        role: state.user.role,
        content: content,
        date: new Date().toISOString()
    });

    saveState();
    input.value = '';
    window.renderEventFullPage(document.getElementById('main-content'), eventId);
}

window.toggleAddEventModal = function () {
    const el = document.getElementById('add-event-modal');
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'block' : 'none';

    if (el.style.display === 'none') {
        document.getElementById('modal-title').innerText = 'Create New Event';
        document.getElementById('evEditId').value = '';
        document.getElementById('evTitle').value = '';
        document.getElementById('evDate').value = '';
        document.getElementById('evCategory').value = '';
        document.getElementById('evLocation').value = '';
        document.getElementById('evDesc').value = '';
        document.getElementById('evImageFile').value = '';
        document.getElementById('evImageBase64').value = '';
        if (document.getElementById('evInstaHandle')) document.getElementById('evInstaHandle').value = '';
        if (document.getElementById('evInstaLink')) document.getElementById('evInstaLink').value = '';
        const preview = document.getElementById('evImagePreview');
        if (preview) {
            preview.src = '';
            preview.style.display = 'none';
        }
        const errEl = document.getElementById('evError');
        if (errEl) errEl.style.display = 'none';
    }

    if (el.style.display === 'block') el.scrollIntoView({ behavior: "smooth" });
}

window.openEditEventModal = function (eventId) {
    const event = state.events.find(e => e.id === eventId);
    if (!event) return;

    window.toggleAddEventModal();
    document.getElementById('add-event-modal').style.display = 'block';

    document.getElementById('modal-title').innerText = 'Edit Event Details';
    document.getElementById('evEditId').value = event.id;
    document.getElementById('evTitle').value = event.title;
    document.getElementById('evDate').value = event.date;
    document.getElementById('evCategory').value = event.category;
    document.getElementById('evLocation').value = event.location;
    document.getElementById('evDesc').value = event.desc;
    if (document.getElementById('evTime')) {
        document.getElementById('evTime').value = event.time || '';
    }

    // Fill coordinators if fields exist (they will be in the admin dashboard)
    if (document.getElementById('evHeadCoordinator') && event.coordinators) {
        document.getElementById('evHeadCoordinator').value = event.coordinators[0] ? event.coordinators[0].name : '';
        document.getElementById('evOtherRoles').value = event.coordinators.slice(1).map(c => `${c.role}: ${c.name}`).join('\n');
    }

    if (document.getElementById('evInstaHandle')) {
        document.getElementById('evInstaHandle').value = event.instaHandle || '';
        document.getElementById('evInstaLink').value = event.instaLink || '';
    }

    document.getElementById('evImageBase64').value = event.image;

    const preview = document.getElementById('evImagePreview');
    if (event.image) {
        preview.src = event.image;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }

    document.getElementById('add-event-modal').scrollIntoView({ behavior: "smooth" });
}

window.handleEventImageUpload = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600;
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = Math.round((width * MAX_HEIGHT) / height);
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
            document.getElementById('evImageBase64').value = compressedBase64;

            const preview = document.getElementById('evImagePreview');
            preview.src = compressedBase64;
            preview.style.display = 'block';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

window.createEvent = function () {
    const title = document.getElementById('evTitle').value.trim();
    const date = document.getElementById('evDate').value;
    const category = document.getElementById('evCategory').value.trim();
    const location = document.getElementById('evLocation').value.trim() || 'TBD';
    const desc = document.getElementById('evDesc').value.trim();
    const image = document.getElementById('evImageBase64').value || 'assets/images/tech_fest.png';
    const editId = document.getElementById('evEditId').value;
    const errEl = document.getElementById('evError');

    if (!title || !date || !category || !desc) {
        errEl.innerText = "Please fill out all required fields!";
        errEl.style.display = 'block';
        return;
    }

    errEl.style.display = 'none';

    if (editId) {
        const index = state.events.findIndex(e => String(e.id) === String(editId));
        if (index !== -1) {
            const time = document.getElementById('evTime') ? document.getElementById('evTime').value : (state.events[index].time || 'TBD');
            const headCoord = document.getElementById('evHeadCoordinator') ? document.getElementById('evHeadCoordinator').value.trim() : 'TBD';
            const otherRolesRaw = document.getElementById('evOtherRoles') ? document.getElementById('evOtherRoles').value.trim() : '';
            const instaHandle = document.getElementById('evInstaHandle') ? document.getElementById('evInstaHandle').value.trim() : '';
            const instaLink = document.getElementById('evInstaLink') ? document.getElementById('evInstaLink').value.trim() : '';

            const coordinators = [{ name: headCoord, role: 'Head Coordinator' }];
            if (otherRolesRaw) {
                otherRolesRaw.split('\n').forEach(line => {
                    if (line.includes(':')) {
                        const [role, name] = line.split(':');
                        coordinators.push({ role: role.trim(), name: name.trim() });
                    }
                });
            }

            state.events[index] = { ...state.events[index], title, date, category, location, desc, image, time, coordinators, instaHandle, instaLink };
        }
    } else {
        const time = document.getElementById('evTime') ? document.getElementById('evTime').value : 'TBD';
        const headCoord = document.getElementById('evHeadCoordinator') ? document.getElementById('evHeadCoordinator').value.trim() : 'TBD';
        const otherRolesRaw = document.getElementById('evOtherRoles') ? document.getElementById('evOtherRoles').value.trim() : '';
        const instaHandle = document.getElementById('evInstaHandle') ? document.getElementById('evInstaHandle').value.trim() : '';
        const instaLink = document.getElementById('evInstaLink') ? document.getElementById('evInstaLink').value.trim() : '';

        const coordinators = [{ name: headCoord, role: 'Head Coordinator' }];
        if (otherRolesRaw) {
            otherRolesRaw.split('\n').forEach(line => {
                if (line.includes(':')) {
                    const [role, name] = line.split(':');
                    coordinators.push({ role: role.trim(), name: name.trim() });
                }
            });
        }

        state.events.push({
            id: Date.now(),
            roomId: state.user.roomId,
            title, date, category, desc, image, attendees: [], location, time, coordinators, instaHandle, instaLink
        });
    }

    try {
        saveState();
    } catch (err) {
        alert("Storage Limit Reached!");
        if (!editId) state.events.pop();
        return;
    }

    window.toggleAddEventModal();
    router();
}

window.deleteEvent = function (id) {
    if (!confirm("Are you sure you want to delete this event?")) return;
    state.events = state.events.filter(e => String(e.id) !== String(id));
    saveState();
    router();
}

window.registerEvent = function (eventId) {
    const ev = state.events.find(e => String(e.id) === String(eventId));
    if (ev) {
        if (ev.registrationOpen === false) {
            return alert("Sorry, registration for this event is closed.");
        }
        if (!ev.attendees) ev.attendees = [];
        // Check if already registered
        if (ev.attendees.some(a => String(a.id) === String(state.user.id))) {
            return alert("You are already registered for this event.");
        }

        const inputEmail = prompt("Please confirm your email ID to register for this event:", state.user.email);
        if (inputEmail) {
            ev.attendees.push({ id: state.user.id, name: state.user.name, email: inputEmail });
            saveState();
            router();
            alert("Registration successful!");
        }
    }
}

window.unregisterEvent = function (eventId) {
    const ev = state.events.find(e => String(e.id) === String(eventId));
    if (ev) {
        if (!ev.attendees) ev.attendees = [];
        ev.attendees = ev.attendees.filter(a => String(a.id) !== String(state.user.id));
        saveState();
        router();
    }
}

window.toggleRegistration = function (eventId) {
    const ev = state.events.find(e => String(e.id) === String(eventId));
    if (ev) {
        ev.registrationOpen = !ev.registrationOpen;
        saveState();
        router();
        alert(`Registration for ${ev.title} is now ${ev.registrationOpen ? 'OPEN' : 'CLOSED'}`);
    }
}
