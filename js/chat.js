window.renderChat = function (container) {
    const roomMatches = (state.chats || []).filter(c => c.roomId === state.user.roomId);
    
    // Sort oldest to newest for a typical chat layout
    const roomChat = roomMatches.sort((a,b) => new Date(a.date) - new Date(b.date));

    let html = `
        <div class="flex justify-between items-center mb-4">
            <div>
                <h1>💬 Room Discussion</h1>
                <p>Chat with everyone currently in Room: <strong style="color:var(--primary)">${state.user.roomId}</strong></p>
            </div>
        </div>

        <div class="glass-panel" style="display: flex; flex-direction: column; height: 600px; padding: 1.5rem;">
            
            <!-- Chat History Window -->
            <div id="chat-history" style="flex: 1; overflow-y: auto; padding-right: 1rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
    `;

    if (roomChat.length === 0) {
        html += `<div class="text-center text-secondary" style="margin: auto;">No messages yet. Start the conversation!</div>`;
    } else {
        roomChat.forEach(c => {
            const isMe = c.senderId === state.user.id;
            
            // Layout: My messages on the right, others on the left
            html += `
                <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'};">
                    <span style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.2rem; ${state.user.role === 'admin' ? 'cursor: pointer; text-decoration: underline;' : ''}" 
                          onclick="${state.user.role === 'admin' ? `window.location.hash='#profile?id=${c.senderId}'` : ''}">
                        ${isMe ? 'You' : c.senderName} <span style="opacity:0.6; margin-left: 4px;">${new Date(c.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </span>
                    <div style="
                        max-width: 75%; 
                        padding: 0.8rem 1.2rem; 
                        border-radius: 18px; 
                        background: ${isMe ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.4)'};
                        color: ${isMe ? 'white' : 'var(--text-primary)'};
                        border: 1px solid ${isMe ? 'transparent' : 'var(--border)'};
                        border-bottom-${isMe ? 'right' : 'left'}-radius: 4px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                        word-break: break-word;
                    ">
                        ${c.text}
                    </div>
                </div>
            `;
        });
    }

    html += `
            </div>
            
            <!-- Input Area -->
            <div style="display: flex; gap: 1rem; align-items: center; border-top: 1px solid var(--border); padding-top: 1.5rem;">
                <input type="text" id="chat-input" class="form-control" style="flex: 1; border-radius: 999px; padding: 1rem 1.5rem;" placeholder="Type a message..." onkeypress="handleChatKeypress(event)">
                <button class="btn btn-primary" style="border-radius: 999px; padding: 1rem 2rem;" onclick="sendChatMessage()">Send</button>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Scroll chat to bottom immediately after rendering
    setTimeout(() => {
        const historyEl = document.getElementById('chat-history');
        if (historyEl) historyEl.scrollTop = historyEl.scrollHeight;
        
        // Focus the input automatically
        const inputEl = document.getElementById('chat-input');
        if (inputEl) inputEl.focus();
    }, 50);
};

window.handleChatKeypress = function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendChatMessage();
    }
}

window.sendChatMessage = function () {
    const inputEl = document.getElementById('chat-input');
    const text = inputEl.value.trim();

    if (!text) return;

    if (!state.chats) state.chats = [];

    state.chats.push({
        id: Date.now(),
        roomId: state.user.roomId,
        senderId: state.user.id,
        senderName: state.user.name,
        text: text,
        date: new Date().toISOString()
    });

    saveState();
    
    // Re-render the chat window to update the view smoothly
    if (window.router) window.router();
}
