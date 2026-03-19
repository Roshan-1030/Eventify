
window.renderStudentDashboard = function (container) {
    const roomEvents = state.events.filter(e => e.roomId === state.user.roomId);
    const unregistered = roomEvents.filter(e => !(e.attendees || []).some(a => String(a.id) === String(state.user.id)));
    const registered = roomEvents.filter(e => (e.attendees || []).some(a => String(a.id) === String(state.user.id)));
    const roomStudentsCount = state.users.filter(u => u.role === 'student' && u.roomId === state.user.roomId).length;

    let html = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h1>Welcome Back, ${state.user.name}</h1>
                <p>Room: <span class="badge badge-admin">${state.user.roomId}</span> 
                   <button class="btn btn-sm btn-outline" style="padding: 2px 8px; margin-left: 5px; font-size: 0.7rem;" onclick="shareRoomId('${state.user.roomId}')">🔗 Share</button>
                </p>
                <div class="mt-2">
                    <span class="badge badge-success" style="font-size: 0.9rem;">👥 ${roomStudentsCount} Students in this Room</span>
                </div>
            </div>
        </div>
        
        <h2 class="mt-4">Your Registered Events</h2>
        ${registered.length === 0 ? '<p>You haven\'t registered for any events yet.</p>' : `
            <div class="grid-cards mb-4">
                ${registered.map(e => createEventCard(e, true)).join('')}
            </div>
        `}

        <h2 class="mt-4">Explore More Events</h2>
        <div class="grid-cards mb-4">
            ${unregistered.length === 0 ? '<p class="text-secondary">No other events available in this room.</p>' : unregistered.map(e => createEventCard(e, false)).join('')}
        </div>
        <div class="mt-8 text-center" id="discussion-section">
            <button class="btn btn-primary" style="padding: 1.5rem 3rem; font-size: 1.2rem; border-radius: 20px;" onclick="window.location.hash='#chat'">💬 Open Room Discussion</button>
        </div>
    `;
    container.innerHTML = html;
}


window.renderAdminDashboard = function (container) {
    const roomEvents = state.events.filter(e => e.roomId === state.user.roomId);
    const totalRegistrations = roomEvents.reduce((sum, e) => sum + (e.attendees || []).length, 0);
    const roomStudents = state.users.filter(u => u.role === 'student' && u.roomId === state.user.roomId).length;
    const roomFeedbacks = state.feedbacks.filter(f => f.roomId === state.user.roomId).length;

    let html = `
        <div class="flex justify-between items-center mb-4">
            <div>
                <h1>Admin Command Center</h1>
                <p>Room ID: <strong style="color:var(--primary); font-size:1.2rem;">${state.user.roomId}</strong>
                   <button class="btn btn-sm btn-outline" style="padding: 4px 10px; margin-left: 8px;" onclick="shareRoomId('${state.user.roomId}')">🔗 Share Room</button>
                </p>
                <p class="text-secondary">Share this invitation link with students to let them join your events.</p>
            </div>
            <button class="btn btn-primary" onclick="toggleAddEventModal()">+ Create New Event</button>
        </div>

        <div class="grid-cards mb-4" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
            <div class="glass-panel text-center">
                <h2 style="color: var(--primary); font-size: 2.5rem;">${roomEvents.length}</h2>
                <p style="font-weight:bold;">Events in Room</p>
            </div>
            <div class="glass-panel text-center">
                <h2 style="color: var(--success); font-size: 2.5rem;">${totalRegistrations}</h2>
                <p style="font-weight:bold;">Total Registrations</p>
            </div>
            <div class="glass-panel text-center" style="cursor:pointer; transition:transform 0.2s;" onclick="window.location.hash='#reports'" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                <h2 style="color: var(--accent); font-size: 2.5rem;">${roomStudents}</h2>
                <p style="font-weight:bold;">Room Students</p>
                <small class="text-secondary" style="font-size:0.75rem;">Click to View Full Report</small>
            </div>
            <div class="glass-panel text-center" style="cursor:pointer; transition:transform 0.2s;" onclick="window.location.hash='#feedback'" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                <h2 style="font-size: 2.5rem;">${roomFeedbacks}</h2>
                <p style="font-weight:bold;">Room Feedback</p>
                <small class="text-secondary" style="font-size:0.75rem;">Click to View</small>
            </div>
        </div>

        <div class="grid-cards mb-4">
            ${roomEvents.length === 0 ? '<p class="text-secondary">No events created in this room yet.</p>' : roomEvents.map(e => createEventCard(e, false)).join('')}
        </div>

        <div class="mt-8 text-center" id="discussion-section">
            <button class="btn btn-primary" style="padding: 1rem 2rem;" onclick="window.location.hash='#chat'">💬 Open Room Discussion</button>
        </div>
        
        <div id="attendees-modal" style="display:none; margin-top: 2rem;"></div>
        <div id="add-event-modal" style="display:none; margin-top: 2rem;" class="glass-panel">
            <h2 id="modal-title">Create New Event</h2>
            <input type="hidden" id="evEditId">
            <div id="evError" style="color: var(--danger); font-weight: 600; margin-bottom: 1rem; display:none; padding: 0.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px;"></div>
            
            <div class="form-group mt-2">
                <label>Event Title <span style="color: var(--danger);">*</span></label>
                <input type="text" id="evTitle" class="form-control" placeholder="e.g. AI Symposium">
            </div>
            <div class="flex gap-4">
                <div class="form-group flex-1 w-100">
                    <label>Date <span style="color: var(--danger);">*</span></label>
                    <input type="date" id="evDate" class="form-control">
                </div>
                <div class="form-group flex-1 w-100">
                    <label>Category <span style="color: var(--danger);">*</span></label>
                    <input type="text" id="evCategory" class="form-control" placeholder="Technology, Sports...">
                </div>
            </div>
            <div class="flex gap-4">
                <div class="form-group flex-1 w-100">
                    <label>Time <span style="color: var(--danger);">*</span></label>
                    <input type="text" id="evTime" class="form-control" placeholder="e.g. 10:00 AM">
                </div>
                <div class="form-group flex-1 w-100">
                    <label>Location</label>
                    <input type="text" id="evLocation" class="form-control" placeholder="e.g. Main Auditorium">
                </div>
            </div>
            <div class="form-group">
                <label>Description <span style="color: var(--danger);">*</span></label>
                <textarea id="evDesc" class="form-control" rows="3"></textarea>
            </div>
            <div class="form-group flex gap-4">
                <div class="form-group flex-1 w-100">
                    <label>Head Coordinator <span style="color: var(--danger);">*</span></label>
                    <input type="text" id="evHeadCoordinator" class="form-control" placeholder="e.g. Dr. Sarah Wilson">
                </div>
                <div class="form-group flex-1 w-100">
                    <label>Other Roles (Role: Name)</label>
                    <textarea id="evOtherRoles" class="form-control" rows="2" placeholder="Tech Lead: Mark Johnson&#10;Stage Manager: Alice Wong"></textarea>
                </div>
            </div>
            <div class="form-group flex gap-4">
                <div class="form-group flex-1 w-100">
                    <label>Instagram Handle (e.g. @nebula_fest)</label>
                    <input type="text" id="evInstaHandle" class="form-control" placeholder="@account_name">
                </div>
                <div class="form-group flex-1 w-100">
                    <label>Instagram Profile URL</label>
                    <input type="url" id="evInstaLink" class="form-control" placeholder="https://instagram.com/...">
                </div>
            </div>
            <div class="form-group">
                <label>Event Image</label>
                <div class="flex flex-col gap-2">
                    <input type="file" id="evImageFile" class="form-control" accept="image/*" onchange="handleEventImageUpload(event)">
                    <img id="evImagePreview" src="" style="display:none; max-width: 200px; border-radius: 8px; border: 1px solid var(--border);">
                    <input type="hidden" id="evImageBase64">
                </div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-primary" onclick="window.createEvent()">Save Event</button>
                <button class="btn btn-outline" onclick="toggleAddEventModal()">Cancel</button>
            </div>
        </div>
    `;
    container.innerHTML = html;
}
window.saveEvent = function () {
    const title = document.getElementById("evTitle").value.trim();
    const date = document.getElementById("evDate").value;
    const category = document.getElementById("evCategory").value.trim();
    const time = document.getElementById("evTime").value.trim();
    const location = document.getElementById("evLocation").value.trim();
    const headCoord = document.getElementById("evHeadCoordinator").value.trim();
    const otherRolesRaw = document.getElementById("evOtherRoles").value.trim();
    const desc = document.getElementById("evDesc").value.trim();
    const image = document.getElementById("evImageBase64").value;

    const err = document.getElementById("evError");

    if (!title || !date || !category || !time || !headCoord || !desc) {
        err.style.display = "block";
        err.innerText = "Please fill all required fields!";
        return;
    } else {
        err.style.display = "none";
    }

    const instaHandle = document.getElementById("evInstaHandle") ? document.getElementById("evInstaHandle").value.trim() : "";
    const instaLink = document.getElementById("evInstaLink") ? document.getElementById("evInstaLink").value.trim() : "";

    const newEvent = {
        id: Date.now(),
        title,
        date,
        category,
        time,
        location,
        description: desc,
        desc: desc, // Ensure both property variants are set for safety
        headCoordinator: headCoord,
        coordinators: [{ name: headCoord, role: 'Head Coordinator' }],
        image: image || "https://via.placeholder.com/300x180?text=Event",
        roomId: state.user.roomId,
        attendees: [],
        instaHandle,
        instaLink
    };

    if (otherRolesRaw) {
        otherRolesRaw.split('\n').forEach(line => {
            if (line.includes(':')) {
                const [role, name] = line.split(':');
                newEvent.coordinators.push({ role: role.trim(), name: name.trim() });
            }
        });
    }

    state.events.push(newEvent);
    localStorage.setItem("events", JSON.stringify(state.events));

    alert("✅ Event Created Successfully!");

    // clear form
    document.getElementById("evTitle").value = "";
    document.getElementById("evDate").value = "";
    document.getElementById("evCategory").value = "";
    document.getElementById("evTime").value = "";
    document.getElementById("evLocation").value = "";
    document.getElementById("evHeadCoordinator").value = "";
    document.getElementById("evOtherRoles").value = "";
    document.getElementById("evDesc").value = "";
    if (document.getElementById("evInstaHandle")) document.getElementById("evInstaHandle").value = "";
    if (document.getElementById("evInstaLink")) document.getElementById("evInstaLink").value = "";
    document.getElementById("evImageBase64").value = "";
    document.getElementById("evImagePreview").style.display = "none";

    toggleAddEventModal();
    if (window.router) window.router();
    else renderAdminDashboard(document.getElementById("main-content"));
};
