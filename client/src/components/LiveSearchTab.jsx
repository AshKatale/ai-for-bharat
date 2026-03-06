import { useState, useRef, useEffect } from 'react';

const QUESTIONS_API = 'http://localhost:8080';

const Q_STEPS = [
    { label: 'Receiving search query', icon: '' },
    { label: 'Analyzing query context', icon: '' },
    { label: 'Fetching product data', icon: '' },
    { label: 'Running AI model', icon: '' },
    { label: 'Generating questions', icon: '' },
    { label: 'Ranking & finalizing', icon: '' },
];

function LiveSearchTab({ productId, productName, onStartEvaluation }) {
    // Question generation state
    const [questions, setQuestions] = useState([]);
    const [qLoading, setQLoading] = useState(false);
    const [qError, setQError] = useState('');
    const [qProductName, setQProductName] = useState('');
    const [editingIdx, setEditingIdx] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [qDone, setQDone] = useState(false);
    const [qProgress, setQProgress] = useState(0);   // 0–100
    const [qStepIdx, setQStepIdx] = useState(-1);    // active step index
    const [showAll, setShowAll] = useState(false);
    const qTimerRef = useRef(null);

    // Manual questions state
    const [manualQuestions, setManualQuestions] = useState([]);
    const [manualInput, setManualInput] = useState('');
    const [editingManualIdx, setEditingManualIdx] = useState(null);
    const [selectedQuestions, setSelectedQuestions] = useState([]);

    const isSelected = (qStr) => selectedQuestions.some(sq => sq.question === qStr);
    const toggleSelection = (qObj) => {
        setSelectedQuestions(prev => {
            if (prev.some(sq => sq.question === qObj.question)) {
                return prev.filter(sq => sq.question !== qObj.question);
            }
            return [...prev, qObj];
        });
    };

    const handleEvaluate = () => {
        if (selectedQuestions.length === 0) return;
        if (onStartEvaluation) {
            onStartEvaluation(selectedQuestions);
        }
    };

    // Drive the progress bar while loading
    useEffect(() => {
        if (qLoading) {
            setQProgress(0);
            setQStepIdx(0);
            let step = 0;
            const totalSteps = Q_STEPS.length;
            qTimerRef.current = setInterval(() => {
                step += 1;
                if (step < totalSteps - 1) {
                    setQStepIdx(step);
                    setQProgress(Math.round((step / (totalSteps - 1)) * 88));
                } else {
                    clearInterval(qTimerRef.current);
                }
            }, 900);
        } else {
            clearInterval(qTimerRef.current);
            if (qDone) {
                setQStepIdx(Q_STEPS.length - 1);
                setQProgress(100);
            }
        }
        return () => clearInterval(qTimerRef.current);
    }, [qLoading, qDone]);

    useEffect(() => {
        if (productId && !qDone && !qLoading && !qError) {
            generateQuestions(productName || 'product', productId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, productName]);

    const generateQuestions = async (q, pid) => {
        setQLoading(true);
        setQError('');
        setQuestions([]);
        setQProductName('');
        setQDone(false);
        setQProgress(0);
        setQStepIdx(-1);
        setEditingIdx(null);
        setSelectedQuestions([]);

        try {
            const res = await fetch(`${QUESTIONS_API}/api/questions/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: pid, search_query: q }),
            });
            const json = await res.json();
            if (json.success && json.data) {
                setQuestions(json.data.questions || []);
                setQProductName(json.data.product_name || '');
                setQDone(true);
            } else {
                setQError(json.message || 'Failed to generate questions.');
                setQDone(true);
            }
        } catch (err) {
            setQError('Could not reach the questions API at localhost:8080.');
            setQDone(true);
        } finally {
            setQLoading(false);
        }
    };

    const startEdit = (idx) => {
        setEditingIdx(idx);
        setEditValue(questions[idx].question);
    };

    const saveEdit = (idx) => {
        setQuestions(prev =>
            prev.map((q, i) => i === idx ? { ...q, question: editValue } : q)
        );
        setEditingIdx(null);
        setEditValue('');
    };

    const cancelEdit = () => {
        setEditingIdx(null);
        setEditValue('');
    };

    const addManualQuestion = () => {
        const trimmed = manualInput.trim();
        if (!trimmed) return;
        setManualQuestions(prev => [...prev, { question: trimmed, isManual: true }]);
        setManualInput('');
    };

    const deleteManualQuestion = (idx) => {
        setManualQuestions(prev => prev.filter((_, i) => i !== idx));
        if (editingManualIdx === idx) {
            setEditingManualIdx(null);
            setEditManualValue('');
        }
    };

    const startEditManual = (idx) => {
        setEditingManualIdx(idx);
        setEditManualValue(manualQuestions[idx].question);
    };

    const saveEditManual = (idx) => {
        setManualQuestions(prev =>
            prev.map((q, i) => i === idx ? { ...q, question: editManualValue } : q)
        );
        setEditingManualIdx(null);
        setEditManualValue('');
    };

    const cancelEditManual = () => {
        setEditingManualIdx(null);
        setEditManualValue('');
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white">Live Search Question Generation</h2>
                        {qDone && !qError && (
                            <p className="text-xs text-slate-500 mt-0.5">
                                {questions.length} question{questions.length !== 1 ? 's' : ''} generated
                                {qProductName ? ` for ${qProductName}` : ''}
                            </p>
                        )}
                    </div>
                </div>
                {!qLoading && (
                    <button
                        onClick={() => generateQuestions(productName || 'product', productId)}
                        className="btn-outline px-4 py-1.5 text-xs shadow-none border-white/10 hover:border-brand/30"
                    >
                        Regenerate
                    </button>
                )}
            </div>

            {/* Progress simulation */}
            {(qLoading || (qDone && !qError && questions.length === 0)) && (
                <div className="glass-card p-5 mb-2">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {qLoading ? (
                                <div className="w-4 h-4 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
                            ) : (
                                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            <span className="text-sm font-medium text-white">
                                {qLoading ? 'Generating Questions…' : 'Questions Ready'}
                            </span>
                        </div>
                        <span className={`text-xs font-bold tabular-nums ${qDone && !qError ? 'text-emerald-400' : 'text-brand-light'}`}>
                            {qProgress}%
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden mb-4">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${qDone && !qError ? 'bg-emerald-500' : 'bg-brand'}`}
                            style={{ width: `${qProgress}%` }}
                        />
                    </div>

                    {/* Step list */}
                    <div className="space-y-2">
                        {Q_STEPS.map((step, i) => {
                            const isDone = i < qStepIdx || (qDone && !qError);
                            const isActive = i === qStepIdx && qLoading;

                            // Skip rendering completed steps
                            if (isDone) return null;

                            return (
                                <div key={i} className="flex items-center gap-2.5">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] transition-all duration-300
                                        ${isActive ? 'bg-brand/20 border border-brand/40' :
                                            'bg-white/[0.04] border border-white/[0.08]'}`}>
                                        {isActive ? (
                                            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                        ) : (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                        )}
                                    </div>
                                    <span className={`text-xs transition-colors duration-300
                                        ${isActive ? 'text-white font-medium' : 'text-slate-600'}`}>
                                        {step.icon} {step.label}
                                    </span>
                                    {isActive && (
                                        <span className="text-[10px] text-brand/70 animate-pulse ml-auto">running…</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Error */}
            {qDone && qError && (
                <div className="glass-card p-5 bg-red-500/5 border border-red-500/20">
                    <p className="text-sm font-medium text-red-400 mb-1">Question generation failed</p>
                    <p className="text-xs text-slate-500">{qError}</p>
                </div>
            )}

            {/* Questions List */}
            {qDone && !qError && questions.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">
                            Total: <span className="text-brand-light font-semibold">{questions.length + manualQuestions.length}</span> question{(questions.length + manualQuestions.length) !== 1 ? 's' : ''}
                            <span className="ml-2 text-slate-600">({questions.length} AI · {manualQuestions.length} manual)</span>
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-brand/10 text-brand-light border border-brand/20">
                            AI Generated
                        </span>
                    </div>

                    {/* AI Questions */}
                    <div className={`space-y-3 transition-all duration-500 overflow-hidden ${!showAll && questions.length > 5 ? 'max-h-[800px]' : 'max-h-[3000px]'}`}>
                        {questions.slice(0, showAll ? questions.length : 5).map((q, idx) => (
                            <div
                                key={q.question_number ?? idx}
                                className="glass-card p-4 flex gap-4 items-start group hover:border-brand/30 transition-all opacity-100 animate-fade-in"
                            >
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand/15 border border-brand/25 text-brand-light text-xs font-bold flex items-center justify-center">
                                    {q.question_number ?? idx + 1}
                                </span>

                                <div className="flex-1 min-w-0">
                                    {editingIdx === idx ? (
                                        <div className="space-y-2">
                                            <textarea
                                                className="w-full bg-white/5 border border-brand/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand/60 resize-none"
                                                rows={3}
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => saveEdit(idx)}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-brand/20 text-brand-light border border-brand/30 hover:bg-brand/30 transition-all font-medium"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-200 leading-relaxed">{q.question}</p>
                                    )}
                                </div>

                                {editingIdx !== idx && (
                                    <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => toggleSelection({ question_number: q.question_number ?? idx + 1, question: q.question })}
                                            className={`text-[10px] px-2 py-1 rounded-md font-medium border transition-colors ${isSelected(q.question)
                                                ? 'bg-brand/20 text-brand-light border-brand/30 hover:bg-brand/30'
                                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            {isSelected(q.question) ? 'Added' : 'Add to evaluate'}
                                        </button>
                                        <button
                                            onClick={() => startEdit(idx)}
                                            title="Edit question"
                                            className="p-1.5 rounded-lg hover:bg-brand/10 text-slate-500 hover:text-brand-light"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Show All Toggle */}
                    {questions.length > 5 && (
                        <div className="flex justify-center pt-2">
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand/30 text-xs font-medium text-slate-300 hover:text-brand-light transition-all"
                            >
                                {showAll ? 'Show Less' : `Show All ${questions.length} Questions`}
                                <svg
                                    className={`w-4 h-4 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Manual Questions */}
                    {manualQuestions.length > 0 && (
                        <>
                            <div className="flex items-center gap-2 pt-2">
                                <div className="h-px flex-1 bg-white/[0.06]" />
                                <span className="text-xs text-slate-500 px-2">Manual Questions</span>
                                <div className="h-px flex-1 bg-white/[0.06]" />
                            </div>
                            {manualQuestions.map((mq, midx) => (
                                <div
                                    key={midx}
                                    className="glass-card p-4 flex gap-4 items-start group hover:border-amber-500/30 border-amber-500/10 transition-all"
                                >
                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold flex items-center justify-center">
                                        {questions.length + midx + 1}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        {editingManualIdx === midx ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    className="w-full bg-white/5 border border-amber-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/60 resize-none"
                                                    rows={3}
                                                    value={editManualValue}
                                                    onChange={e => setEditManualValue(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => saveEditManual(midx)}
                                                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all font-medium"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEditManual}
                                                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-200 leading-relaxed">{mq.question}</p>
                                        )}
                                    </div>

                                    {editingManualIdx !== midx && (
                                        <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => toggleSelection({ question_number: questions.length + midx + 1, question: mq.question })}
                                                className={`text-[10px] px-2 py-1 rounded-md font-medium border transition-colors ${isSelected(mq.question)
                                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                                                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {isSelected(mq.question) ? 'Added' : 'Add to evaluate'}
                                            </button>
                                            <button
                                                onClick={() => startEditManual(midx)}
                                                title="Edit"
                                                className="p-1.5 rounded-lg hover:bg-amber-500/10 text-slate-500 hover:text-amber-400"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => deleteManualQuestion(midx)}
                                                title="Delete"
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}

                    {/* Add Manual Question */}
                    <div className="mt-4 glass-card p-4 border-dashed border-white/10">
                        <p className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Manual Question
                        </p>
                        <div className="flex gap-2 items-end">
                            <textarea
                                className="flex-1 bg-white/5 border border-white/10 focus:border-brand/40 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none resize-none transition-colors"
                                rows={2}
                                placeholder="Type your question here..."
                                value={manualInput}
                                onChange={e => setManualInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        addManualQuestion();
                                    }
                                }}
                            />
                            <button
                                onClick={addManualQuestion}
                                disabled={!manualInput.trim()}
                                className="px-4 py-2 rounded-lg bg-brand/20 text-brand-light border border-brand/30 hover:bg-brand/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all whitespace-nowrap"
                            >
                                Add
                            </button>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5">Press Enter to add · Shift+Enter for new line</p>
                    </div>

                    {/* Evaluation Section */}
                    {selectedQuestions.length > 0 && (
                        <div className="mt-8 p-6 glass-card border border-brand/30 animate-fade-in">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Evaluate Questions
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">{selectedQuestions.length} question(s) selected for cross-model evaluation.</p>
                                </div>
                                <button
                                    onClick={handleEvaluate}
                                    className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap"
                                >
                                    Evaluate Selected
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default LiveSearchTab;
