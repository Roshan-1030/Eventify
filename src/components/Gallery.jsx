import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';

const Gallery = () => {
    const { state, setState } = useAppState();
    const { folderId: routeFolderId } = useParams();
    const navigate = useNavigate();
    
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const folderId = routeFolderId ? (isNaN(Number(routeFolderId)) ? routeFolderId : parseInt(routeFolderId)) : null;
    const roomFolders = (state.folders || []).filter(f => f.roomId === state.user?.roomId);
    const currentFolder = folderId ? roomFolders.find(f => String(f.id) === String(folderId)) : null;
    const folderImages = folderId ? (state.gallery || []).filter(g => String(g.folderId) === String(folderId)) : [];

    const handleCreateFolder = async () => {
        const name = prompt("Enter new album folder name:");
        if (name && name.trim()) {
            const newFolder = { roomId: state.user.roomId, name: name.trim(), createdAt: Date.now() };
            try {
                await addDoc(collection(db, "folders"), newFolder);
            } catch (e) {
                console.error("Cloud folder upload failed, using local state:", e);
                const localFolder = { ...newFolder, id: Date.now() };
                setState(prev => ({ ...prev, folders: [...(prev.folders || []), localFolder] }));
            }
        }
    };

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !folderId) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

                const newImg = {
                    roomId: state.user.roomId,
                    folderId: folderId,
                    url: compressedBase64,
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    uploaderId: state.user.id,
                    createdAt: Date.now()
                };

                try {
                    await addDoc(collection(db, "gallery"), newImg);
                } catch (e) {
                    console.error("Cloud photo upload failed, using local state:", e);
                    const localImg = { ...newImg, id: Date.now() };
                    setState(prev => ({ ...prev, gallery: [...(prev.gallery || []), localImg] }));
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleDeletePhoto = async (id) => {
        if (!window.confirm("Are you sure you want to delete this photo?")) return;
        try {
            await deleteDoc(doc(db, "gallery", String(id)));
        } catch (e) {
            console.error("Delete photo error:", e);
            setState(prev => ({ ...prev, gallery: prev.gallery.filter(g => String(g.id) !== String(id)) }));
        }
        setIsLightboxOpen(false);
    };

    // Folders Root View
    if (!folderId) {
        return (
            <div className="gallery-folders">
                <div className="dashboard-header">
                    <div>
                        <h1 style={{ marginBottom: '0.35rem' }}>Photo Gallery</h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                            Albums for Room: <strong style={{ color: 'var(--primary)' }}>{state.user?.roomId}</strong>
                        </p>
                    </div>
                    {state.user?.role === 'admin' && (
                        <button className="btn btn-primary btn-sm" onClick={handleCreateFolder}>
                            + Create Album
                        </button>
                    )}
                </div>

                <div className="grid-cards mt-4">
                    {roomFolders.length === 0 ? (
                        <div className="glass-panel text-center" style={{ padding: '3rem 1.5rem' }}>
                            <p className="text-secondary" style={{ margin: 0 }}>No photo albums created in this room yet.</p>
                        </div>
                    ) : (
                        roomFolders.map(f => (
                            <div 
                                key={f.id} 
                                className="glass-panel text-center" 
                                style={{ cursor: 'pointer', position: 'relative', padding: '2rem 1.5rem' }} 
                                onClick={() => navigate(`/gallery/${f.id}`)}
                            >
                                {state.user?.role === 'admin' && (
                                    <button 
                                        className="btn btn-xs btn-outline-danger" 
                                        style={{ position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} 
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Delete folder "${f.name}" and all its photos?`)) {
                                                try {
                                                    await deleteDoc(doc(db, "folders", String(f.id)));
                                                } catch (err) { }
                                                setState(prev => ({
                                                    ...prev,
                                                    folders: prev.folders.filter(folder => String(folder.id) !== String(f.id)),
                                                    gallery: prev.gallery.filter(img => String(img.folderId) !== String(f.id))
                                                }));
                                            }
                                        }}
                                        title="Delete album"
                                    >
                                        ✕
                                    </button>
                                )}
                                <span style={{ fontSize: '2.75rem', display: 'block', marginBottom: '0.75rem' }}>📁</span>
                                <h3 style={{ margin: '0 0 0.25rem 0' }}>{f.name}</h3>
                                <small className="text-secondary">
                                    {(state.gallery || []).filter(g => String(g.folderId) === String(f.id)).length} Photos
                                </small>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    if (!currentFolder) return (
        <div className="glass-panel text-center" style={{ padding: '3rem 1.5rem' }}>
            <h2>Album not found</h2>
            <button className="btn btn-primary mt-4" onClick={() => navigate('/gallery')}>Back to Albums</button>
        </div>
    );

    const currentImg = folderImages[currentImageIndex];

    return (
        <div className="gallery-view">
            <div className="dashboard-header">
                <div>
                    <button className="btn btn-outline btn-xs mb-2" onClick={() => navigate('/gallery')}>
                        ← Back to Albums
                    </button>
                    <h1 style={{ marginBottom: '0.25rem' }}>{currentFolder.name}</h1>
                    <small className="text-secondary">{folderImages.length} photos in this album</small>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => document.getElementById('gallery-input').click()}>
                        + Upload Photo
                    </button>
                    <input type="file" id="gallery-input" style={{ display: 'none' }} accept="image/*" onChange={handleUpload} />
                </div>
            </div>

            {folderImages.length === 0 ? (
                <div className="glass-panel text-center" style={{ padding: '3rem 1.5rem' }}>
                    <p className="text-secondary" style={{ marginBottom: '1rem' }}>No photos uploaded to this album yet.</p>
                    <button className="btn btn-primary btn-sm" onClick={() => document.getElementById('gallery-input').click()}>Upload First Photo</button>
                </div>
            ) : (
                <div className="gallery-grid">
                    {folderImages.map((img, idx) => (
                        <div 
                            key={img.id} 
                            className="glass-panel gallery-item p-0" 
                            onClick={() => { setCurrentImageIndex(idx); setIsLightboxOpen(true); }}
                        >
                            <img src={img.url} alt={img.title} />
                            <div className="gallery-overlay">
                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {img.title}
                                </h4>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Responsive Lightbox Modal */}
            {isLightboxOpen && currentImg && (
                <div className="lightbox-modal" onClick={() => setIsLightboxOpen(false)}>
                    <button 
                        className="lightbox-close-btn" 
                        onClick={() => setIsLightboxOpen(false)}
                        title="Close preview"
                    >
                        ✕
                    </button>
                    
                    {(state.user?.role === 'admin' || currentImg.uploaderId === state.user?.id) && (
                        <button 
                            className="btn btn-danger btn-xs" 
                            style={{ position: 'absolute', top: '24px', left: '20px' }} 
                            onClick={(e) => { e.stopPropagation(); handleDeletePhoto(currentImg.id); }}
                        >
                            🗑️ Delete
                        </button>
                    )}
                    
                    {folderImages.length > 1 && (
                        <>
                            <button 
                                className="lightbox-nav-btn" 
                                style={{ left: '16px' }} 
                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((idx) => (idx - 1 + folderImages.length) % folderImages.length); }}
                                title="Previous photo"
                            >
                                ❮
                            </button>
                            <button 
                                className="lightbox-nav-btn" 
                                style={{ right: '16px' }} 
                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((idx) => (idx + 1) % folderImages.length); }}
                                title="Next photo"
                            >
                                ❯
                            </button>
                        </>
                    )}
                    
                    <img src={currentImg.url} alt={currentImg.title} onClick={e => e.stopPropagation()} />
                    <h3 style={{ color: '#ffffff', marginTop: '1.25rem', fontSize: '1.1rem', textAlign: 'center' }}>
                        {currentImg.title}
                    </h3>
                </div>
            )}
        </div>
    );
};

export default Gallery;
