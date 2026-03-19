// --- Auth Views ---

window.renderLogin = function (container) {
    const hash = window.location.hash || '#login';
    const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const prefilledRoom = params.get('room') || '';

    container.innerHTML = `
        <div class="auth-page-wrapper flex items-center justify-center w-100" style="min-height: 100vh;">
            <div class="glass-panel login-container text-center">
                <h1 class="logo mb-2">Eventify</h1>
                <p class="mb-4">Welcome! Login to your account.</p>
                
                <div id="loginError" style="color: var(--danger); font-weight: 600; margin-bottom: 1rem; display:none;"></div>
                
                <div class="form-group">
                    <label>Login As</label>
                    <select id="loginRole" class="form-control" onchange="toggleLoginForm()">
                        <option value="student">Student (via Room ID)</option>
                        <option value="admin">Event Admin (Email/Pass)</option>
                    </select>
                </div>
                
                <div id="admin-login-fields" style="display:none;">
                    <div class="form-group">
                        <label>Email ID</label>
                        <input type="email" id="loginEmail" class="form-control" placeholder="Enter your email">
                    </div>
                    
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="loginPass" class="form-control" placeholder="Enter your password">
                    </div>
                </div>

                <div id="student-login-fields">
                    <div class="form-group">
                        <label>Room ID <span style="color: var(--danger);">*</span></label>
                        <input type="text" id="loginRoomId" class="form-control" placeholder="e.g. ADM-12345" value="${prefilledRoom}" required>
                    </div>
                    <div class="form-group">
                        <label>Your Name <span style="color: var(--danger);">*</span></label>
                        <input type="text" id="loginStudentName" class="form-control" placeholder="e.g. John Doe" required>
                    </div>
                    <div class="form-group">
                        <label>College Email <span style="color: var(--danger);">*</span></label>
                        <input type="email" id="loginStudentEmail" class="form-control" placeholder="email@college.edu" required>
                    </div>
                    <div class="flex gap-2">
                        <div class="form-group flex-1">
                            <label>Branch (B.Tech) <span style="color: var(--danger);">*</span></label>
                            <select id="loginStudentBranch" class="form-control" required>
                                <option value="" disabled selected>Select Branch</option>
                                <option value="CSE">CSE</option>
                                <option value="IT">IT</option>
                                <option value="ECE">ECE</option>
                                <option value="EEE">EEE</option>
                                <option value="ME">Mechanical</option>
                                <option value="CE">Civil</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div class="form-group flex-1">
                            <label>Year <span style="color: var(--danger);">*</span></label>
                            <select id="loginStudentYear" class="form-control" required>
                                <option value="" disabled selected>Year</option>
                                <option value="1st">1st Year</option>
                                <option value="2nd">2nd Year</option>
                                <option value="3rd">3rd Year</option>
                                <option value="4th">4th Year</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <button class="btn btn-primary w-100 mt-2" onclick="handleLogin()">Login</button>
                
                <p class="mt-4 text-center">New here? <button class="btn btn-link" onclick="window.location.hash='#register'">Create an account</button></p>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); font-size: 0.8rem; color: var(--text-secondary);">
                    Admin test account:<br/>email: <b>admin@college.edu</b> / pass: <b>admin</b><br/>
                    Room ID: <b>ADM-12345</b>
                </div>
            </div>
        </div>
    `;
}

window.toggleLoginForm = function () {
    const role = document.getElementById('loginRole').value;
    const adminFields = document.getElementById('admin-login-fields');
    const studentFields = document.getElementById('student-login-fields');

    if (role === 'admin') {
        adminFields.style.display = 'block';
        studentFields.style.display = 'none';
    } else {
        adminFields.style.display = 'none';
        studentFields.style.display = 'block';
    }
}

window.handleLogin = function() {
    const role = document.getElementById('loginRole').value;
    const errEl = document.getElementById('loginError');

    if (role === 'admin') {
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPass').value;
        const foundUser = state.users.find(u => u.email === email && u.password === pass && u.role === 'admin');

        if (foundUser) {
            state.user = { id: foundUser.id, name: foundUser.name, role: foundUser.role, email: foundUser.email, roomId: foundUser.roomId };
            saveState();
            window.location.hash = '#dashboard';
        } else {
            errEl.innerText = "Invalid Admin Credentials";
            errEl.style.display = 'block';
        }
    } else {
        const roomId = document.getElementById('loginRoomId').value.trim();
        const studentName = document.getElementById('loginStudentName').value.trim();
        const studentEmail = document.getElementById('loginStudentEmail').value.trim();
        const studentBranch = document.getElementById('loginStudentBranch').value;
        const studentYear = document.getElementById('loginStudentYear').value;

        if (!roomId || !studentName || !studentEmail || !studentBranch || !studentYear) {
            errEl.innerText = "All fields marked with * are compulsory.";
            errEl.style.display = 'block';
            return;
        }

        const adminRoom = state.users.find(u => u.roomId === roomId && u.role === 'admin');

        if (adminRoom) {
            let studentToLogin = state.users.find(u => u.email === studentEmail && u.roomId === roomId && u.role === 'student');
            
            if (!studentToLogin) {
                studentToLogin = {
                    id: Date.now(),
                    name: studentName,
                    email: studentEmail,
                    branch: studentBranch,
                    year: studentYear,
                    role: 'student',
                    roomId: roomId
                };
                state.users.push(studentToLogin);
            } else {
                studentToLogin.name = studentName;
                studentToLogin.branch = studentBranch;
                studentToLogin.year = studentYear;
            }

            state.user = {
                id: studentToLogin.id,
                name: studentToLogin.name,
                email: studentToLogin.email,
                branch: studentToLogin.branch,
                year: studentToLogin.year,
                role: 'student',
                roomId: roomId
            };
            saveState();
            window.location.hash = '#dashboard';
        } else {
            errEl.innerText = "Invalid Room ID. Please contact your administrator.";
            errEl.style.display = 'block';
        }
    }
}

window.renderRegister = function (container) {
    container.innerHTML = `
        <div class="auth-page-wrapper flex items-center justify-center w-100" style="min-height: 100vh;">
            <div class="glass-panel login-container text-center">
                <h1 class="logo mb-2">Eventify</h1>
                <p class="mb-4">Register as an <strong>Event Admin</strong> to create your own room!</p>
                
                <div id="regError" style="color: var(--danger); font-weight: 600; margin-bottom: 1rem; display:none;"></div>
                
                <div class="form-group">
                    <label>Admin Name</label>
                    <input type="text" id="regName" class="form-control" placeholder="e.g. Science Club Admin" required>
                </div>
                
                <div class="form-group">
                    <label>Email ID (For Login)</label>
                    <input type="email" id="regEmail" class="form-control" placeholder="admin@college.edu" required>
                </div>
                
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="regPass" class="form-control" placeholder="Choose a secure password" required>
                </div>
                
                <button class="btn btn-primary w-100 mt-2" onclick="handleRegister()">Create Admin Account</button>
                
                <p class="mt-4 text-center">Student wanting to join? <button class="btn btn-link" onclick="window.location.hash='#login'">Login with Room ID</button></p>
                <p class="mt-2 text-center">Already an admin? <button class="btn btn-link" onclick="window.location.hash='#login'">Login here</button></p>
            </div>
        </div>
    `;
}

window.handleRegister = function() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const errEl = document.getElementById('regError');

    if (!name || !email || !pass) {
        errEl.innerText = "Please fill out all fields.";
        errEl.style.display = 'block';
        return;
    }

    if (state.users.some(u => u.email === email)) {
        errEl.innerText = "Email is already registered. Please login.";
        errEl.style.display = 'block';
        return;
    }

    const randomStr = Math.floor(10000 + Math.random() * 90000).toString();
    const roomId = `ADM-${randomStr}`;

    const newUser = {
        id: Date.now(),
        name,
        email,
        password: pass,
        role: 'admin',
        roomId: roomId
    };

    state.users.push(newUser);
    state.user = { id: newUser.id, name: newUser.name, role: newUser.role, email: newUser.email, roomId: newUser.roomId };

    saveState();
    alert(`Registration Successful!\n\nYour Unique Room ID is: ${roomId}\n\nGive this ID to your students so they can join your room!`);
    window.location.hash = '#dashboard';
}

window.handleLogout = function() {
    state.user = null;
    saveState();
    window.location.hash = '#login';
}
