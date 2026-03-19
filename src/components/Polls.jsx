import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';

const Polls = () => {
    const { state, setState } = useAppState();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [error, setError] = useState('');

    const roomPolls = (state.polls || []).filter(p => p.roomId === state.user.roomId);

    const handleAddOption = () => setOptions([...options, '']);
    
    const handleOptionChange = (idx, val) => {
        const newOpts = [...options];
        newOpts[idx] = val;
        setOptions(newOpts);
    };

    const handleSavePoll = (e) => {
        e.preventDefault();
        setError('');
        const filteredOpts = options.filter(opt => opt.trim());
        if (!question.trim() || filteredOpts.length < 2) {
            setError("Please provide a question and at least 2 options!");
            return;
        }

        const newPoll = {
            id: Date.now(),
            roomId: state.user.roomId,
            question,
            options: filteredOpts.map((text, idx) => ({ id: idx + 1, text, votes: 0 })),
            votedBy: []
        };

        setState(prev => ({ ...prev, polls: [...(prev.polls || []), newPoll] }));
        setQuestion(''); setOptions(['', '']); setIsModalOpen(false);
    };

    const handleVote = (pollId, optionId) => {
        const poll = state.polls.find(p => p.id === pollId);
        if (!poll || poll.votedBy.includes(state.user.id)) return;
        if (!window.confirm("Are you sure? Your vote cannot be changed after submission.")) return;

        const pollsCopy = [...state.polls];
        const pIdx = pollsCopy.findIndex(p => p.id === pollId);
        const p = { ...pollsCopy[pIdx], options: [...pollsCopy[pIdx].options], votedBy: [...pollsCopy[pIdx].votedBy] };
        
        const oIdx = p.options.findIndex(o => o.id === optionId);
        p.options[oIdx] = { ...p.options[oIdx], votes: p.options[oIdx].votes + 1 };
        p.votedBy.push(state.user.id);
        
        pollsCopy[pIdx] = p;
        setState(prev => ({ ...prev, polls: pollsCopy }));
    };

    const handleDeletePoll = (id) => {
        if (!window.confirm("Are you sure you want to delete this poll?")) return;
        setState(prev => ({ ...prev, polls: prev.polls.filter(p => p.id !== id) }));
    };

    return (
        <div className="polls-page">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1>Polls & Surveys</h1>
                    <p>Voice your opinion in <strong>Room: {state.user.roomId}</strong></p>
                </div>
                {state.user.role === 'admin' && <button className="btn btn-primary" onClick={() => setIsModalOpen(!isModalOpen)}>+ Create New Poll</button>}
            </div>

            <div className="glass-panel mb-6" style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1.5px solid var(--danger)' }}>
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <strong style={{ color: 'var(--danger)' }}>Important Disclaimer:</strong>
                </div>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    Every student is allowed only <strong>one vote per poll</strong>. Once your vote is submitted, it <strong>cannot be edited, changed, or removed</strong>.
                </p>
            </div>

            {isModalOpen && (
                <div className="glass-panel mb-8">
                    <h2>Create New Poll</h2>
                    {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
                    <form onSubmit={handleSavePoll}>
                        <div className="form-group">
                            <label>Question</label>
                            <input type="text" className="form-control" value={question} onChange={e => setQuestion(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Options</label>
                            {options.map((opt, idx) => (
                                <input key={idx} type="text" className="form-control mb-2" value={opt} onChange={e => handleOptionChange(idx, e.target.value)} placeholder={`Option ${idx + 1}`} required={idx < 2} />
                            ))}
                            <button type="button" className="btn btn-sm btn-outline" onClick={handleAddOption}>+ Add Option</button>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="btn btn-primary">Save Poll</button>
                            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid-cards">
                {roomPolls.length === 0 ? (
                    <p className="text-secondary">No active polls found.</p>
                ) : (
                    roomPolls.slice().reverse().map(p => {
                        const totalVotes = p.options.reduce((sum, opt) => sum + opt.votes, 0);
                        const userVoted = p.votedBy.includes(state.user.id);
                        return (
                            <div key={p.id} className="glass-panel poll-card" style={{ padding: '1.5rem', width: '100%', maxWidth: '450px', margin: '0 auto 2rem', border: `2px solid ${userVoted ? 'var(--success)' : 'var(--primary)'}` }}>
                                <h3>{p.question}</h3>
                                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1rem', color: userVoted ? 'var(--success)' : 'var(--danger)' }}>
                                    {userVoted ? '✓ Vote recorded.' : '⚠️ Choice is permanent.'}
                                </p>
                                <div className="poll-options">
                                    {p.options.map(opt => {
                                        const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                                        return (
                                            <div key={opt.id} className="poll-option mb-3" onClick={() => handleVote(p.id, opt.id)} style={{ cursor: !userVoted ? 'pointer' : 'default', padding: '0.75rem', borderRadius: '10px', background: 'rgba(0,0,0,0.03)' }}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div style={{ width: '16px', height: '16px', border: `2px solid ${userVoted ? 'var(--success)' : 'var(--primary)'}`, borderRadius: '3px', textAlign: 'center', lineHeight: '12px' }}>
                                                        {userVoted && p.votedBy.includes(state.user.id) && '✓'}
                                                    </div>
                                                    <div className="flex justify-between w-100 font-bold" style={{ fontSize: '0.9rem', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>{opt.text}</span>
                                                        <span>{percentage}%</span>
                                                    </div>
                                                </div>
                                                <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${percentage}%`, height: '100%', background: userVoted ? 'var(--success)' : 'var(--primary)', transition: 'width 0.5s' }} />
                                                </div>
                                                <small className="text-secondary">{opt.votes} votes</small>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <small>Total Participants: {totalVotes}</small>
                                    {state.user.role === 'admin' && <button className="btn btn-danger btn-sm" onClick={() => handleDeletePoll(p.id)}>Delete</button>}
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
