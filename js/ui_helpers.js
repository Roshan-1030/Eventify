window.renderHeader = function () {
    const navItems = [
        { hash: '#dashboard', icon: '🏠', text: 'Home' },
        { hash: '#announcements', icon: '📢', text: 'Announcements' },
        { hash: '#polls', icon: '📊', text: 'Polls' },
        { hash: '#groups', icon: '👥', text: 'Groups' },
        ...(state.user.role === 'admin' ? [{ hash: '#reports', icon: '📈', text: 'Reports' }] : [])
    ];

    const currentHash = window.location.hash;

    const navHtml = navItems.map(item => `
        <li style="margin: 0.5rem 0;">
            <a href="${item.hash}" class="nav-link ${currentHash === item.hash ? 'active' : ''}" style="justify-content: flex-start;" onclick="closeNavOptions()">
                <span style="font-size: 1.25rem; margin-right: 0.5rem;">${item.icon}</span>
                ${item.text}
            </a>
        </li>
    `).join('');

    return `
        <header class="glass-panel" style="border-radius:0; width: 100%; position: sticky; top: 0; z-index: 100; padding: 1rem 2rem; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; position: relative;">
                <div style="flex:1; display: flex; align-items: center; position: relative;">
                    <button class="btn" onclick="toggleNavOptions(event)" style="background: transparent; border: none; font-size: 2rem; color: var(--text-primary); cursor: pointer; padding: 0;" title="Open Menu">☰</button>
                    
                    <div id="nav-options" class="glass-panel" style="display: none; position: fixed; top: 80px; left: 20px; min-width: 250px; z-index: 10000; padding: 1.5rem; border: 2px solid var(--text-primary);">
                        <div class="nav-links-vertical" style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${navItems.map(item => `
                                <a href="${item.hash}" class="nav-link ${currentHash === item.hash ? 'active' : ''}" style="width: 100%;" onclick="closeNavOptions()">
                                    <span style="font-size: 1.25rem; margin-right: 0.75rem;">${item.icon}</span>
                                    ${item.text}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <h1 class="logo mb-0" style="cursor: pointer; font-size: 2.5rem; margin: 0; text-align: center; flex:1;" onclick="window.location.hash='#dashboard'; closeNavOptions();" title="Return to Dashboard">Eventify</h1>
                <div style="display: flex; justify-content: flex-end; align-items: center; flex:1; position: relative;">
                    <div class="user-profile-sm" style="margin:0; padding: 0.25rem 0.5rem; display:flex; align-items:center; border:none; background:transparent; cursor: pointer;" onclick="toggleProfileMenu(event)">
                        <span class="badge badge-${state.user.role} hide-on-mobile" style="margin-right:0.5rem;">${state.user.role}</span>
                        <div class="avatar" style="width: 32px; height: 32px; font-size: 1rem;">${state.user.name.charAt(0).toUpperCase()}</div>
                    </div>
                    
                    <div id="profile-dropdown" class="glass-panel" style="display: none; position: absolute; top: 100%; right: 0; min-width: 180px; z-index: 1000; padding: 0.5rem 0; margin-top: 0.5rem; border: 2px solid var(--text-primary);">
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li><a href="#profile" class="dropdown-item" onclick="closeProfileMenu()">👤 view Profile</a></li>
                            <li><hr style="border: 0; border-top: 1px solid var(--border); margin: 0.5rem 0;"></li>
                            <li><button class="dropdown-item" onclick="handleLogout()" style="width: 100%; text-align: left; background: none; border: none; font-family: inherit; font-size: inherit; cursor: pointer; color: var(--danger);">🚪 Logout</button></li>
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    `;
}

window.toggleNavOptions = function (event) {
    if (event) event.stopPropagation();
    const el = document.getElementById('nav-options');
    if (!el) return;
    
    // Close other menus
    const profileOptions = document.getElementById('profile-dropdown');
    if (profileOptions) profileOptions.style.display = 'none';

    const isHidden = el.style.display === 'none' || el.style.display === '';
    el.style.display = isHidden ? 'block' : 'none';
}

window.closeNavOptions = function () {
    const el = document.getElementById('nav-options');
    if (el) el.style.display = 'none';
}

window.renderRegistrationReport = function (container) {
    if (state.user.role !== 'admin') {
        container.innerHTML = `<h1>Access Denied</h1><p>Only administrators can view room reports.</p>`;
        return;
    }

    const students = state.users.filter(u => u.role === 'student' && u.roomId === state.user.roomId);
    const studentReport = students.map(s => {
        const registeredEvents = state.events.filter(e => e.roomId === state.user.roomId && (e.attendees || []).some(a => String(a.id) === String(s.id)));
        return { ...s, registeredEvents };
    });

    const totalRoomRegistrations = state.events.filter(e => e.roomId === state.user.roomId).reduce((sum, e) => sum + (e.attendees || []).length, 0);

    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <div>
                <h1>Room Registration Report</h1>
                <p>Comprehensive activity overview for Room: <strong style="color:var(--primary)">${state.user.roomId}</strong></p>
            </div>
            <button class="btn btn-outline" onclick="window.location.hash='#dashboard'">← Back to Dashboard</button>
        </div>

        <div class="grid-cards mb-4" style="grid-template-columns: repeat(2, 1fr); gap: 1rem;">
            <div class="glass-panel text-center">
                <h3 style="font-size: 2rem; color: var(--accent);">${students.length}</h3>
                <p style="font-weight: bold; margin-bottom: 0;">Total Students Enrolled</p>
            </div>
            <div class="glass-panel text-center">
                <h3 style="font-size: 2rem; color: var(--primary);">${totalRoomRegistrations}</h3>
                <p style="font-weight: bold; margin-bottom: 0;">Total Registrations</p>
            </div>
        </div>

        <div class="glass-panel" id="student-report-panel">
            <div class="flex justify-between items-center mb-4">
                <h2 style="margin:0;">Student Activity Breakdown</h2>
                <button class="btn btn-primary" data-html2canvas-ignore="true" onclick="window.exportStudentListPDF()">📄 Export to PDF</button>
            </div>
            <div class="table-container">
                <table style="width: 100%; min-width: 800px;">
                    <thead>
                        <tr>
                            <th>Student Details</th>
                            <th>Current Profile</th>
                            <th>Registered Events</th>
                            <th class="text-center">Total Count</th>
                            <th class="text-right" data-html2canvas-ignore="true">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentReport.length === 0 ? '<tr><td colspan="5" class="text-center" style="padding: 2rem; color: var(--text-secondary);">No students registered in this room yet.</td></tr>' : studentReport.map(s => `
                            <tr>
                                <td>
                                    <div style="font-weight: 800; font-size: 1.1rem;">${s.name}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${s.email || 'N/A'}</div>
                                </td>
                                <td>
                                    <div style="font-weight: bold;">${s.branch || 'N/A'}</div>
                                    <div style="font-size: 0.8rem;">${s.year || 'N/A'} Year</div>
                                </td>
                                <td>
                                    ${s.registeredEvents.length > 0 
                                        ? s.registeredEvents.map(e => `<span class="badge badge-student" style="font-size:0.7rem; margin-right:4px;">${e.title}</span>`).join('') 
                                        : '<span style="color:var(--text-secondary); font-style: italic;">No registrations</span>'}
                                </td>
                                <td class="text-center">
                                    <span class="badge" style="background: var(--text-primary); color: white; font-size: 1rem; padding: 0.4rem 0.8rem;">${s.registeredEvents.length}</span>
                                </td>
                                <td class="text-right" data-html2canvas-ignore="true">
                                    <button class="btn btn-outline" style="border-color: var(--danger); color: var(--danger); padding: 0.3rem 0.8rem; font-size: 0.8rem;" onclick="removeStudentFromRoom(${s.id})">Remove</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
        </div>
    `;
}

window.exportStudentListPDF = function() {
    if (typeof html2pdf === 'undefined') {
        alert('PDF library is loading or failed to load. Please check your connection.');
        return;
    }
    
    // Generate a sleek, clean HTML structure exclusively for the PDF
    const students = state.users.filter(u => u.role === 'student' && u.roomId === state.user.roomId);
    
    const printContainer = document.createElement('div');
    printContainer.style.padding = '2rem';
    printContainer.style.background = '#ffffff';
    printContainer.style.color = '#0f172a';
    printContainer.style.fontFamily = 'Inter, sans-serif';
    
    printContainer.innerHTML = `
        <h1 style="text-align: center; margin-bottom: 2rem;">Student Directory - Room ${state.user.roomId}</h1>
        <table style="width: 100%; border-collapse: collapse; margin: 0 auto; text-align: left;">
            <thead>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                    <th style="padding: 1rem;">Student Name</th>
                    <th style="padding: 1rem;">Email Address</th>
                </tr>
            </thead>
            <tbody>
                ${students.length === 0 ? '<tr><td colspan="2" style="padding: 2rem; text-align: center;">No students available.</td></tr>' : students.map((s, idx) => `
                    <tr style="border-bottom: 1px solid #f1f5f9; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                        <td style="padding: 1rem; font-weight: bold;">${s.name}</td>
                        <td style="padding: 1rem; color: #475569;">${s.email || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p style="text-align: center; margin-top: 2rem; color: #64748b; font-size: 0.8rem;">Generated by Eventify | Total Students: ${students.length}</p>
    `;

    // Append temporarily off-screen so html2canvas can read it accurately
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    document.body.appendChild(printContainer);

    const opt = {
        margin:       0.5,
        filename:     'Student_Directory_' + state.user.roomId + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(printContainer).save().then(() => {
        document.body.removeChild(printContainer);
    });
}

window.removeStudentFromRoom = function (studentId) {
    if (!confirm('Are you sure you want to remove this student from the room? Their event registrations will also be completely cleared.')) return;
    
    // Remove the student's association with the room
    const userIndex = state.users.findIndex(u => u.id === studentId);
    if (userIndex !== -1) {
        state.users.splice(userIndex, 1);
    }
    
    // Remove the student from all events in the room
    if (state.events) {
        state.events.forEach(e => {
            if (e.roomId === state.user.roomId) {
                e.attendees = (e.attendees || []).filter(a => String(a.id) !== String(studentId));
            }
        });
    }
    
    // Save and refresh
    saveState();
    if (window.router) window.router();
}

window.renderUserProfile = function (container, userId) {
    let u = state.user;
    if (userId) {
        const found = state.users.find(usr => String(usr.id) === String(userId));
        if (found) u = found;
    }
    const isStudent = u.role === 'student';
    
    // Calculate some stats
    const enrolledEvents = state.events.filter(e => (e.attendees || []).some(a => String(a.id) === String(u.id))).length;
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h1>User Profile</h1>
            <button class="btn btn-outline" onclick="window.history.back()">← Back</button>
        </div>

        <div style="max-width: 800px; margin: 0 auto;">
            <div class="glass-panel" style="display: flex; gap: 2rem; align-items: flex-start; border: 2px solid var(--text-primary);">
                <div class="avatar" style="width: 120px; height: 120px; font-size: 3rem; border: 4px solid var(--primary); flex-shrink: 0;">
                    ${u.name.charAt(0).toUpperCase()}
                </div>
                
                <div style="flex: 1;">
                    <div class="flex items-center gap-2 mb-2">
                        <h2 style="margin:0; font-size: 2rem;">${u.name}</h2>
                        <span class="badge badge-${u.role}" style="font-size: 1rem;">${u.role.toUpperCase()}</span>
                    </div>
                    <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 1.5rem;">${u.email}</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary);">Room Identification</label>
                            <div style="font-size: 1.2rem; font-weight: 700;">${u.roomId}</div>
                        </div>
                        ${isStudent ? `
                            <div>
                                <label style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary);">Academic Details</label>
                                <div style="font-size: 1.2rem; font-weight: 700;">${u.branch} | ${u.year} Year</div>
                            </div>
                        ` : `
                            <div>
                                <label style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary);">Administrator Access</label>
                                <div style="font-size: 1.2rem; font-weight: 700; color: var(--primary);">Full Control Enabled</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
            
            <div class="grid-cards mt-4" style="grid-template-columns: repeat(2, 1fr);">
                <div class="glass-panel text-center">
                    <h3 style="font-size: 2.5rem; color: var(--accent);">${enrolledEvents}</h3>
                    <p style="font-weight: bold;">Events Connected</p>
                </div>
                <div class="glass-panel text-center">
                    <h3 style="font-size: 2.5rem; color: var(--primary);">Active</h3>
                    <p style="font-weight: bold;">Account Status</p>
                </div>
            </div>
        </div>
    `;
}

window.viewAttendees = function (eventId) {
    const event = state.events.find(e => e.id === eventId);
    const container = document.getElementById('attendees-modal');
    if (!container) return;
    container.style.display = 'block';

    container.innerHTML = `
        <div class="glass-panel">
            <div class="flex justify-between items-center mb-2">
                <h2>Attendees for: ${event.title}</h2>
                <button class="btn btn-outline" onclick="document.getElementById('attendees-modal').style.display='none'">Close</button>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Name</th><th>Email</th><th>ID</th></tr></thead>
                    <tbody>${(event.attendees || []).map(a => `<tr><td>${a.name}</td><td>${a.email}</td><td>#EVT${a.id.toString().slice(-4)}</td></tr>`).join('')}</tbody>
                </table>
            </div>
        </div>
    `;
    container.scrollIntoView({ behavior: "smooth" });
}

window.shareRoomId = function (id) {
    const shareLink = `${window.location.origin}${window.location.pathname}#login?room=${id}`;
    navigator.clipboard.writeText(shareLink).then(() => {
        alert(`Invitation link copied to clipboard!\n\nStudents using this link will have Room ID ${id} pre-filled.`);
    });
}

window.toggleProfileMenu = function (event) {
    if (event) event.stopPropagation();
    const el = document.getElementById('profile-dropdown');
    if (!el) return;
    const isHidden = el.style.display === 'none';
    
    // Close other menus
    const navOptions = document.getElementById('nav-options');
    if (navOptions) {
        navOptions.style.display = 'none';
        navOptions.style.opacity = '0';
    }
    
    el.style.display = isHidden ? 'block' : 'none';
}

window.closeProfileMenu = function () {
    const el = document.getElementById('profile-dropdown');
    if (el) el.style.display = 'none';
}

// Global click listener to close dropdowns
window.addEventListener('click', function(e) {
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileDropdown && !profileDropdown.contains(e.target)) {
        profileDropdown.style.display = 'none';
    }
    const navOptions = document.getElementById('nav-options');
    if (navOptions && !navOptions.contains(e.target)) {
        navOptions.style.display = 'none';
    }
});
