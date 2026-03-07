import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import Loader from '../components/Loader';
import LiveSearchTab from '../components/LiveSearchTab';
import EvaluationTab from '../components/EvaluationTab';
import GeoAnalysisTab from '../components/GeoAnalysisTab';
import Sidebar from '../components/Sidebar';
import ImageAdGeneratorPage from './ImageAdGeneratorPage';
import VideoAdGeneratorPage from './VideoAdGeneratorPage';
import PostGeneratorPage from './PostGeneratorPage';

function ProductDashboardPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [evaluationQuestions, setEvaluationQuestions] = useState([]);
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [geoSubTab, setGeoSubTab] = useState('geo-live-search');

  // Product Settings form state
  const [settingsForm, setSettingsForm] = useState({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ type: '', text: '' });
  const fetchedProductIdRef = useRef(null);

  const handleStartEvaluation = (questions) => {
    setEvaluationQuestions(questions);
    setActiveTab('evaluation');
  };

  useEffect(() => {
    if (!productId || productId === fetchedProductIdRef.current) return;
    fetchedProductIdRef.current = productId;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/products/${productId}`);
        const p = data?.data || data;
        setProduct(p);
        setSettingsForm({
          name: p.name || '',
          shortDescription: p.shortDescription || '',
          description: p.description || '',
          category: p.category || '',
          version: p.version || '',
          website: p.website || '',
          tags: (p.tags || []).join(', '),
          features: (p.features || []).join('\n'),
          technologies: (p.technologies || []).join(', '),
        });
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMsg({ type: '', text: '' });
    try {
      await api.put(`/products/${productId}`, {
        ...settingsForm,
        tags: settingsForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        features: settingsForm.features.split('\n').map(f => f.trim()).filter(Boolean),
        technologies: settingsForm.technologies.split(',').map(t => t.trim()).filter(Boolean),
      });
      setSettingsMsg({ type: 'success', text: 'Product updated successfully.' });
      // Refresh product
      const { data } = await api.get(`/products/${productId}`);
      setProduct(data?.data || data);
    } catch (err) {
      setSettingsMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save changes.' });
    } finally {
      setSettingsSaving(false);
    }
  };

  const productLabel = productId?.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ') || 'Product';
  const isFullPageTab = ['overview', 'image-generator', 'video-generator', 'post-generator', 'geo-analysis', 'sentiment-analysis', 'product-settings'].includes(activeTab);

  return (
    <div className="min-h-screen flex landing-grid">
      <Sidebar variant="product" onTabChange={setActiveTab} activeTab={activeTab} />
      <div className="flex flex-col flex-1 ml-60 min-h-screen">
      <Navbar showAuth={false} showDashboard={true} />
      <section className={`pt-24 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto w-full${isFullPageTab ? ' hidden' : ''}`}>
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
            {/* Compact Product Header */}
            <div className="glass-card px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/40 to-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                  <span className="text-white text-base font-bold">{product.name?.[0]?.toUpperCase() || 'P'}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-bold text-white truncate">{product.name}</h1>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider shrink-0">{product.category || 'Uncategorized'}</span>
                    <span className="text-[10px] text-slate-500 font-mono bg-black/30 px-2 py-0.5 rounded shrink-0">{product.version || 'v1.0.0'}</span>
                    {product.status && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                        product.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-700/40 text-slate-400 border-slate-600/30'
                      }`}>{product.status}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5 truncate max-w-xl">{product.shortDescription}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {product.website && (
                  <a href={product.website} target="_blank" rel="noreferrer">
                    <button className="btn-primary px-4 py-1.5 text-sm">Visit Website</button>
                  </a>
                )}

              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-white/10 gap-6 px-2 overflow-x-auto">
              {[{id:'live-search',label:'Live Search',badge:'AI'},{id:'evaluation',label:'Evaluation'}].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 shrink-0 ${
                    activeTab === tab.id ? 'text-brand-light' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  {tab.badge && <span className="px-1.5 py-0.5 rounded bg-brand/20 text-brand-light text-[10px] font-bold">{tab.badge}</span>}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-light rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className={activeTab === 'live-search' ? 'block animate-fade-in' : 'hidden'}>
              <div className="glass-card p-6 md:p-8">
                <LiveSearchTab
                  productId={product.productId || product.id}
                  productName={product.name}
                  onStartEvaluation={handleStartEvaluation}
                />
              </div>
            </div>

            {activeTab === 'evaluation' && (
              <div className="animate-fade-in">
                <div className="glass-card p-6 md:p-8">
                  <EvaluationTab
                    questions={evaluationQuestions}
                    onBack={() => setActiveTab('live-search')}
                    onEvaluationComplete={(results) => { setEvaluationResults(results); }}
                    onAnalyzeGeo={() => { setActiveTab('geo-analysis'); setGeoSubTab('geo-result'); }}
                  />
                </div>
              </div>
            )}

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

      {/* Overview full page */}
      {activeTab === 'overview' && product && (
        <div className="pt-24 pb-10 px-4 md:px-8 max-w-[1600px] mx-auto w-full space-y-6">
          {/* Compact Product Header */}
          <div className="glass-card px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/40 to-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                <span className="text-white text-base font-bold">{product.name?.[0]?.toUpperCase() || 'P'}</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-white truncate">{product.name}</h1>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider shrink-0">{product.category || 'Uncategorized'}</span>
                  <span className="text-[10px] text-slate-500 font-mono bg-black/30 px-2 py-0.5 rounded shrink-0">{product.version || 'v1.0.0'}</span>
                  {product.status && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                      product.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-700/40 text-slate-400 border-slate-600/30'
                    }`}>{product.status}</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-0.5 truncate max-w-xl">{product.shortDescription}</p>
              </div>
            </div>
            {product.website && (
              <a href={product.website} target="_blank" rel="noreferrer" className="shrink-0">
                <button className="btn-primary px-4 py-1.5 text-sm">Visit Website</button>
              </a>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Features</h3>
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
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Technologies</h3>
                {product.technologies?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 text-sm text-slate-300">
                    {product.technologies.map((tech, i) => (
                      <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">{tech}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No technologies specified.</p>
                )}
              </div>
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Tags</h3>
                {product.tags?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                    {product.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-black/20 rounded">#{tag}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No tags specified.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GEO Analysis full page */}
      {activeTab === 'geo-analysis' && product && (
        <div className="pt-24 pb-10 px-4 md:px-8 max-w-[1600px] mx-auto w-full space-y-6">
          {/* Sub-tabs: GEO Analysis first, then Live Search, Evaluation */}
          <div className="flex border-b border-white/10 gap-6 px-2 mb-6">
            {[
              
              { id: 'geo-live-search', label: 'Live Search', badge: 'AI' },
              { id: 'geo-evaluation', label: 'Evaluation' },
              { id: 'geo-result', label: 'GEO Analysis' },
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setGeoSubTab(sub.id)}
                className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 shrink-0 ${
                  geoSubTab === sub.id
                    ? sub.id === 'geo-result' ? 'text-cyan-400' : 'text-brand-light'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sub.label}
                {sub.badge && <span className="px-1.5 py-0.5 rounded bg-brand/20 text-brand-light text-[10px] font-bold">{sub.badge}</span>}
                {geoSubTab === sub.id && (
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full ${
                    sub.id === 'geo-result' ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-brand-light'
                  }`} />
                )}
              </button>
            ))}
          </div>
          {geoSubTab === 'geo-live-search' && (
            <div className="glass-card p-6 md:p-8">
              <LiveSearchTab
                productId={product.productId || product.id}
                productName={product.name}
                onStartEvaluation={(questions) => { setEvaluationQuestions(questions); setGeoSubTab('geo-evaluation'); }}
              />
            </div>
          )}
          {geoSubTab === 'geo-evaluation' && (
            <div className="glass-card p-6 md:p-8">
              <EvaluationTab
                questions={evaluationQuestions}
                onBack={() => setGeoSubTab('geo-live-search')}
                onEvaluationComplete={(results) => { setEvaluationResults(results); }}
                onAnalyzeGeo={() => setGeoSubTab('geo-result')}
              />
            </div>
          )}
          {geoSubTab === 'geo-result' && (
            <div className="glass-card p-6 md:p-8">
              <GeoAnalysisTab evaluationResults={evaluationResults} productName={product.name} />
            </div>
          )}
        </div>
      )}

      {/* Sentiment Analysis full page */}
      {activeTab === 'sentiment-analysis' && (
        <div className="pt-24 pb-10 px-4 md:px-8 max-w-[1600px] mx-auto w-full">
          <div className="glass-card p-10 flex flex-col items-center justify-center gap-4 min-h-[320px]">
            <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-semibold text-white">Sentiment Analysis</p>
            <p className="text-sm text-slate-500">Coming soon — sentiment insights will appear here.</p>
          </div>
        </div>
      )}

      {/* Product Settings full page */}
      {activeTab === 'product-settings' && (
        <div className="pt-24 pb-10 px-4 md:px-8 max-w-[1600px] mx-auto w-full">
          <div className="glass-card p-6 md:p-8">
            <h2 className="text-base font-semibold text-white mb-6 border-b border-white/10 pb-3">Edit Product Details</h2>
            <form onSubmit={handleSettingsSave} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Product Name *</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/50"
                    value={settingsForm.name || ''}
                    onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/50"
                    value={settingsForm.category || ''}
                    onChange={e => setSettingsForm(f => ({ ...f, category: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Version</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/50"
                    value={settingsForm.version || ''}
                    onChange={e => setSettingsForm(f => ({ ...f, version: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Website URL</label>
                  <input
                    type="url"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/50"
                    value={settingsForm.website || ''}
                    onChange={e => setSettingsForm(f => ({ ...f, website: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Short Description</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/50"
                  value={settingsForm.shortDescription || ''}
                  onChange={e => setSettingsForm(f => ({ ...f, shortDescription: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/50 resize-none"
                  value={settingsForm.description || ''}
                  onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Tags <span className="normal-case text-slate-600">(comma-separated)</span></label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/50"
                    placeholder="ai, saas, productivity"
                    value={settingsForm.tags || ''}
                    onChange={e => setSettingsForm(f => ({ ...f, tags: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Technologies <span className="normal-case text-slate-600">(comma-separated)</span></label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/50"
                    placeholder="React, Node.js, Python"
                    value={settingsForm.technologies || ''}
                    onChange={e => setSettingsForm(f => ({ ...f, technologies: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Features <span className="normal-case text-slate-600">(one per line)</span></label>
                <textarea
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/50 resize-none"
                  placeholder="Feature one&#10;Feature two"
                  value={settingsForm.features || ''}
                  onChange={e => setSettingsForm(f => ({ ...f, features: e.target.value }))}
                />
              </div>
              {settingsMsg.text && (
                <p className={`text-sm ${settingsMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {settingsMsg.text}
                </p>
              )}
              <div className="flex justify-end">
                <button type="submit" disabled={settingsSaving} className="btn-primary px-6 py-2 text-sm disabled:opacity-50">
                  {settingsSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generator panels */}
      {activeTab === 'image-generator' && (
        <div className="pt-24 pb-10 px-4 md:px-8">
          <ImageAdGeneratorPage />
        </div>
      )}
      {activeTab === 'video-generator' && (
        <div className="pt-24 pb-10 px-4 md:px-8">
          <VideoAdGeneratorPage />
        </div>
      )}
      {activeTab === 'post-generator' && (
        <div className="pt-24 pb-10 px-4 md:px-8">
          <PostGeneratorPage productId={productId} />
        </div>
      )}
      </div>
    </div>
  );
}

export default ProductDashboardPage;
