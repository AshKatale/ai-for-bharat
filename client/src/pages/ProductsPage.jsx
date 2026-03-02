// ProductsPage.jsx — Browse all listed products
import { useEffect, useState } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const CATEGORIES = ['all', 'ai-tool', 'platform', 'api', 'open-source', 'other'];

function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/products')
            .then(({ data }) => {
                const list = data?.data || data || [];
                setProducts(list);
                setFiltered(list);
            })
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let list = [...products];
        if (category !== 'all') list = list.filter(p => p.category === category);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                (p.tags || []).some(t => t.toLowerCase().includes(q))
            );
        }
        setFiltered(list);
    }, [category, search, products]);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">All Products</h1>
                <p className="text-sm text-slate-500 mt-1">Browse India's AI tools, platforms and APIs.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <input
                    type="text"
                    className="input-field max-w-xs text-sm"
                    placeholder="Filter by name or tag…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map(c => (
                        <button
                            key={c}
                            onClick={() => setCategory(c)}
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all capitalize
                ${category === c
                                    ? 'bg-brand/20 text-brand-light border-brand/30'
                                    : 'text-slate-500 border-white/[0.08] hover:border-slate-600 hover:text-slate-300'
                                }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <Loader text="Loading products…" />
            ) : filtered.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <p className="text-slate-500 text-sm">No products found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((p, i) => (
                        <ProductCard key={p.productId || i} product={p} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProductsPage;
