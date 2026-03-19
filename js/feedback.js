window.renderFeedback = function (container) {
    const roomFeedbacks = state.feedbacks.filter(f => f.roomId === state.user.roomId);
    const feedbacksHtml = roomFeedbacks.map(f => `
                    <div class="feedback-item">
                        <div class="flex justify-between mb-1">
                            <strong>${f.author} <span class="badge badge-${f.role}" style="margin-left:8px; font-size: 0.65rem;">${f.role}</span></strong>
                            <small class="text-secondary">${new Date(f.date).toLocaleDateString()}</small>
                        </div>
                        <p>${f.content}</p>
                    </div>
                    `).join('');

    container.innerHTML = `
                    <h1>Event Feedback</h1>
                    <p>Share your experiences for Room: <strong style="color:var(--primary)">${state.user.roomId}</strong></p>

                    <div class="flex gap-4" style="flex-wrap: wrap;">
                        <div class="glass-panel flex-1" style="min-width: 300px;">
                            <h2>Submit Feedback</h2>
                            <div class="form-group mt-4">
                                <textarea id="fbContent" class="form-control" rows="4" placeholder="Tell us about what you loved or how we can improve..." required></textarea>
                            </div>
                            <button class="btn btn-primary" onclick="submitFeedback()">Submit Feedback</button>
                        </div>

                        <div class="glass-panel flex-1" style="min-width: 300px;">
                            <h2>Recent Feedbacks</h2>
                            <div class="mt-4" style="max-height: 400px; overflow-y: auto;">
                                ${roomFeedbacks.length ? feedbacksHtml : '<p class="text-secondary">No feedback submitted in this room yet.</p>'}
                            </div>
                        </div>
                    </div>
                    `;
}

window.submitFeedback = function () {
    const el = document.getElementById('fbContent');
    const content = el.value.trim();
    if (!content) return alert("Feedback cannot be empty");

    state.feedbacks.unshift({
        id: Date.now(),
        roomId: state.user.roomId,
        author: state.user.name,
        role: state.user.role,
        content: content,
        date: new Date().toISOString()
    });
    saveState();
    el.value = '';
    renderFeedback(document.getElementById('main-content'));
}
