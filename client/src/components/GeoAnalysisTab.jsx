import { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:8080/api';

const SIMULATION_STEPS = [
    "Compiling market visibility metrics...",
    "Synthesizing cross-model product ranks...",
    "Extracting competitor dominance patterns...",
    "Generating actionable improvement signals...",
    "Finalizing GEO intelligence report..."
];

function GeoAnalysisTab({ evaluationResults, productName }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysisData, setAnalysisData] = useState(null);
    const [simStep, setSimStep] = useState(0);
    const [expandedStates, setExpandedStates] = useState({});
    const analyzedSigRef = useRef(null);

    const toggleExpand = (index) => {
        setExpandedStates(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    useEffect(() => {
        if (evaluationResults && evaluationResults.results?.length > 0) {
            const sig = evaluationResults.results.map(r => r.question_number).join('|');
            if (sig !== analyzedSigRef.current) {
                analyzedSigRef.current = sig;
                runGeoAnalysis(evaluationResults.results);
            }
        }
    }, [evaluationResults]);

    useEffect(() => {
        let interval;
        if (loading) {
            interval = setInterval(() => {
                setSimStep(prev => (prev < SIMULATION_STEPS.length - 1 ? prev + 1 : prev));
            }, 1200);
        } else {
            setSimStep(SIMULATION_STEPS.length); // complete
        }
        return () => clearInterval(interval);
    }, [loading]);

    const runGeoAnalysis = async (resultsData) => {
        setLoading(true);
        setError('');
        setAnalysisData(null);
        setSimStep(0);

        try {
            // Simplify results to just the text answers mappings to save payload overhead
            const simplifiedResults = resultsData.map(res => ({
                question_number: res.question_number,
                question: res.question,
                gpt: res.gpt?.answer || '',
                gemini: res.gemini?.answer || '',
                nova_pro: res.nova_pro?.answer || ''
            }));

            const res = await fetch(`${API_BASE}/geo/analyze-geo-results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    results: simplifiedResults,
                    product_name: productName || 'Unknown' 
                })
            });
            const json = await res.json();

            if (json.success && json.analysis) {
                setAnalysisData(json.analysis);
            } else {
                setError(json.message || 'GEO Analysis failed to return valid data.');
            }
        } catch (err) {
            setError('Could not reach the GEO Analysis API at localhost:8080.');
        } finally {
            setLoading(false);
        }
    };

    if (!evaluationResults || !evaluationResults.results || evaluationResults.results.length === 0) {
        return (
            <div className="text-center py-20 text-slate-500">
                <p>No evaluation results available for analysis. Please run an evaluation first.</p>
            </div>
        );
    }

    // Render logic goes here
    return (
        <div className="w-full animate-fade-in">
            <div className="mb-8">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Generative Engine Optimization (GEO) Analysis
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                    Analyzing visibility and sentiment across {evaluationResults.results.length} evaluated queries for <span className="text-brand-light font-medium">{productName || 'this product'}</span>.
                </p>
            </div>

            {loading && (
                <div className="glass-card p-12 mb-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                    <div className="absolute inset-0 bg-brand/5 animate-pulse" />
                    <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-brand/20 border-2 border-brand/40 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-spin-slow">
                            <svg className="w-8 h-8 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <div className="w-full bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-xs text-brand-light">
                            <div className="space-y-2">
                                {SIMULATION_STEPS.map((step, idx) => (
                                    <div
                                        key={idx}
                                        className={`transition-all duration-300 flex items-center gap-2 ${idx === simStep ? 'opacity-100 text-brand-light' : idx < simStep ? 'opacity-50 text-slate-500' : 'opacity-0 h-0 overflow-hidden'}`}
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

            {error && !loading && (
                <div className="glass-card p-6 bg-red-500/10 border-red-500/20 text-center mb-8">
                    <p className="text-red-400 font-medium mb-4">{error}</p>
                    <button onClick={() => runGeoAnalysis(evaluationResults.results)} className="btn-outline px-6 py-2">Retry GEO Analysis</button>
                </div>
            )}

            {analysisData && !loading && (
                <div className="space-y-8 animate-fade-slide">
                    
                    {/* OVERVIEW METRICS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass-card p-5 border-t-2 border-t-cyan-400">
                            <p className="text-sm font-medium text-slate-400 mb-1">Visibility Score</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-black text-white">{analysisData.overview.visibilityScore}</h3>
                                <span className="text-cyan-400 text-sm font-bold mb-1">/ 100</span>
                            </div>
                        </div>
                        <div className="glass-card p-5 border-t-2 border-t-brand-light">
                            <p className="text-sm font-medium text-slate-400 mb-1">Avg. AI Rank</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-black text-white">#{analysisData.overview.averageAIRank}</h3>
                            </div>
                        </div>
                        <div className="glass-card p-5 border-t-2 border-t-amber-400">
                            <p className="text-sm font-medium text-slate-400 mb-1">Positive Mentions</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-black text-white">{analysisData.overview.positiveMentionRate}%</h3>
                            </div>
                        </div>
                        <div className="glass-card p-5 border-t-2 border-t-purple-400">
                            <p className="text-sm font-medium text-slate-400 mb-1">Competitor Dominance</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-black text-white">{analysisData.overview.competitorDominanceScore}</h3>
                                <span className="text-purple-400 text-sm font-bold mb-1">/ 100</span>
                            </div>
                        </div>
                    </div>

                    {/* TWO COLUMN LAYOUT: INSIGHTS & SIGNALS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Competitor Patterns */}
                        <div className="glass-card p-6 md:p-8">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Competitor Strength Patterns
                            </h3>
                            <div className="space-y-4">
                                {analysisData.insights.competitorStrengthPatterns.map((pattern, idx) => (
                                    <div key={idx} className="bg-purple-500/5 border border-purple-500/10 p-4 rounded-xl flex gap-4">
                                        <div className="mt-1 flex-shrink-0">
                                            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/30">
                                                {idx + 1}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed">{pattern}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Improvement Signals */}
                        <div className="glass-card p-6 md:p-8">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Actionable Improvement Signals
                            </h3>
                            <div className="space-y-4">
                                {analysisData.insights.improvementSignals.map((signal, idx) => {
                                    // Bolding the prefix if present (e.g., "Enhance 'budget premium' messaging:")
                                    const parts = signal.split(':');
                                    return (
                                        <div key={idx} className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-xl flex items-start gap-4">
                                            <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-sm text-slate-300 leading-relaxed">
                                                {parts.length > 1 ? (
                                                    <>
                                                        <strong className="text-cyan-200 font-semibold">{parts[0]}:</strong>
                                                        {parts.slice(1).join(':')}
                                                    </>
                                                ) : (
                                                    signal
                                                )}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* PER QUESTION BREAKDOWN */}
                    <div className="glass-card p-6 md:p-8">
                        <h3 className="text-xl font-bold text-white mb-6">Per-Question Intelligence</h3>
                        <div className="space-y-4">
                            {analysisData.perQuestionAnalysis.map((qAnalysis, idx) => (
                                <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                                    <div 
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors"
                                        onClick={() => toggleExpand(idx)}
                                    >
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-brand-light font-bold text-sm">Q{idx + 1}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider
                                                    ${qAnalysis.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' : 
                                                      qAnalysis.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' : 
                                                      'bg-slate-500/20 text-slate-300'}`}
                                                >
                                                    {qAnalysis.sentiment}
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-white/10 text-slate-300">
                                                    Rank: #{qAnalysis.aiRank}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-white">{qAnalysis.question}</p>
                                        </div>
                                        <button className="flex-shrink-0 text-slate-400 hover:text-white transition-colors">
                                            <svg className={`w-5 h-5 transform transition-transform duration-300 ${expandedStates[idx] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    {/* Expanded Details */}
                                    {expandedStates[idx] && (
                                        <div className="p-4 border-t border-white/5 bg-black/20">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Models Mentioned In</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {qAnalysis.modelsMentioned.map(model => (
                                                            <span key={model} className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10">
                                                                {model.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        ))}
                                                        {qAnalysis.modelsMentioned.length === 0 && <span className="text-xs text-slate-500">None</span>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Competitors Ranked Above</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {qAnalysis.competitorsAbove.map(comp => (
                                                            <span key={comp} className="text-xs px-2.5 py-1 rounded-md bg-red-500/10 text-red-300 border border-red-500/20">
                                                                {comp}
                                                            </span>
                                                        ))}
                                                        {qAnalysis.competitorsAbove.length === 0 && <span className="text-xs text-emerald-400">None! Ranked #1</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

export default GeoAnalysisTab;
