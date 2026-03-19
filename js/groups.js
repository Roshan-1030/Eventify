window.renderGroups = function (container) {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1]);
    const groupId = params.get('id');

    if (groupId) {
        renderGroupDetailsView(container, groupId);
        return;
    }

    const roomGroups = (state.groups || []).filter(g => g.roomId === state.user.roomId);

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h1>Groups </h1>
            ${state.user.role === 'admin' ? `<button class="btn btn-primary" onclick="window.toggleCreateGroupModal()">+ Create New Group</button>` : ''}
        </div>
        
        <div class="grid-cards mt-4">
            ${roomGroups.length === 0 ? '<p class="text-secondary">No groups found in this room.</p>' : roomGroups.map(g => `
                <div class="glass-panel group-card" style="padding: 1.5rem; border: 1px solid var(--border); cursor: pointer;" onclick="window.location.hash='#groups?id=${g.id}'">
                    <div style="display: flex; gap: 1rem; align-items: start;">
                        <div class="avatar" style="width: 50px; height: 50px; font-size: 1.2rem; background: var(--primary); color: white;">${g.name.charAt(0)}</div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0; font-size: 1.25rem;">${g.name}</h3>
                            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${g.members.length} Members</p>
                            <p style="font-size: 0.9rem; line-height: 1.4; opacity: 0.8;">${g.description || 'No description'}</p>
                        </div>
                    </div>
                    <div class="mt-4 flex gap-2">
                        ${renderGroupActionButton(g)}
                    </div>
                </div>
            `).join('')}
        </div>

        <div id="create-group-modal" style="display:none;" class="glass-panel mt-6">
            <h2>Create New Group</h2>
            <div class="form-group mt-2">
                <label>Group Name</label>
                <input type="text" id="groupName" class="form-control" placeholder="e.g. Coding Club">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="groupDesc" class="form-control" rows="3" placeholder="What is this group about?"></textarea>
            </div>
            <div class="flex gap-2">
                <button class="btn btn-primary" onclick="window.saveGroup()">Create Group</button>
                <button class="btn btn-outline" onclick="window.toggleCreateGroupModal()">Cancel</button>
            </div>
        </div>
    `;
}

function renderGroupActionButton(group) {
    const isMember = group.members.some(m => String(m.id) === String(state.user.id));
    const hasRequested = group.requests && group.requests.some(m => String(m.id) === String(state.user.id));
    const isGroupAdmin = state.user.role === 'admin' || (group.otherAdmins || []).includes(state.user.id);

    if (isGroupAdmin) return '';
    if (isMember) return '<button class="btn btn-success flex-1" style="opacity: 0.8; cursor: default;" disabled>✓ Member</button>';
    if (hasRequested) return '<button class="btn btn-outline flex-1" style="opacity: 0.7;" disabled>🕒 Pending Approval...</button>';
    return `<button class="btn btn-primary flex-1" onclick="event.stopPropagation(); window.joinGroup(${group.id})">Join Group</button>`;
}

function renderGroupDetailsView(container, groupId) {
    const group = state.groups.find(g => String(g.id) === String(groupId));
    if (!group) { container.innerHTML = '<h1>Group not found</h1>'; return; }

    const isGlobalAdmin = state.user.role === 'admin';
    const isGroupAdmin = isGlobalAdmin || (group.otherAdmins || []).includes(state.user.id);
    const isMember = group.members.some(m => String(m.id) === String(state.user.id));

    if (!isMember && !isGroupAdmin) {
        container.innerHTML = `
            <div class="text-center p-6">
                <h1>Private Group</h1>
                <p>You must be a member of <strong>${group.name}</strong> to view this content.</p>
                <button class="btn btn-outline mt-4" onclick="window.history.back()">Go Back</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <button class="btn btn-outline" onclick="window.location.hash='#groups'">← Back</button>
            <div class="flex gap-2">
                <button class="btn btn-outline" onclick="window.shareGroupLink(${group.id})">🔗 Invite</button>
                ${isGroupAdmin ? `
                    <button class="btn ${group.isMuted ? 'btn-success' : 'btn-danger'}" onclick="window.toggleGroupMute(${group.id})">
                        ${group.isMuted ? '🔊 Unmute All' : '🔇 Mute Everyone'}
                    </button>
                ` : `
                    <button class="btn btn-outline-danger" style="color: var(--danger); border-color: var(--danger);" onclick="window.leaveGroup(${group.id})">🚪 Leave Group</button>
                `}
            </div>
        </div>

        <div class="grid" style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
            <!-- Left: Chat Section -->
            <div class="glass-panel" style="padding: 1.5rem; display: flex; flex-direction: column; height: 70vh;">
                <h2>${group.name} Chat</h2>
                <div id="group-messages" style="flex: 1; overflow-y: auto; margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: 12px; background: rgba(0,0,0,0.02);">
                    ${renderGroupMessages(group)}
                </div>
                
                ${(!group.isMuted || isGroupAdmin) ? `
                    <div class="flex gap-2">
                        <input type="text" id="groupChatInput" class="form-control" placeholder="Type a message..." onkeyup="if(event.key==='Enter') window.sendGroupMessage(${group.id})">
                        <button class="btn btn-primary" onclick="window.sendGroupMessage(${group.id})">Send</button>
                    </div>
                ` : `
                    <div class="text-center p-2 bg-danger text-white" style="border-radius: 8px; font-size: 0.9rem;">
                        Only admins can send messages.
                    </div>
                `}
            </div>

            <!-- Right: Admin/Member Management -->
            <div style="display: flex; flex-direction: column; gap: 2rem;">
                ${isGroupAdmin && group.requests && group.requests.length > 0 ? `
                    <div class="glass-panel" style="border: 2px solid var(--accent); padding: 1.5rem;">
                        <h3>Requests (${group.requests.length})</h3>
                        <div class="mt-2">
                            ${group.requests.map(req => `
                                <div class="flex justify-between items-center mb-2 p-2" style="background: rgba(0,0,0,0.05); border-radius: 8px;">
                                    <span style="font-size: 0.85rem; font-weight: bold;">${req.name}</span>
                                    <div class="flex gap-1">
                                        <button class="btn btn-sm" style="padding: 4px 8px;" onclick="window.handleJoinRequest(${group.id}, ${req.id}, true)">✔</button>
                                        <button class="btn btn-sm btn-outline" style="padding: 4px 8px;" onclick="window.handleJoinRequest(${group.id}, ${req.id}, false)">✖</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="glass-panel" style="padding: 1.5rem;">
                    <h3>Members (${group.members.length})</h3>
                    <div class="mt-4" style="max-height: 400px; overflow-y: auto;">
                        ${group.members.map(m => `
                            <div class="flex justify-between items-center mb-3 p-2 border-bottom">
                                <div class="flex items-center gap-2">
                                    <div class="avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">${m.name.charAt(0)}</div>
                                    <div style="font-size: 0.85rem;">
                                        <strong>${m.name}</strong>
                                        ${(group.otherAdmins || []).includes(m.id) ? '<br><span class="badge badge-admin" style="font-size: 0.6rem;">GROUP ADMIN</span>' : ''}
                                    </div>
                                </div>
                                 ${isGroupAdmin && String(m.id) !== String(state.user.id) ? `
                                    <div class="flex gap-1" style="flex-direction: column;">
                                        ${isGlobalAdmin && (group.otherAdmins || []).includes(m.id) ? `
                                            <button class="btn btn-sm btn-outline" style="padding: 2px 5px; font-size: 0.7rem; color: orange; border-color: orange;" onclick="window.demoteGroupAdmin(${group.id}, ${m.id})">Demote</button>
                                        ` : (isGlobalAdmin && (group.otherAdmins || []).length < 2 ? `
                                            <button class="btn btn-sm btn-outline" style="padding: 2px 5px; font-size: 0.7rem;" onclick="window.makeGroupAdmin(${group.id}, ${m.id})">Promote</button>
                                        ` : '')}
                                        <button class="btn btn-sm btn-outline" style="padding: 2px 5px; font-size: 0.7rem; color: var(--danger); margin-top: 4px;" onclick="window.removeFromGroup(${group.id}, ${m.id})">Kick</button>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Auto scroll chat
    setTimeout(() => {
        const chat = document.getElementById('group-messages');
        if (chat) chat.scrollTop = chat.scrollHeight;
    }, 100);
}

function renderGroupMessages(group) {
    const isGlobalAdmin = state.user.role === 'admin';
    const isGroupAdmin = isGlobalAdmin || (group.otherAdmins || []).includes(state.user.id);
    if (!group.messages || group.messages.length === 0) return '<p class="text-center text-secondary">No messages yet.</p>';
    return group.messages.map(msg => `
        <div class="mb-3" style="text-align: ${msg.userId === state.user.id ? 'right' : 'left'};">
            <div style="font-size: 0.7rem; font-weight: bold; margin-bottom: 2px; ${isGroupAdmin ? 'cursor: pointer; text-decoration: underline;' : ''}" 
                 onclick="${isGroupAdmin ? `window.location.hash='#profile?id=${msg.userId}'` : ''}">
                ${msg.userName}
            </div>
            <div style="display: inline-block; padding: 0.6rem 1rem; border-radius: 12px; background: ${msg.userId === state.user.id ? 'var(--primary)' : '#e2e8f0'}; color: ${msg.userId === state.user.id ? 'white' : 'black'}; max-width: 80%;">
                ${msg.text}
            </div>
        </div>
    `).join('');
}

window.sendGroupMessage = (groupId) => {
    const input = document.getElementById('groupChatInput');
    const text = input.value.trim();
    if (!text) return;

    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    if (!group.messages) group.messages = [];
    group.messages.push({
        userId: state.user.id,
        userName: state.user.name,
        text,
        time: Date.now()
    });

    saveState();
    input.value = '';
    renderGroupDetailsView(document.getElementById('main-content'), groupId);
};

window.toggleGroupMute = (groupId) => {
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
        group.isMuted = !group.isMuted;
        saveState();
        renderGroupDetailsView(document.getElementById('main-content'), groupId);
    }
};

window.makeGroupAdmin = (groupId, userId) => {
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
        if (!group.otherAdmins) group.otherAdmins = [];
        if (group.otherAdmins.includes(userId)) return alert('Already an admin.');
        if (group.otherAdmins.length >= 2) return alert('Limit of 2 sub-admins reached.');
        group.otherAdmins.push(userId);
        saveState();
        renderGroupDetailsView(document.getElementById('main-content'), groupId);
        alert('User promoted to Group Admin!');
    }
};

window.demoteGroupAdmin = (groupId, userId) => {
    if (!confirm('Demote this admin to a regular member?')) return;
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
        group.otherAdmins = (group.otherAdmins || []).filter(id => id !== userId);
        saveState();
        renderGroupDetailsView(document.getElementById('main-content'), groupId);
        alert('Admin demoted to Member.');
    }
};

window.removeFromGroup = (groupId, userId) => {
    if (!confirm('Kick this member from the group?')) return;
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
        group.members = group.members.filter(m => String(m.id) !== String(userId));
        group.otherAdmins = (group.otherAdmins || []).filter(id => String(id) !== String(userId));
        saveState();
        renderGroupDetailsView(document.getElementById('main-content'), groupId);
    }
};

window.leaveGroup = (groupId) => {
    if (!confirm('Are you sure you want to leave this group? You will lose access to the chat and member list.')) return;
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
        group.members = group.members.filter(m => String(m.id) !== String(state.user.id));
        group.otherAdmins = (group.otherAdmins || []).filter(id => String(id) !== String(state.user.id));
        saveState();
        window.location.hash = '#groups';
        alert('You have left the group.');
    }
};

window.toggleCreateGroupModal = () => {
    const el = document.getElementById('create-group-modal');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

window.saveGroup = () => {
    const name = document.getElementById('groupName').value.trim();
    const desc = document.getElementById('groupDesc').value.trim();
    if (!name) return alert('Group name is required');

    const newGroup = {
        id: Date.now(),
        roomId: state.user.roomId,
        name,
        description: desc,
        members: [{ id: state.user.id, name: state.user.name, email: state.user.email }],
        requests: [],
        messages: [],
        isMuted: false,
        otherAdmins: []
    };

    state.groups.push(newGroup);
    saveState();
    window.toggleCreateGroupModal();
    router();
};

window.joinGroup = (groupId) => {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;
    if (!group.requests) group.requests = [];

    // Check if already in requests
    if (group.requests.some(r => r.id === state.user.id)) return alert('Request already sent.');

    group.requests.push({ id: state.user.id, name: state.user.name, email: state.user.email });
    saveState();
    alert('Join request sent! Admin will approve it soon.');
    router();
};

window.handleJoinRequest = (groupId, userId, accept) => {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    // Permission check: Global Admin or Group Co-Admin
    const isGlobalAdmin = state.user.role === 'admin';
    const isCoAdmin = (group.otherAdmins || []).includes(state.user.id);
    if (!isGlobalAdmin && !isCoAdmin) return alert('You do not have permission to manage requests for this group.');

    const userReq = group.requests.find(r => r.id === userId);
    group.requests = group.requests.filter(r => r.id !== userId);

    if (accept && userReq) {
        group.members.push(userReq);
    }
    saveState();
    renderGroupDetailsView(document.getElementById('main-content'), groupId);
};

window.shareGroupLink = (id) => {
    const shareLink = `${window.location.origin}${window.location.pathname}#groups?id=${id}`;
    navigator.clipboard.writeText(shareLink).then(() => {
        alert('Group invitation link copied!');
    });
};
