// Initialize Application
window.init = function () {
    loadState();
    window.addEventListener('hashchange', router);

    // Default route
    if (!window.location.hash) {
        window.location.hash = '#login';
    } else {
        router();
    }
}

// Simple Router
window.router = function () {
    const appEl = document.getElementById('app');
    if (!appEl) {
        console.error("App container not found!");
        return;
    }
    const hash = window.location.hash || '#login';

    // Protect routes
    if (!state.user && (!hash.startsWith('#login') && !hash.startsWith('#register'))) {
        window.location.hash = '#login';
        return;
    }

    if (state.user && (hash.startsWith('#login') || hash.startsWith('#register'))) {
        window.location.hash = '#dashboard';
        return;
    }

    appEl.innerHTML = '';

    if (hash.startsWith('#login')) {
        renderLogin(appEl);
    } else if (hash.startsWith('#register')) {
        renderRegister(appEl);
    } else {
        // App Layout for Authenticated Users
        appEl.innerHTML = `
            <div class="app-layout" style="display: flex; flex-direction: column; min-height: 100vh; width: 100%;">
                ${renderHeader()}
                <main class="main-content" id="main-content" style="flex: 1; padding-top: 2rem;">
                    <!-- Content injected here -->
                </main>
            </div>
        `;
        const mainEl = document.getElementById('main-content');

        if (hash === '#dashboard') {
            if (state.user.role === 'admin') renderAdminDashboard(mainEl);
            else renderStudentDashboard(mainEl);
        } else if (hash === '#events') {
            renderEvents(mainEl);
        } else if (hash.startsWith('#gallery')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            const folderId = params.get('folder');
            renderGallery(mainEl, folderId);
        } else if (hash === '#announcements') {
            renderAnnouncements(mainEl);
        } else if (hash === '#chat') {
            renderChat(mainEl);
        } else if (hash === '#polls') {
            renderPolls(mainEl);
        } else if (hash.startsWith('#groups')) {
            renderGroups(mainEl);
        } else if (hash === '#feedback') {
            renderFeedback(mainEl);
        } else if (hash === '#reports') {
            renderRegistrationReport(mainEl);
        } else if (hash.startsWith('#event-details')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            const eventId = params.get('id');
            renderEventFullPage(mainEl, eventId);
        } else if (hash.startsWith('#profile')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            const userId = params.get('id');
            renderUserProfile(mainEl, userId);
        } else {
            mainEl.innerHTML = `<h1>404 Not Found</h1>`;
        }
    }
}

// Start app
window.onload = init;
