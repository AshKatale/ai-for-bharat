// ProductOnboardingPage.jsx — Multi-step form with real backend simulation (no emojis)
import { useState } from 'react';
import StepBadge from '../components/StepBadge';
import SimulationPanel from '../components/SimulationPanel';
import api from '../services/api';

const FORM_STEPS = ['Basic Info', 'Details & Tags', 'Links & Pricing', 'Review & Submit'];

const SAVE_STEPS_INIT = [
  { id: 'v1', label: 'Validating form fields', status: 'pending' },
  { id: 'v2', label: 'Authenticating session', status: 'pending' },
  { id: 'v3', label: 'Connecting to DynamoDB', status: 'pending' },
  { id: 'v4', label: 'Writing product record', status: 'pending' },
  { id: 'v5', label: 'Product saved successfully', status: 'pending' },
];

const CATEGORIES = ['ai-tool', 'platform', 'api', 'open-source', 'other'];

function ProductOnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', shortDescription: '', description: '', category: 'ai-tool',
    tags: '', technologies: '', version: '1.0.0', license: 'MIT',
    website: '', demo: '', docs: '', github: '',
    pricingModel: 'free', price: 0,
  });
  const [saveSteps, setSaveSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Get logged-in user's ID from localStorage
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();
  const userId = storedUser.id || '';

  const advanceSave = (idx) =>
    setSaveSteps(prev =>
      prev.map((s, i) => ({
        ...s,
        status: i === idx ? 'active' : i < idx ? 'done' : 'pending',
      }))
    );
  const finishSave = () =>
    setSaveSteps(prev => prev.map(s => ({ ...s, status: 'done' })));

  const runSave = async () => {
    setSaving(true);
    setError('');
    setSaveSteps(SAVE_STEPS_INIT.map(s => ({ ...s })));

    const delays = [300, 400, 500, 600, 400];

    for (let i = 0; i < delays.length - 1; i++) {
      advanceSave(i);
      await new Promise(r => setTimeout(r, delays[i]));
    }

    try {
      await api.post('/products', {
        userId,
        name: form.name,
        shortDescription: form.shortDescription,
        description: form.description,
        category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        technologies: form.technologies.split(',').map(t => t.trim()).filter(Boolean),
        version: form.version,
        license: form.license,
        website: form.website,
        links: { demo: form.demo, docs: form.docs },
        repositories: { frontend: form.github },
        pricing: { model: form.pricingModel, price: Number(form.price) },
      });
      finishSave();
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
      finishSave();
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setStep(0);
    setSaveSteps([]);
    setForm({
      name: '', shortDescription: '', description: '', category: 'ai-tool',
      tags: '', technologies: '', version: '1.0.0', license: 'MIT',
      website: '', demo: '', docs: '', github: '', pricingModel: 'free', price: 0,
    });
  };

  if (success) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-5 border border-emerald-500/30">
        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Product Listed!</h2>
      <p className="text-slate-400 text-sm mb-6">
        <span className="text-white font-medium">{form.name}</span> has been added to AI for Bharat.
      </p>
      <button className="btn-primary" onClick={resetForm}>Add Another</button>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">List Your Product</h1>
        <p className="text-sm text-slate-500 mt-1">Showcase your AI tool to Indian developers.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {FORM_STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all
                ${i === step ? 'bg-brand/20 text-brand-light border border-brand/30' :
                  i < step ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer' :
                    'text-slate-600 border border-white/[0.08]'}`}
            >
              {i < step ? 'Done · ' : `${i + 1}. `}{s}
            </button>
            {i < FORM_STEPS.length - 1 && <span className="text-slate-700 text-xs">›</span>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-base font-semibold text-white">{FORM_STEPS[step]}</h2>
            <StepBadge label={FORM_STEPS[step]} active={true} />
          </div>

          {/* Step 0 — Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Product Name *</label>
                <input className="input-field" placeholder="e.g. BharatGPT"
                  value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Short Description *</label>
                <input className="input-field" placeholder="One-line pitch (max 120 chars)"
                  value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} maxLength={120} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Description</label>
                <textarea className="input-field resize-none" rows={4}
                  placeholder="Tell developers what your product does..."
                  value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 1 — Details & Tags */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags (comma-separated)</label>
                <input className="input-field" placeholder="nlp, multilingual, chatbot, hindi"
                  value={form.tags} onChange={e => set('tags', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Technologies (comma-separated)</label>
                <input className="input-field" placeholder="Python, FastAPI, PyTorch, React"
                  value={form.technologies} onChange={e => set('technologies', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Version</label>
                  <input className="input-field" placeholder="1.0.0"
                    value={form.version} onChange={e => set('version', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">License</label>
                  <select className="input-field" value={form.license} onChange={e => set('license', e.target.value)}>
                    {['MIT', 'Apache 2.0', 'GPL', 'Commercial', 'Proprietary'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Links & Pricing */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Website URL</label>
                <input className="input-field" placeholder="https://yourproduct.in"
                  value={form.website} onChange={e => set('website', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Live Demo URL</label>
                <input className="input-field" placeholder="https://demo.yourproduct.in"
                  value={form.demo} onChange={e => set('demo', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Docs URL</label>
                <input className="input-field" placeholder="https://docs.yourproduct.in"
                  value={form.docs} onChange={e => set('docs', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">GitHub URL</label>
                <input className="input-field" placeholder="https://github.com/you/repo"
                  value={form.github} onChange={e => set('github', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Pricing Model</label>
                  <select className="input-field" value={form.pricingModel} onChange={e => set('pricingModel', e.target.value)}>
                    {['free', 'freemium', 'paid'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                {form.pricingModel === 'paid' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Price (USD)</label>
                    <input className="input-field" type="number" min={0} placeholder="9"
                      value={form.price} onChange={e => set('price', e.target.value)} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="glass-card p-4 bg-white/[0.03] space-y-2">
                {[
                  ['Name', form.name],
                  ['Category', form.category],
                  ['Tags', form.tags || '—'],
                  ['Technologies', form.technologies || '—'],
                  ['Pricing', `${form.pricingModel}${form.pricingModel === 'paid' ? ` · $${form.price}` : ''}`],
                  ['Demo', form.demo || '—'],
                  ['GitHub', form.github || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start gap-3">
                    <span className="text-xs text-slate-500 w-28 shrink-0">{k}</span>
                    <span className="text-xs text-slate-200 break-all">{v}</span>
                  </div>
                ))}
              </div>
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/[0.06]">
            {step > 0 ? (
              <button className="btn-ghost text-sm" onClick={() => setStep(s => s - 1)}>Back</button>
            ) : <span />}
            {step < FORM_STEPS.length - 1 ? (
              <button
                className="btn-primary text-sm"
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 && !form.name.trim()}
              >
                Next
              </button>
            ) : (
              <button className="btn-primary text-sm" onClick={runSave} disabled={saving}>
                {saving ? 'Submitting...' : 'Submit Product'}
              </button>
            )}
          </div>
        </div>

        {/* Simulation panel */}
        <div className="lg:col-span-2">
          {saveSteps.length > 0 ? (
            <SimulationPanel steps={saveSteps} title="Saving to Backend" />
          ) : (
            <div className="glass-card p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm text-slate-400">
                The backend operation panel will appear here when you submit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductOnboardingPage;
