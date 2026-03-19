window.renderPolls = function (container) {
    const polls = state.polls.filter(p => p.roomId === state.user.roomId);

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1>Polls & Surveys</h1>
                <p>Voice your opinion in <strong>Room: ${state.user.roomId}</strong></p>
            </div>
            ${state.user.role === 'admin' ? `
                <button class="btn btn-primary" onclick="toggleAddPollModal()">+ Create New Poll</button>
            ` : ''}
        </div>

        <div class="glass-panel mb-6" style="padding: 1.5rem; background: rgba(239, 68, 68, 0.05); border: 1.5px solid var(--danger);">
            <div class="flex items-center gap-2">
                <span style="font-size: 1.5rem;">⚠️</span>
                <strong style="color: var(--danger);">Important Disclaimer:</strong>
            </div>
            <p style="margin: 0.5rem 0 0; font-size: 0.95rem; color: var(--text-secondary);">
                Every student is allowed only <strong>one vote per poll</strong>. Once your vote is submitted, it <strong>cannot be edited, changed, or removed</strong>. Please ensure your choice is final before confirming.
            </p>
        </div>

        <div id="add-poll-modal" style="display:none; margin-bottom: 2rem;" class="glass-panel">
            <h2>Create New Poll</h2>
            <div id="pollError" style="color: var(--danger); margin-bottom: 1rem; display:none;"></div>
            <div class="form-group">
                <label>Question <span style="color: var(--danger);">*</span></label>
                <input type="text" id="pollQuestion" class="form-control" placeholder="e.g., Which guest should we invite?">
            </div>
            <div id="poll-options-container">
                <label>Options <span style="color: var(--danger);">*</span></label>
                <div class="flex gap-2 mb-2">
                    <input type="text" class="form-control poll-opt" placeholder="Option 1">
                </div>
                <div class="flex gap-2 mb-2">
                    <input type="text" class="form-control poll-opt" placeholder="Option 2">
                </div>
            </div>
            <button class="btn btn-sm btn-outline mb-4" onclick="addPollOptionField()">+ Add Option</button>
            <div class="flex gap-2">
                <button class="btn btn-primary" onclick="savePoll()">Save Poll</button>
                <button class="btn btn-outline" onclick="toggleAddPollModal()">Cancel</button>
            </div>
        </div>

        <div class="grid-cards">
            ${polls.length === 0 ? '<p class="text-secondary">No active polls found in this room.</p>' : polls.reverse().map(p => {
                const totalVotes = p.options.reduce((sum, opt) => sum + opt.votes, 0);
                const userVoted = p.votedBy.includes(state.user.id);

                return `
                    <div class="glass-panel poll-card" style="padding: 1.5rem; max-width: 450px; margin: 0 auto 2rem; border: 2px solid ${userVoted ? 'var(--success)' : 'var(--primary)'}; transition: all 0.3s ease;">
                        <h3 style="margin-bottom: 0.25rem; font-size: 1.25rem;">${p.question}</h3>
                        ${!userVoted ? `
                            <p style="color: var(--danger); font-size: 0.75rem; font-weight: bold; margin-bottom: 1rem;">
                                ⚠️ Note: Your choice is permanent.
                            </p>
                        ` : `
                            <p style="color: var(--success); font-size: 0.75rem; font-weight: bold; margin-bottom: 1rem;">
                                ✓ Vote recorded successfully.
                            </p>
                        `}
                        
                        <div class="poll-options">
                            ${p.options.map(opt => {
                                const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                                return `
                                    <div class="poll-option mb-3" onclick="${!userVoted ? `submitVote(${p.id}, ${opt.id})` : ''}" 
                                         style="${!userVoted ? 'cursor: pointer;' : 'cursor: default;'} padding: 0.75rem; border-radius: 10px; background: rgba(0,0,0,0.03); border: 1px solid transparent; transition: all 0.2s ease;"
                                         onmouseover="${!userVoted ? "this.style.background='rgba(99, 102, 241, 0.08)'; this.style.borderColor='var(--primary)'" : ''}"
                                         onmouseout="${!userVoted ? "this.style.background='rgba(0,0,0,0.03)'; this.style.borderColor='transparent'" : ''}">
                                        
                                        <div class="flex items-center gap-2 mb-1">
                                            <div class="custom-checkbox" style="width: 16px; height: 16px; border: 2px solid ${userVoted ? 'var(--success)' : 'var(--primary)'}; border-radius: 3px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: white;">
                                                ${userVoted ? '<span style="color: var(--success); font-size: 11px;">✓</span>' : ''}
                                            </div>
                                            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; font-weight: 600; font-size: 0.9rem;">
                                                <span>${opt.text}</span>
                                                <span style="color: var(--primary); margin-left: auto;">${percentage}%</span>
                                            </div>
                                        </div>
                                        
                                        <div style="height: 6px; background: rgba(0,0,0,0.05); border-radius: 3px; overflow: hidden;">
                                            <div style="width: ${percentage}%; height: 100%; background: ${userVoted ? 'var(--success)' : 'var(--primary)'}; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                                        </div>
                                        <div class="flex justify-between mt-1">
                                            <span class="text-secondary" style="font-size: 0.7rem;">${opt.votes} votes</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <div class="flex justify-between items-center mt-2">
                            <span class="text-secondary" style="font-size: 0.85rem;">Total Participants: ${totalVotes}</span>
                            ${state.user.role === 'admin' ? `
                                <button class="btn btn-danger btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="deletePoll(${p.id})">Delete Poll</button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
};

window.toggleAddPollModal = function() {
    const el = document.getElementById('add-poll-modal');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

window.addPollOptionField = function() {
    const container = document.getElementById('poll-options-container');
    const div = document.createElement('div');
    div.className = 'flex gap-2 mb-2';
    div.innerHTML = `<input type="text" class="form-control poll-opt" placeholder="Option ${container.children.length}">`;
    container.appendChild(div);
};

window.savePoll = function() {
    const question = document.getElementById('pollQuestion').value.trim();
    const optInputs = document.querySelectorAll('.poll-opt');
    const options = [];
    const err = document.getElementById('pollError');

    optInputs.forEach((input, index) => {
        if (input.value.trim()) {
            options.push({ id: index + 1, text: input.value.trim(), votes: 0 });
        }
    });

    if (!question || options.length < 2) {
        err.style.display = 'block';
        err.innerText = "Please provide a question and at least 2 options!";
        return;
    }

    state.polls.push({
        id: Date.now(),
        roomId: state.user.roomId,
        question,
        options,
        votedBy: []
    });

    saveState();
    renderPolls(document.getElementById('main-content'));
};

window.submitVote = function(pollId, optionId) {
    if (!confirm("Are you sure? Your vote cannot be changed after submission.")) return;
    
    const poll = state.polls.find(p => p.id === pollId);
    if (poll && !poll.votedBy.includes(state.user.id)) {
        const option = poll.options.find(o => o.id === optionId);
        if (option) {
            option.votes++;
            poll.votedBy.push(state.user.id);
            saveState();
            renderPolls(document.getElementById('main-content'));
        }
    }
};

window.deletePoll = function(id) {
    if (!confirm("Are you sure you want to delete this poll?")) return;
    state.polls = state.polls.filter(p => p.id !== id);
    saveState();
    renderPolls(document.getElementById('main-content'));
};
