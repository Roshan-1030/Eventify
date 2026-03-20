import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/StateContext';

const Gallery = () => {
    const { state, setState } = useAppState();
    const { folderId: routeFolderId } = useParams();
    const navigate = useNavigate();
    
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const folderId = routeFolderId ? parseInt(routeFolderId) : null;
    const roomFolders = (state.folders || []).filter(f => f.roomId === state.user.roomId);
    const currentFolder = folderId ? roomFolders.find(f => f.id === folderId) : null;
    const folderImages = folderId ? (state.gallery || []).filter(g => g.folderId === folderId) : [];

    const handleCreateFolder = () => {
        const name = prompt("Enter new folder name:");
        if (name) {
            const newFolder = { id: Date.now(), roomId: state.user.roomId, name };
            setState(prev => ({ ...prev, folders: [...(prev.folders || []), newFolder] }));
        }
    };

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !folderId) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
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
                    id: Date.now(),
                    roomId: state.user.roomId,
                    folderId: folderId,
                    url: compressedBase64,
                    title: file.name,
                    uploaderId: state.user.id
                };

                setState(prev => ({ ...prev, gallery: [...(prev.gallery || []), newImg] }));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleDeletePhoto = (id) => {
        if (!window.confirm("Are you sure you want to delete this photo forever?")) return;
        setState(prev => ({ ...prev, gallery: prev.gallery.filter(g => g.id !== id) }));
        setIsLightboxOpen(false);
    };

    if (!folderId) {
        return (
            <div className="gallery-folders">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1>Photo Gallery Folders</h1>
                        <p>Current Room: <strong style={{ color: 'var(--primary)' }}>{state.user.roomId}</strong></p>
                    </div>
                    {state.user.role === 'admin' && <button className="btn btn-primary" onClick={handleCreateFolder}>+ Create Folder</button>}
                </div>
                <div className="grid-cards mt-4">
                    {roomFolders.length === 0 ? (
                        <p className="text-secondary">No photo folders in this room yet.</p>
                    ) : (
                        roomFolders.map(f => (
                            <div key={f.id} className="glass-panel text-center" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/gallery/${f.id}`)}>
                                {state.user.role === 'admin' && (
                                    <button className="btn btn-sm btn-outline" style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.1rem 0.4rem', fontSize: '0.6rem', zIndex: 10 }} onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Delete folder "${f.name}" and all its photos?`)) {
                                            setState(prev => ({
                                                ...prev,
                                                folders: prev.folders.filter(folder => folder.id !== f.id),
                                                gallery: prev.gallery.filter(img => img.folderId !== f.id)
                                            }));
                                        }
                                    }}>Delete</button>
                                )}
                                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📁</span>
                                <h3>{f.name}</h3>
                                <p>{(state.gallery || []).filter(g => g.folderId === f.id).length} Photos</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    if (!currentFolder) return (
        <div className="text-center p-8">
            <h1>Folder not found.</h1>
            <button className="btn btn-primary mt-4" onClick={() => navigate('/gallery')}>Back to Gallery</button>
        </div>
    );

    const currentImg = folderImages[currentImageIndex];

    return (
        <div className="gallery-view">
            <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <button className="btn btn-outline btn-sm mb-2" onClick={() => navigate('/gallery')} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>← Back to Folders</button>
                    <h1>{currentFolder.name}</h1>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-primary" onClick={() => document.getElementById('gallery-input').click()}>+ Upload Photo</button>
                    <input type="file" id="gallery-input" style={{ display: 'none' }} accept="image/*" onChange={handleUpload} />
                </div>
            </div>

            <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {folderImages.map((img, idx) => (
                    <div key={img.id} className="glass-panel gallery-item p-0" style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative', height: '200px' }} onClick={() => { setCurrentImageIndex(idx); setIsLightboxOpen(true); }}>
                        <img src={img.url} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div className="gallery-overlay" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.5rem', opacity: 0, transition: 'opacity 0.3s' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>{img.title}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {isLightboxOpen && currentImg && (
                <div className="lightbox-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <button className="btn btn-outline" style={{ position: 'absolute', top: '30px', right: '30px', color: 'white', borderColor: 'white' }} onClick={() => setIsLightboxOpen(false)}>Close ✕</button>
                    {(state.user.role === 'admin' || currentImg.uploaderId === state.user.id) && (
                        <button className="btn btn-danger" style={{ position: 'absolute', top: '30px', right: '140px' }} onClick={() => handleDeletePhoto(currentImg.id)}>Delete Photo</button>
                    )}
                    
                    <button className="btn btn-primary" style={{ position: 'absolute', left: '20px', borderRadius: '50%', width: '60px', height: '60px' }} onClick={() => setCurrentImageIndex((idx) => (idx - 1 + folderImages.length) % folderImages.length)}>❮</button>
                    <button className="btn btn-primary" style={{ position: 'absolute', right: '20px', borderRadius: '50%', width: '60px', height: '60px' }} onClick={() => setCurrentImageIndex((idx) => (idx + 1) % folderImages.length)}>❯</button>
                    
                    <img src={currentImg.url} alt={currentImg.title} style={{ maxWidth: '85%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px' }} />
                    <h2 style={{ color: 'white', marginTop: '2rem' }}>{currentImg.title}</h2>
                </div>
            )}
        </div>
    );
};

export default Gallery;
