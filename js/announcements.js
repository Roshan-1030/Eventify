window.renderAnnouncements = function(container) {
    const isStudent = state.user.role === 'student';
    const roomAnnouncements = (state.announcements || []).filter(a => a.roomId === state.user.roomId).sort((a,b) => new Date(b.date) - new Date(a.date));

    let html = `
        <div class="flex justify-between items-start mb-6">
            <div>
                <h1>📢 Announcements</h1>
                <p>Stay updated with the latest news and event reminders.</p>
            </div>
            ${!isStudent ? `<button class="btn btn-primary" onclick="toggleAnnouncementModal()">+ New Announcement</button>` : ''}
        </div>
    `;

    if (roomAnnouncements.length === 0) {
        html += `<div class="glass-panel text-center text-secondary"><p>No announcements yet.</p></div>`;
    } else {
        html += `<div class="grid-cards" style="grid-template-columns: 1fr; gap: 1.5rem;">`;
        roomAnnouncements.forEach(a => {
            html += `
                <div class="glass-panel" style="padding: 1.5rem; border-left: 4px solid var(${a.type === 'reminder' ? '--accent' : '--primary'});">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <span class="badge" style="background: var(${a.type === 'reminder' ? '--accent' : '--primary'}); color: white;">
                                ${a.type === 'reminder' ? '⏰ Reminder' : '📢 General'}
                            </span>
                            <small class="text-secondary">${new Date(a.date).toLocaleString()}</small>
                        </div>
                        ${!isStudent ? `<button class="btn btn-outline" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: var(--danger); border-color: var(--danger);" onclick="deleteAnnouncement(${a.id})">Delete</button>` : ''}
                    </div>
                    <h3 style="margin-bottom: 0.5rem;">${a.title}</h3>
                    <p style="margin-bottom: 0; color: var(--text-primary);">${a.message}</p>
                </div>
            `;
        });
        html += `</div>`;
    }

    if (!isStudent) {
        const roomEvents = state.events.filter(e => e.roomId === state.user.roomId);
        html += `
            <div id="announcement-modal" class="glass-panel" style="display:none; margin-top: 2rem;">
                <h2>Send Announcement / Reminder</h2>
                <div class="form-group mt-4">
                    <label>Message Type</label>
                    <select id="ann-type" class="form-control" onchange="toggleEventSelect()">
                        <option value="general">📢 General Announcement (To All Students)</option>
                        <option value="reminder">⏰ Event Reminder</option>
                    </select>
                </div>
                
                <div class="form-group" id="ann-event-wrapper" style="display:none;">
                    <label>Select Event (Sent to attendees or all)</label>
                    <select id="ann-event" class="form-control">
                        <option value="">-- Choose an Event --</option>
                        ${roomEvents.map(e => `<option value="${e.title}">${e.title} (${(e.attendees || []).length} Attendees)</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Announcement Title</label>
                    <input type="text" id="ann-title" class="form-control" placeholder="e.g. Schedule Change, Don't Forget!">
                </div>

                <div class="form-group">
                    <label>Message</label>
                    <textarea id="ann-message" class="form-control" rows="4" placeholder="Write your message here..."></textarea>
                </div>

                <div class="flex gap-2">
                    <button class="btn btn-primary" onclick="submitAnnouncement()">Send to Room</button>
                    <button class="btn btn-outline" onclick="toggleAnnouncementModal()">Cancel</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
};

window.toggleAnnouncementModal = function() {
    const el = document.getElementById('announcement-modal');
    if(el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
        if(el.style.display === 'block') el.scrollIntoView({behavior: 'smooth'});
    }
}

window.toggleEventSelect = function() {
    const type = document.getElementById('ann-type').value;
    const wrapper = document.getElementById('ann-event-wrapper');
    if (type === 'reminder') {
        wrapper.style.display = 'block';
    } else {
        wrapper.style.display = 'none';
    }
}

window.submitAnnouncement = function() {
    const type = document.getElementById('ann-type').value;
    let title = document.getElementById('ann-title').value;
    const message = document.getElementById('ann-message').value;
    const eventName = document.getElementById('ann-event').value;

    if (!title || !message) {
        alert("Please fill in both title and message.");
        return;
    }

    if (type === 'reminder') {
        if (!eventName) {
            alert("Please select an event for the reminder.");
            return;
        }
        title = `[Reminder: ${eventName}] ` + title;
    }

    if (!state.announcements) state.announcements = [];
    
    state.announcements.push({
        id: Date.now(),
        roomId: state.user.roomId,
        type,
        title,
        message,
        date: new Date().toISOString()
    });

    saveState();
    if(window.router) window.router();
}

window.deleteAnnouncement = function(id) {
    if(!confirm('Delete this announcement?')) return;
    state.announcements = state.announcements.filter(a => a.id !== id);
    saveState();
    if(window.router) window.router();
}
