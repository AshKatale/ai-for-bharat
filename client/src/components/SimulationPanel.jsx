// SimulationPanel.jsx — Live step-by-step simulation display (no emojis)

const StepIcon = ({ status }) => {
    if (status === 'done') return (
        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
    );
    if (status === 'active') return (
        <span className="w-4 h-4 rounded-full border-2 border-brand flex items-center justify-center shrink-0">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse-dot" />
        </span>
    );
    return <span className="w-4 h-4 rounded-full border-2 border-slate-700 shrink-0 inline-block" />;
};

function SimulationPanel({ steps = [], title = 'Background Processing', className = '' }) {
    const hasActive = steps.some(s => s.status === 'active');
    const allDone = steps.length > 0 && steps.every(s => s.status === 'done');

    return (
        <div className={`glass-card p-5 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className={`p-2 rounded-lg ${allDone ? 'bg-emerald-500/15' : hasActive ? 'bg-brand/15' : 'bg-white/5'}`}>
                    {allDone ? (
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className={`w-5 h-5 ${hasActive ? 'text-brand-light animate-spin-slow' : 'text-slate-500'}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    )}
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {allDone ? 'All steps complete' : hasActive ? 'Processing...' : 'Waiting to start'}
                    </p>
                </div>
                {hasActive && (
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-brand-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                        Live
                    </span>
                )}
            </div>

            {/* Steps */}
            <div className="space-y-0">
                {steps.map((step, idx) => (
                    <div key={step.id}>
                        <div
                            className="flex items-start gap-3 py-2.5 animate-fade-slide"
                            style={{ animationDelay: `${idx * 0.04}s`, animationFillMode: 'both', opacity: 0 }}
                        >
                            <div className="mt-0.5"><StepIcon status={step.status} /></div>
                            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                <span className={`text-sm font-medium transition-colors duration-300 ${step.status === 'done' ? 'text-slate-300' :
                                        step.status === 'active' ? 'text-white' :
                                            'text-slate-600'
                                    }`}>
                                    {step.label}
                                </span>
                                {step.status === 'active' && (
                                    <span className="text-xs text-brand-light font-mono shrink-0">running...</span>
                                )}
                            </div>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="ml-2 w-px h-2.5 bg-white/[0.06]" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SimulationPanel;
