window.renderGallery = function (container, folderId) {
    if (!folderId) {
        const roomFolders = state.folders.filter(f => f.roomId === state.user.roomId);
        container.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h1>Photo Gallery Folders</h1>
                    <p>Current Room: <strong style="color:var(--primary)">${state.user.roomId}</strong></p>
                    <p>Select a folder to view or upload event photos.</p>
                </div>
                ${state.user.role === 'admin' ? `<button class="btn btn-primary" onclick="createGalleryFolder()">+ Create Folder</button>` : ''}
            </div>
            
            <div class="grid-cards mt-4">
                ${roomFolders.length === 0 ? '<p class="text-secondary w-100">No photo folders in this room yet.</p>' : roomFolders.map(f => {
            const count = state.gallery.filter(g => g.folderId == f.id).length;
            return `
                    <div class="glass-panel text-center gallery-folder" style="cursor:pointer;" onclick="window.location.hash='#gallery?folder=${f.id}'">
                        <span style="font-size:3rem; display:block; margin-bottom:1rem;">📁</span>
                        <h3 class="mt-2">${f.name}</h3>
                        <p>${count} Photos</p>
                    </div>
                    `;
        }).join('')}
            </div>
        `;
    } else {
        const folder = state.folders.find(f => f.id == folderId);
        if (!folder || folder.roomId !== state.user.roomId) {
            container.innerHTML = `<h2>Access Denied</h2><p>This folder does not belong to this room.</p><button class="btn btn-outline mt-2" onclick="window.location.hash='#gallery'">Back</button>`;
            return;
        }
        const currentUrl = window.location.origin + window.location.pathname + '#gallery?folder=' + folder.id;
        const folderImages = state.gallery.filter(g => g.folderId == folder.id);

        container.innerHTML = `
            <div class="flex justify-between items-center mb-4 hide-on-mobile-wrap" style="flex-wrap: wrap; gap:1rem;">
                <div>
                    <button class="btn btn-outline btn-sm mb-2" onclick="window.location.hash='#gallery'" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">← Back to Folders</button>
                    <h1>${folder.name}</h1>
                </div>
                <div class="flex gap-2">
                    ${state.user.role === 'admin' ? `<button class="btn btn-outline" onclick="copyFolderLink('${currentUrl}')">🔗 Share Link</button>` : ''}
                    <button class="btn btn-primary" onclick="triggerGalleryUpload(${folder.id})">+ Upload Photo</button>
                    <input type="file" id="galleryUpload" accept="image/*" style="display:none;" onchange="handleGalleryUpload(event, ${folder.id})" />
                </div>
            </div>

            <div class="gallery-grid mt-4">
                ${folderImages.map((img, index) => `
                    <div class="glass-panel gallery-item p-0" onclick="openLightbox(${folder.id}, ${index})">
                        <img src="${img.url}" alt="${img.title}" onerror="this.src='assets/images/tech_fest.png'">
                        <div class="gallery-overlay">
                            <h3 style="color:white; margin:0;">${img.title}</h3>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${folderImages.length === 0 ? '<p class="text-secondary w-100 mt-4">No photos in this folder yet. Be the first to upload!</p>' : ''}
        `;
    }
}

window.createGalleryFolder = function () {
    const name = prompt("Enter new folder name:");
    if (name) {
        state.folders.push({
            id: Date.now(),
            roomId: state.user.roomId,
            name
        });
        saveState();
        router();
    }
}

window.copyFolderLink = function (url) {
    navigator.clipboard.writeText(url).then(() => {
        alert("Folder link copied to clipboard!");
    });
}

window.triggerGalleryUpload = function (folderId) {
    document.getElementById('galleryUpload').dataset.folderId = folderId;
    document.getElementById('galleryUpload').click();
}

window.handleGalleryUpload = function (event, folderId) {
    const file = event.target.files[0];
    if (!file || !folderId) return;

    const title = file.name;
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
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

            state.gallery.push({
                id: Date.now(),
                roomId: state.user.roomId,
                folderId: parseInt(folderId),
                url: compressedBase64,
                title,
                uploaderId: state.user.id
            });

            try {
                saveState();
            } catch (err) {
                alert("Browser Storage limit reached!");
                state.gallery.pop();
                return;
            }

            const mainEl = document.getElementById('main-content');
            if (mainEl && window.location.hash.includes('#gallery?folder=' + folderId)) {
                renderGallery(mainEl, folderId);
            } else {
                router();
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

window.currentLightboxImages = [];
window.currentLightboxIndex = 0;

window.openLightbox = function (folderId, index) {
    window.currentLightboxImages = state.gallery.filter(g => g.folderId == folderId);
    window.currentLightboxIndex = index;

    let lb = document.getElementById('lightbox-modal');
    if (!lb) {
        lb = document.createElement('div');
        lb.id = 'lightbox-modal';
        lb.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999; background:rgba(15, 23, 42, 0.95); backdrop-filter:blur(8px); display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; transition:opacity 0.3s ease; padding: 2rem; box-sizing:border-box;';
        lb.innerHTML = `
            <button class="btn btn-outline" onclick="closeLightbox()" style="position:absolute; top:30px; right:30px; font-size:1rem; padding: 0.5rem 1rem; color:var(--text-primary); background:var(--card-bg); z-index:10001;">Close ✕</button>
            <button id="lb-delete-btn" class="btn btn-danger" onclick="deleteLightboxPhoto()" style="position:absolute; top:30px; right:140px; font-size:1rem; padding: 0.5rem 1rem; z-index:10001; display:none;">Delete Photo</button>
            <button class="btn btn-primary" onclick="lightboxPrev(event)" style="position:absolute; left:20px; top:50%; transform:translateY(-50%); font-size:1.5rem; padding:1rem; border-radius:50%; width:60px; height:60px; z-index:10001;">❮</button>
            <button class="btn btn-primary" onclick="lightboxNext(event)" style="position:absolute; right:20px; top:50%; transform:translateY(-50%); font-size:1.5rem; padding:1rem; border-radius:50%; width:60px; height:60px; z-index:10001;">❯</button>
            <img id="lb-img" src="" style="max-width:85%; max-height:80vh; object-fit:contain; border-radius:12px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); transition: opacity 0.2s ease;">
            <h2 id="lb-title" style="color:white; margin-top:2rem; text-align:center;"></h2>
        `;
        document.body.appendChild(lb);
        document.addEventListener('keydown', handleLightboxKeydown);
    }

    updateLightboxContent();
    lb.style.display = 'flex';
    requestAnimationFrame(() => lb.style.opacity = 1);
}

window.updateLightboxContent = function () {
    const imgData = window.currentLightboxImages[window.currentLightboxIndex];
    if (imgData) {
        const imgEl = document.getElementById('lb-img');
        const delBtn = document.getElementById('lb-delete-btn');
        imgEl.style.opacity = 0;

        if (state.user.role === 'admin' || imgData.uploaderId === state.user.id) {
            delBtn.style.display = 'block';
        } else {
            delBtn.style.display = 'none';
        }

        setTimeout(() => {
            imgEl.src = imgData.url;
            document.getElementById('lb-title').innerText = imgData.title;
            imgEl.onload = () => { imgEl.style.opacity = 1; };
        }, 150);
    }
}

window.deleteLightboxPhoto = function () {
    const imgData = window.currentLightboxImages[window.currentLightboxIndex];
    if (imgData && confirm("Are you sure you want to delete this photo forever?")) {
        state.gallery = state.gallery.filter(g => g.id !== imgData.id);
        saveState();
        closeLightbox();
        router();
    }
}

window.lightboxNext = function (e) {
    if (e) e.stopPropagation();
    if (window.currentLightboxImages.length > 1) {
        window.currentLightboxIndex = (window.currentLightboxIndex + 1) % window.currentLightboxImages.length;
        updateLightboxContent();
    }
}

window.lightboxPrev = function (e) {
    if (e) e.stopPropagation();
    if (window.currentLightboxImages.length > 1) {
        window.currentLightboxIndex = (window.currentLightboxIndex - 1 + window.currentLightboxImages.length) % window.currentLightboxImages.length;
        updateLightboxContent();
    }
}

window.handleLightboxKeydown = function (e) {
    let lb = document.getElementById('lightbox-modal');
    if (lb && lb.style.display !== 'none') {
        if (e.key === 'ArrowRight') lightboxNext();
        else if (e.key === 'ArrowLeft') lightboxPrev();
        else if (e.key === 'Escape') closeLightbox();
    }
}

window.closeLightbox = function () {
    let lb = document.getElementById('lightbox-modal');
    if (lb) {
        lb.style.opacity = 0;
        setTimeout(() => lb.style.display = 'none', 300);
    }
}
