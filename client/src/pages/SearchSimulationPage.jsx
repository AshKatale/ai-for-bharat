// SearchSimulationPage.jsx — Real SSE-based live search simulation
import { useState, useRef } from 'react';
import SimulationPanel from '../components/SimulationPanel';
import ProductCard from '../components/ProductCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const INITIAL_STEPS = [
    { id: 's1', label: 'Query received', status: 'pending' },
    { id: 's2', label: 'Parsing query intent', status: 'pending' },
    { id: 's3', label: 'Connecting to DynamoDB', status: 'pending' },
    { id: 's4', label: 'Fetching products', status: 'pending' },
    { id: 's5', label: 'Filtering results', status: 'pending' },
    { id: 's6', label: 'Ranking by engagement score', status: 'pending' },
    { id: 's7', label: 'Results ready', status: 'pending' },
];

function SearchSimulationPage() {
    const [query, setQuery] = useState('');
    const [steps, setSteps] = useState(INITIAL_STEPS);
    const [results, setResults] = useState([]);
    const [started, setStarted] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    const esRef = useRef(null);

    const updateStep = (id, patch) =>
        setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));

    const runSearch = (q) => {
        // Close any existing connection
        if (esRef.current) esRef.current.close();

        setStarted(true);
        setDone(false);
        setError('');
        setResults([]);
        setSteps(INITIAL_STEPS);

        const url = `${API_BASE}/api/products/search/stream?q=${encodeURIComponent(q)}`;
        const es = new EventSource(url);
        esRef.current = es;

        es.onmessage = (e) => {
            let data;
            try { data = JSON.parse(e.data); } catch { return; }

            if (data.type === 'step') {
                // Update the label if backend sends a richer one (e.g. "Fetched 42 products")
                updateStep(data.id, { status: data.status, label: data.label || undefined });
            } else if (data.type === 'result') {
                setResults(data.results || []);
                setDone(true);
                es.close();
            } else if (data.type === 'error') {
                setError(data.message || 'Search failed.');
                setDone(true);
                es.close();
            }
        };

        es.onerror = () => {
            setError('Lost connection to backend. Is the server running on port 5000?');
            setDone(true);
            es.close();
        };
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) runSearch(query.trim());
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Live Search</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Every step below reflects a real operation happening on the backend right now.
                </p>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        className="input-field pl-10"
                        placeholder="Search products by name, category or tag..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <button type="submit" className="btn-primary px-6" disabled={!query.trim()}>
                    Search
                </button>
            </form>

            {/* Empty state */}
            {!started && (
                <div className="glass-card p-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h2 className="text-base font-semibold text-white mb-2">Start your search</h2>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        Type a query and hit Search. The panel on the left will show every real
                        backend operation as it happens — no fake delays.
                    </p>
                </div>
            )}

            {/* Live layout: simulation | results */}
            {started && (
                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Simulation panel */}
                    <div className="lg:col-span-2 space-y-4">
                        <SimulationPanel steps={steps} title="Backend Operations" className="sticky top-6" />

                        <div className="glass-card p-4">
                            <p className="text-xs text-slate-500 mb-1 font-medium">Query</p>
                            <p className="text-sm text-white font-mono break-all">"{query}"</p>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="lg:col-span-3 space-y-4">
                        {!done && (
                            <div className="glass-card p-6 text-center">
                                <div className="w-7 h-7 rounded-full border-2 border-brand/20 border-t-brand animate-spin mx-auto mb-3" />
                                <p className="text-sm text-slate-500">Processing...</p>
                            </div>
                        )}

                        {done && error && (
                            <div className="glass-card p-5 bg-red-500/5 border border-red-500/20">
                                <p className="text-sm font-medium text-red-400 mb-1">Backend error</p>
                                <p className="text-xs text-slate-500">{error}</p>
                            </div>
                        )}

                        {done && !error && (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-400">
                                    {results.length === 0
                                        ? 'No products matched your query.'
                                        : `${results.length} product${results.length !== 1 ? 's' : ''} found`}
                                </p>
                                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Complete
                                </span>
                            </div>
                        )}

                        {done && results.map((product, i) => (
                            <ProductCard key={product.productId || i} product={product} index={i} />
                        ))}

                        {done && results.length === 0 && !error && (
                            <div className="glass-card p-10 text-center">
                                <p className="text-slate-500 text-sm">
                                    No products matched "<span className="text-white">{query}</span>".
                                    Try a different keyword or add products first.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchSimulationPage;
