import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const Polls = () => {
    const { state } = useAppState();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [error, setError] = useState('');

    const roomPolls = (state.polls || []).filter(p => p.roomId === state.user?.roomId);

    const handleAddOption = () => setOptions([...options, '']);
    const handleOptionChange = (idx, val) => {
        const newOpts = [...options];
        newOpts[idx] = val;
        setOptions(newOpts);
    };

    const handleSavePoll = async (e) => {
        e.preventDefault();
        setError('');
        const filteredOpts = options.filter(opt => opt.trim());
        if (!question.trim() || filteredOpts.length < 2) {
            setError("Please provide a question and at least 2 options!");
            return;
        }

        const newPoll = {
            roomId: state.user.roomId,
            question: question.trim(),
            options: filteredOpts.map((text, idx) => ({ id: idx + 1, text: text.trim(), votes: 0 })),
            votedBy: [],
            createdAt: Date.now()
        };

        try {
            await addDoc(collection(db, "polls"), newPoll);
            setQuestion(''); setOptions(['', '']); setIsModalOpen(false);
        } catch(e) { console.error("Poll creation failed:", e); }
    };

    const handleVote = async (pollId, optionId) => {
        const poll = state.polls.find(p => p.id === pollId);
        if (!poll || poll.votedBy?.includes(state.user.id)) return;
        if (!window.confirm("Are you sure? Your vote cannot be changed after submission.")) return;

        const updatedOptions = [...poll.options];
        const oIdx = updatedOptions.findIndex(o => o.id === optionId);
        updatedOptions[oIdx] = { ...updatedOptions[oIdx], votes: updatedOptions[oIdx].votes + 1 };
        const updatedVotedBy = [...(poll.votedBy || []), state.user.id];

        try {
            await updateDoc(doc(db, "polls", pollId), {
                options: updatedOptions,
                votedBy: updatedVotedBy
            });
        } catch(e) { console.error("Voting failed:", e); }
    };

    const handleDeletePoll = async (id) => {
        if (!window.confirm("Are you sure you want to delete this poll?")) return;
        try {
            await deleteDoc(doc(db, "polls", id));
        } catch(e) { console.error("Deleting failed:", e); }
    };

    return (
        <div className="polls-page">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ marginBottom: '0.35rem' }}>Polls & Surveys</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        Voice your opinion in Room: <strong style={{ color: 'var(--primary)' }}>{state.user?.roomId}</strong>
                    </p>
                </div>
                {state.user?.role === 'admin' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                        + Create New Poll
                    </button>
                )}
            </div>

            {/* Disclaimer pill */}
            <div className="glass-panel mb-6" style={{ padding: '0.75rem 1.25rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📊</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Every student is allowed <strong>one vote per poll</strong>. Choices are permanent.
                    </span>
                </div>
            </div>

            {/* Create Poll Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="glass-panel modal-content-panel" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 style={{ margin: 0 }}>Create New Poll</h2>
                            <button className="btn btn-sm btn-outline" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        {error && <div className="p-3 mb-3 bg-danger text-white rounded font-bold" style={{ fontSize: '0.85rem' }}>{error}</div>}
                        <form onSubmit={handleSavePoll} className="flex flex-col gap-3">
                            <div className="form-group">
                                <label>Poll Question *</label>
                                <input type="text" className="form-control" placeholder="e.g. Which keynote topic do you prefer?" value={question} onChange={e => setQuestion(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Answer Options *</label>
                                {options.map((opt, idx) => (
                                    <input key={idx} type="text" className="form-control mb-2" value={opt} onChange={e => handleOptionChange(idx, e.target.value)} placeholder={`Option ${idx + 1}`} required={idx < 2} />
                                ))}
                                <button type="button" className="btn btn-xs btn-outline mt-1" onClick={handleAddOption}>+ Add Another Option</button>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Publish Poll</button>
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Polls Grid */}
            <div className="grid-cards">
                {roomPolls.length === 0 ? (
                    <div className="glass-panel text-center" style={{ padding: '3rem 1.5rem' }}>
                        <p className="text-secondary" style={{ margin: 0 }}>No active polls found in this room.</p>
                    </div>
                ) : (
                    roomPolls.slice().reverse().map(p => {
                        const totalVotes = (p.options || []).reduce((sum, opt) => sum + (opt.votes || 0), 0);
                        const userVoted = (p.votedBy || []).includes(state.user?.id);
                        const maxVotes = Math.max(0, ...(p.options || []).map(o => o.votes || 0));
                        
                        return (
                            <div 
                                key={p.id} 
                                className="glass-panel poll-card" 
                                style={{ 
                                    padding: '1.5rem', 
                                    border: `1.5px solid ${userVoted ? 'var(--success)' : 'var(--border)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{p.question}</h3>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '1.25rem', color: userVoted ? 'var(--success)' : 'var(--text-secondary)' }}>
                                        {userVoted ? '✓ Your response has been recorded' : '👆 Tap an option to vote'}
                                    </div>
                                    
                                    <div className="poll-options flex flex-col gap-2">
                                        {(p.options || []).map(opt => {
                                            const percentage = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                                            const isLeading = totalVotes > 0 && opt.votes === maxVotes;
                                            
                                            return (
                                                <div 
                                                    key={opt.id} 
                                                    onClick={() => handleVote(p.id, opt.id)} 
                                                    style={{ 
                                                        cursor: !userVoted ? 'pointer' : 'default', 
                                                        padding: '0.75rem 1rem', 
                                                        borderRadius: 'var(--radius-md)', 
                                                        background: isLeading && totalVotes > 0 ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0,0,0,0.03)', 
                                                        border: `1px solid ${isLeading && totalVotes > 0 ? 'var(--primary)' : 'var(--border)'}`,
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5" style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ width: '14px', height: '14px', border: `2px solid ${userVoted ? 'var(--success)' : 'var(--primary)'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {userVoted && (
                                                                    <div style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%' }} />
                                                                )}
                                                            </div>
                                                            <span>{opt.text}</span>
                                                        </div>
                                                        <span style={{ color: 'var(--primary)' }}>{percentage}%</span>
                                                    </div>
                                                    
                                                    <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${percentage}%`, height: '100%', background: userVoted ? 'var(--success-gradient)' : 'var(--primary-gradient)', transition: 'width 0.6s ease' }} />
                                                    </div>
                                                    
                                                    <div style={{ marginTop: '0.35rem', textAlign: 'right' }}>
                                                        <small className="text-secondary" style={{ fontSize: '0.7rem' }}>{opt.votes || 0} votes</small>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center mt-4 pt-3 border-top">
                                    <small className="text-secondary" style={{ fontSize: '0.78rem' }}>
                                        Total: <strong>{totalVotes}</strong> votes
                                    </small>
                                    {state.user?.role === 'admin' && (
                                        <button className="btn btn-xs btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDeletePoll(p.id)}>
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Polls;
