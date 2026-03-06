import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const CATEGORY_OPTIONS = ['healthcare', 'education', 'finance', 'productivity', 'commerce', 'other'];

const splitCsv = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const splitLines = (value) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const toLandingProduct = (payload) => {
  const id = payload.productId || payload.id || payload.name.toLowerCase().replace(/\s+/g, '-');
  return {
    id,
    name: payload.name || 'Untitled Product',
    category: payload.category || 'other',
    desc: payload.shortDescription || payload.description || 'No description provided.',
    activeUsers: 'new',
  };
};

function AddProductPage() {
  const nav = useNavigate();
  const savedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const [form, setForm] = useState({
    authToken: localStorage.getItem('token') || '',
    userId: savedUser.userId || savedUser.id || '',
    name: '',
    shortDescription: '',
    description: '',
    category: 'healthcare',
    website: '',
    tags: '',
    features: '',
    technologies: '',
    githubUrl: '',
    pricingType: 'free',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!form.userId.trim()) {
        throw new Error('User ID is required.');
      }
      if (!form.name.trim() || !form.shortDescription.trim() || !form.description.trim()) {
        throw new Error('Name, short description, and full description are required.');
      }

      const payload = {
        userId: form.userId.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim(),
        category: form.category,
        tags: splitCsv(form.tags),
        website: form.website.trim(),
        features: splitLines(form.features),
        technologies: splitCsv(form.technologies),
        pricing: { type: form.pricingType },
        repositories: form.githubUrl.trim()
          ? [{ url: form.githubUrl.trim(), type: 'github' }]
          : [],
      };

      const reqConfig = form.authToken.trim()
        ? { headers: { Authorization: `Bearer ${form.authToken.trim()}` } }
        : {};

      const { data } = await api.post('/products', payload, reqConfig);
      const created = data?.data || {};

      if (form.authToken.trim()) {
        localStorage.setItem('token', form.authToken.trim());
      }

      const existing = JSON.parse(localStorage.getItem('landing_added_products') || '[]');
      const merged = [toLandingProduct(created), ...(Array.isArray(existing) ? existing : [])];
      const uniqueById = merged.filter(
        (item, idx, arr) => arr.findIndex((candidate) => candidate.id === item.id) === idx
      );
      localStorage.setItem('landing_added_products', JSON.stringify(uniqueById));

      const productRouteId = created.productId || toLandingProduct(created).id;
      nav(`/products/${productRouteId}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col landing-grid">
      <Navbar />
      <section className="pt-32 pb-20 px-4 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2">Add Product</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Create a New Product Listing</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Fill the required fields and submit. After success, you will be redirected to the product dashboard.
          </p>
        </div>

        <form onSubmit={onSubmit} className="glass-card p-6 md:p-8 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Authorization Token *</label>
            <input
              className="input-field"
              value={form.authToken}
              onChange={(e) => set('authToken', e.target.value)}
              placeholder="Paste Bearer token (without 'Bearer ')"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">User ID *</label>
            <input
              className="input-field"
              value={form.userId}
              onChange={(e) => set('userId', e.target.value)}
              placeholder="e.g. user-1772349339295-cynugebdt"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Product Name *</label>
              <input className="input-field" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Category *</label>
              <select className="input-field" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Short Description *</label>
            <input
              className="input-field"
              value={form.shortDescription}
              onChange={(e) => set('shortDescription', e.target.value)}
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Description *</label>
            <textarea
              rows={4}
              className="input-field resize-none"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Website</label>
            <input
              className="input-field"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://your-product.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags (comma separated)</label>
            <input
              className="input-field"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="ai, audio, india"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Features (one per line)</label>
            <textarea
              rows={4}
              className="input-field resize-none"
              value={form.features}
              onChange={(e) => set('features', e.target.value)}
              placeholder={'Feature one\nFeature two'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Technologies (comma separated)</label>
            <input
              className="input-field"
              value={form.technologies}
              onChange={(e) => set('technologies', e.target.value)}
              placeholder="Node.js, React, Edge AI"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">GitHub Repository</label>
              <input
                className="input-field"
                value={form.githubUrl}
                onChange={(e) => set('githubUrl', e.target.value)}
                placeholder="https://github.com/org/repo"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Pricing Type</label>
              <select className="input-field" value={form.pricingType} onChange={(e) => set('pricingType', e.target.value)}>
                <option value="free">free</option>
                <option value="freemium">freemium</option>
                <option value="paid">paid</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-3">
            <Link to="/">
              <button type="button" className="btn-outline px-5 py-2.5">Back</button>
            </Link>
            <button type="submit" className="btn-primary px-6 py-2.5" disabled={submitting}>
              {submitting ? 'Adding product...' : 'Add Product'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AddProductPage;
