import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import Loader from '../components/Loader';
import LiveSearchTab from '../components/LiveSearchTab';
import EvaluationTab from '../components/EvaluationTab';

function ProductDashboardPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [evaluationQuestions, setEvaluationQuestions] = useState([]);

  const handleStartEvaluation = (questions) => {
    setEvaluationQuestions(questions);
    setActiveTab('evaluation');
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/products/${productId}`);
        setProduct(data?.data || data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const productLabel = productId?.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ') || 'Product';

  return (
    <div className="min-h-screen flex flex-col landing-grid">
      <Navbar />
      <section className="pt-32 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto w-full">
        {loading ? (
          <div className="pt-20 flex justify-center">
            <Loader text="Loading product details..." />
          </div>
        ) : error ? (
          <div className="glass-card p-8 text-center mt-10">
            <p className="text-red-400 mb-4">{error}</p>
            <Link to="/">
              <button className="btn-outline px-6 py-2">Back to Landing Page</button>
            </Link>
          </div>
        ) : product ? (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="glass-card p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider">
                      {product.category || 'Category'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono bg-black/30 px-2 py-0.5 rounded">
                      {product.version || 'v1.0.0'}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{product.name}</h1>
                  <p className="text-lg text-slate-300 font-medium mb-4">{product.shortDescription}</p>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
                    {product.description}
                  </p>
                </div>
                {product.website && (
                  <div className="shrink-0">
                    <a href={product.website} target="_blank" rel="noreferrer">
                      <button className="btn-primary px-6 py-2.5 w-full md:w-auto">Visit Website</button>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-white/10 gap-6 px-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'overview' ? 'text-brand-light' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Overview
                {activeTab === 'overview' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-light rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('live-search')}
                className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'live-search' ? 'text-brand-light' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Live Search
                <span className="px-1.5 py-0.5 rounded bg-brand/20 text-brand-light text-[10px] font-bold">AI</span>
                {activeTab === 'live-search' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-light rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('evaluation')}
                className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'evaluation' ? 'text-brand-light' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Evaluation
                {activeTab === 'evaluation' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-light rounded-t-full" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className={activeTab === 'overview' ? 'block animate-fade-in' : 'hidden'}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                    Features
                  </h3>
                  {product.features?.length > 0 ? (
                    <ul className="space-y-3">
                      {product.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No features specified.</p>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                      Technologies
                    </h3>
                    {product.technologies?.length > 0 ? (
                      <div className="flex flex-wrap gap-2 text-sm text-slate-300">
                        {product.technologies.map((tech, i) => (
                          <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                            {tech}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No technologies specified.</p>
                    )}
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                      Tags
                    </h3>
                    {product.tags?.length > 0 ? (
                      <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                        {product.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-black/20 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No tags specified.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={activeTab === 'live-search' ? 'block animate-fade-in' : 'hidden'}>
              <div className="glass-card p-6 md:p-8">
                <LiveSearchTab
                  productId={product.productId || product.id}
                  productName={product.name}
                  onStartEvaluation={handleStartEvaluation}
                />
              </div>
            </div>

            <div className={activeTab === 'evaluation' ? 'block animate-fade-in' : 'hidden'}>
              <div className="glass-card p-6 md:p-8">
                <EvaluationTab
                  questions={evaluationQuestions}
                  onBack={() => setActiveTab('live-search')}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Link to="/">
                <button className="btn-outline px-6 py-2.5">Back to Home</button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass-card p-8 text-center mt-10">
            <h1 className="text-3xl font-bold text-white mb-4">{productLabel}</h1>
            <p className="text-slate-400 mb-8 mt-4">
              Failed to load product information. It might not exist or the ID is incorrect.
            </p>
            <Link to="/" className="inline-flex">
              <button className="btn-outline px-6 py-3">Back to Landing Page</button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default ProductDashboardPage;
