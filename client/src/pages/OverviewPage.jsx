// OverviewPage.jsx — No emojis version
import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Link } from 'react-router-dom';

function StatCard({ label, value, gradient, icon }) {
  return (
    <div className={`glass-card p-5 bg-gradient-to-br ${gradient}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-white/5">{icon}</div>
      </div>
    </div>
  );
}

function OverviewPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    
    if (user?.id) {
      api.get(`/products/user/${user.id}`)
        .then(({ data }) => setProducts(data?.data || data || []))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, []);

  const stats = [
    {
      label: 'Total Products',
      value: products.length,
      gradient: 'from-green-500/15 to-green-600/5',
      icon: (
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: 'Active Listings',
      value: products.filter(p => p.status === 'active').length,
      gradient: 'from-emerald-500/15 to-emerald-600/5',
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Views',
      value: products.reduce((s, p) => s + (p.stats?.views || 0), 0),
      gradient: 'from-emerald-500/15 to-emerald-600/5',
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      label: 'Total Downloads',
      value: products.reduce((s, p) => s + (p.stats?.downloads || 0), 0),
      gradient: 'from-lime-500/15 to-lime-600/5',
      icon: (
        <svg className="w-5 h-5 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back to AI for Bharat</p>
      </div>

      {loading ? <Loader text="Loading stats..." /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-8">
        <div className="glass-card p-6 border border-brand/20 bg-brand/5">
          <h2 className="text-base font-semibold text-white mb-2">List Your Product</h2>
          <p className="text-sm text-slate-400 mb-4">
            Onboard your AI tool and reach thousands of Indian developers.
          </p>
          <Link to="/dashboard/add-product">
            <button className="btn-outline text-sm">Add Product</button>
          </Link>
        </div>
      </div>

      {/* Recent products */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Recent Products</h2>
        {loading ? <Loader text="Loading products..." /> : products.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <p className="text-slate-500 text-sm">No products listed yet.</p>
            <Link to="/dashboard/add-product"
              className="text-brand-light text-sm mt-2 inline-block hover:text-white transition-colors">
              Add the first one
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.slice(0, 5).map((p, i) => (
              <div key={p.productId || i} className="glass-card p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.category} · {p.status}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs text-slate-500">
                  <span>{p.stats?.views ?? 0} views</span>
                  <span>{p.stats?.downloads ?? 0} downloads</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OverviewPage;
