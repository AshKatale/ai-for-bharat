import { useState, useEffect } from 'react';

const QUESTIONS_API = 'http://localhost:8080';

const SIMULATION_STEPS = [
    "Initializing cross-model evaluation engine...",
    "Routing query to GPT-4o, Gemini 1.5, and Nova Pro...",
    "Retrieving product intelligence from AstraDB...",
    "Models synthesizing & ranking competitive landscape...",
    "Consolidating final responses..."
];

function EvaluationTab({ questions, onBack, onEvaluationComplete, onAnalyzeGeo }) {
    const [evalLoading, setEvalLoading] = useState(false);
    const [evalError, setEvalError] = useState('');
    const [evaluationResults, setEvaluationResults] = useState(null);
    const [simStep, setSimStep] = useState(0);

    // tracks which question index is expanded
    // key format: "qIndex"
    const [expandedStates, setExpandedStates] = useState({});

    const toggleExpand = (qIndex) => {
        setExpandedStates(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    useEffect(() => {
        if (questions && questions.length > 0) {
            runEvaluation(questions);
        }
    }, [questions]);

    useEffect(() => {
        let interval;
        if (evalLoading) {
            interval = setInterval(() => {
                setSimStep(prev => (prev < SIMULATION_STEPS.length - 1 ? prev + 1 : prev));
            }, 1500);
        } else {
            setSimStep(SIMULATION_STEPS.length); // complete
        }
        return () => clearInterval(interval);
    }, [evalLoading]);

    const runEvaluation = async (qList) => {
        setEvalLoading(true);
        setEvalError('');
        setEvaluationResults(null);
        setSimStep(0);

        try {
            const res = await fetch(`${QUESTIONS_API}/api/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions: qList })
            });
            const json = await res.json();
            if (json.success && json.data) {
                setEvaluationResults(json.data);
                if (onEvaluationComplete) {
                    onEvaluationComplete(json.data);
                }
            } else {
                setEvalError(json.message || 'Evaluation failed.');
            }
        } catch (err) {
            setEvalError('Could not reach the evaluation API at localhost:8080.');
        } finally {
            setEvalLoading(false);
        }
    };

    if (!questions || questions.length === 0) {
        return (
            <div className="text-center py-20 text-slate-500">
                <p>No questions selected for evaluation.</p>
                <button onClick={onBack} className="mt-4 btn-outline px-4 py-2">Go back</button>
            </div>
        );
    }

    return (
        <div className="w-full animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Cross-Model Evaluation
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Evaluating {questions.length} selected question{questions.length > 1 ? 's' : ''}</p>
                </div>
                {!evalLoading && (
                    <button onClick={onBack} className="btn-ghost px-4 py-2 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Search
                    </button>
                )}
            </div>

            {/* Loading Simulation */}
            {evalLoading && (
                <div className="glass-card p-8 md:p-12 mb-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                    {/* Pulsing background effect */}
                    <div className="absolute inset-0 bg-brand/5 animate-pulse" />

                    <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
                        {/* 3 Nodes Animation */}
                        <div className="flex items-center justify-center gap-8 md:gap-16 mb-12">
                            {/* GPT Node */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center relative shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>
                                    <div className="absolute inset-0 rounded-2xl border border-green-400 animate-ping opacity-20" />
                                    <span className="font-bold text-green-400">GPT</span>
                                </div>
                                <div className="h-12 w-0.5 bg-gradient-to-b from-green-500/50 to-transparent animate-pulse" />
                            </div>

                            {/* Central Router / DB */}
                            <div className="flex flex-col items-center gap-3 mt-12">
                                <div className="w-20 h-20 rounded-full bg-brand/20 border-2 border-brand/50 flex items-center justify-center relative shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-pulse">
                                    <div className="absolute inset-0 rounded-full border border-brand animate-ping opacity-30" />
                                    <svg className="w-8 h-8 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                    </svg>
                                </div>
                            </div>

                            {/* Gemini Node */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border-2 border-blue-500/50 flex items-center justify-center relative shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '2s' }}>
                                    <div className="absolute inset-0 rounded-2xl border border-blue-400 animate-ping opacity-20" />
                                    <span className="font-bold text-blue-400">GEM</span>
                                </div>
                                <div className="h-12 w-0.5 bg-gradient-to-b from-blue-500/50 to-transparent animate-pulse" />
                            </div>

                            {/* Nova Node */}
                            <div className="flex flex-col items-center gap-3 absolute top-0 mt-8">
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border-2 border-purple-500/50 flex items-center justify-center relative shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '2s' }}>
                                    <div className="absolute inset-0 rounded-2xl border border-purple-400 animate-ping opacity-20" />
                                    <span className="font-bold text-purple-400 text-xs">NOVA</span>
                                </div>
                                <div className="h-20 w-px bg-gradient-to-b from-purple-500/50 to-transparent animate-pulse transform -rotate-45 -translate-x-8 translate-y-4" />
                            </div>
                        </div>

                        {/* Status Text Terminal */}
                        <div className="w-full bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-xs text-brand-light relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent animate-pulse" />
                            <div className="space-y-2">
                                {SIMULATION_STEPS.map((step, idx) => (
                                    <div
                                        key={idx}
                                        className={`transition-all duration-500 flex items-center gap-2 ${idx === simStep ? 'opacity-100 text-brand-light' : idx < simStep ? 'opacity-50 text-slate-500' : 'opacity-0 h-0 overflow-hidden'}`}
                                    >
                                        <span className="text-slate-600">&gt;</span>
                                        {step}
                                        {idx === simStep && <span className="w-2 h-4 bg-brand-light animate-pulse inline-block ml-1" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {evalError && !evalLoading && (
                <div className="glass-card p-6 bg-red-500/10 border-red-500/20 text-center mb-8">
                    <p className="text-red-400 font-medium mb-4">{evalError}</p>
                    <button onClick={() => runEvaluation(questions)} className="btn-outline px-6 py-2">Retry Evaluation</button>
                </div>
            )}

            {/* Results Grid */}
            {evaluationResults && !evalLoading && (
                <div className="space-y-8 animate-fade-slide">
                    <div className="flex items-center gap-4 bg-brand/10 border border-brand/20 rounded-xl p-4">
                        <div className="p-3 bg-brand/20 rounded-lg">
                            <svg className="w-6 h-6 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-white font-bold tracking-wide">Evaluation Complete</h3>
                            <p className="text-sm text-slate-400">Generated intelligence across {evaluationResults.models_used?.length || 3} AI models concurrently.</p>
                        </div>
                    </div>

                    {evaluationResults.results?.map((res, i) => {
                        const hasLongAnswer = ['gpt', 'gemini', 'nova_pro'].some(model => res[model]?.answer?.length > 250);
                        const isExpanded = !!expandedStates[i];

                        return (
                            <div key={i} className="glass-card overflow-hidden">
                                <div className="p-5 bg-white/[0.02] border-b border-white/10 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                                    <p className="text-base font-medium text-white leading-relaxed">
                                        <span className="text-brand-light font-bold mr-3 text-lg">Q{res.question_number}</span>
                                        {res.question}
                                    </p>

                                    {hasLongAnswer && (
                                        <button
                                            onClick={() => toggleExpand(i)}
                                            className="whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand/40 transition-all text-xs font-medium text-slate-300 hover:text-brand-light"
                                        >
                                            {isExpanded ? 'Show less' : 'Show more'}
                                            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                                    {['gpt', 'gemini', 'nova_pro'].map(model => {
                                        if (!res[model]) return null;

                                        const answer = res[model].answer || '';
                                        const isLong = answer.length > 250;

                                        return (
                                            <div key={model} className="p-5 flex flex-col hover:bg-white/[0.02] transition-colors relative group">
                                                {/* Model Badge */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border
                                                        ${model === 'gpt' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            model === 'gemini' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${model === 'gpt' ? 'bg-green-400' : model === 'gemini' ? 'bg-blue-400' : 'bg-purple-400'} animate-pulse`} />
                                                        {model.replace('_', ' ')}
                                                    </div>
                                                </div>

                                                {/* Answer Content */}
                                                <div className="prose prose-invert prose-xs max-w-none text-xs text-slate-300 leading-relaxed mb-6 flex-1">
                                                    {isExpanded || !isLong ? answer : `${answer.substring(0, 250)}...`}
                                                </div>

                                                {/* Metadata Footer */}
                                                <div className="mt-auto space-y-4 pt-5 border-t border-white/[0.05]">
                                                    {/* Row 1: Rank & Position */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {res[model].product_rank && (
                                                            <div className="bg-gradient-to-br from-emerald-500/10 to-transparent p-3 rounded-lg border border-emerald-500/20 shadow-sm flex flex-col justify-center">
                                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                                    </svg>
                                                                    <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-bold">Market Rank</p>
                                                                </div>
                                                                <p className="text-xs text-emerald-300 font-semibold leading-snug">{res[model].product_rank}</p>
                                                            </div>
                                                        )}

                                                        {res[model].market_position && (
                                                            <div className="bg-gradient-to-br from-amber-500/10 to-transparent p-3 rounded-lg border border-amber-500/20 shadow-sm flex flex-col justify-center">
                                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                                    </svg>
                                                                    <p className="text-[10px] text-amber-400/80 uppercase tracking-widest font-bold">Position</p>
                                                                </div>
                                                                <p className="text-xs text-amber-300 font-semibold leading-snug">{res[model].market_position}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Recommended For */}
                                                    {res[model].recommended_for && (
                                                        <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                                <svg className="w-3.5 h-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                                                </svg>
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Recommended For</p>
                                                            </div>
                                                            <p className="text-[11px] text-slate-300 leading-relaxed italic border-l-2 border-brand/30 pl-2 ml-1">
                                                                "{res[model].recommended_for}"
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Competitors Array */}
                                                    {res[model].competitors && res[model].competitors.length > 0 && (
                                                        <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                </svg>
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Competitors</p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {res[model].competitors.map((comp, cIdx) => (
                                                                    <span key={cIdx} className="text-[10px] px-2 py-0.5 rounded focus:outline-none bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:border-brand/40 transition-colors shadow-sm cursor-default">
                                                                        {comp}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Queries Array */}
                                                    {res[model].appears_in_queries && res[model].appears_in_queries.length > 0 && (
                                                        <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                                <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                </svg>
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Appears in Queries</p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {res[model].appears_in_queries.map((query, qIdx) => (
                                                                    <span key={qIdx} className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/5 text-cyan-200 border border-cyan-500/10 cursor-default">
                                                                        <span className="text-cyan-500/50">"</span>
                                                                        {query}
                                                                        <span className="text-cyan-500/50">"</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Run GEO Analysis CTA */}
                    <div className="mt-12 flex justify-center">
                        <button
                            onClick={onAnalyzeGeo}
                            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <div className="p-2.5 bg-cyan-500/20 rounded-lg">
                                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <h4 className="text-white font-bold text-lg leading-tight group-hover:text-cyan-300 transition-colors">Run GEO Analysis</h4>
                                <p className="text-sm text-cyan-200/60 mt-0.5 font-medium">Synthesize these results into actionable visibility intelligence</p>
                            </div>
                            <svg className="w-6 h-6 text-cyan-400/50 group-hover:text-cyan-400 transform group-hover:translate-x-1 transition-all ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EvaluationTab;
