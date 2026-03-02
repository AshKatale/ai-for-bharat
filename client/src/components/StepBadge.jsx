// StepBadge.jsx — no emojis
function StepBadge({ label, active = false }) {
    if (!label) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium
      transition-all duration-300
      ${active
                ? 'bg-brand/15 text-brand-light border border-brand/25'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
        >
            {active ? (
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            )}
            {label}
        </span>
    );
}

export default StepBadge;
