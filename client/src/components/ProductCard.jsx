// ProductCard.jsx — no emojis, uses text labels for stats
import { useNavigate } from 'react-router-dom';
function StatBadge({ label, value }) {
    return (
        <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-xs font-medium text-slate-300">{value}</span>
        </div>
    );
}

function CategoryBadge({ category }) {
    const colors = {
        'ai-tool': 'bg-green-500/15 text-green-300 border-green-500/20',
        'platform': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
        'api': 'bg-lime-500/15 text-lime-300 border-lime-500/20',
        'open-source': 'bg-teal-500/15 text-teal-300 border-teal-500/20',
        'other': 'bg-slate-500/15 text-slate-300 border-slate-500/20',
    };
    const cls = colors[category] || colors['other'];
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${cls}`}>
            {category}
        </span>
    );
}

function ProductCard({ product, index = 0 }) {
    const navigate = useNavigate();
    const {
        name = '',
        shortDescription = '',
        category = 'other',
        tags = [],
        stats = {},
        pricing = {},
        links = {},
        repositories = {},
        technologies = [],
    } = product;

    const handleClick = () => {
        const id = product.productId || product.id;
        localStorage.setItem('selectedProductId', id);
        navigate(`/products/${id}/dashboard`);
    };

    return (
        <div
            onClick={handleClick}
            className="glass-card flex flex-col h-full hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-shadow duration-300 animate-fade-slide relative overflow-hidden group cursor-pointer"
            style={{ animationDelay: `${index * 0.07}s`, animationFillMode: 'both' }}
        >

            <div className="p-5 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-base font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">{name}</h3>
                            <CategoryBadge category={category} />
                            {pricing.model === 'free' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium z-20 relative">
                                    Free
                                </span>
                            )}
                            {pricing.model === 'paid' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium z-20 relative">
                                    ${pricing.price}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 relative z-20">
                            {shortDescription}
                        </p>
                    </div>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4 relative z-20">
                        {tags.slice(0, 5).map(tag => (
                            <span key={tag}
                                className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/[0.08]">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-auto">
                    {/* Stats */}
                    <div className="flex items-center gap-5 py-3 border-t border-b border-white/[0.06] mb-4 relative z-20">
                        <StatBadge label="Downloads" value={stats.downloads ?? 0} />
                        <StatBadge label="Stars" value={stats.stars ?? 0} />
                        <StatBadge label="Views" value={stats.views ?? 0} />
                        <StatBadge label="Users" value={stats.users ?? 0} />
                    </div>

                    {/* Tech stack */}
                    {technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4 relative z-20">
                            {technologies.slice(0, 4).map(t => (
                                <span key={t}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand-light border border-brand/20 font-mono">
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Links */}
                    <div className="flex items-center gap-2 flex-wrap relative z-20">
                        {links.demo && (
                            <a href={links.demo} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="btn-primary text-xs py-1.5 px-3">
                                Live Demo
                            </a>
                        )}
                        {repositories.frontend && (
                            <a href={repositories.frontend} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="btn-outline text-xs py-1.5 px-3">
                                GitHub
                            </a>
                        )}
                        {links.docs && (
                            <a href={links.docs} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="btn-ghost text-xs py-1.5 px-3">
                                Docs
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
