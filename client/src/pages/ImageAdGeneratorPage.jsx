import { useMemo, useState } from 'react';
import { Image as ImageIcon, Loader2, Sparkles, Wand2, SlidersHorizontal, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const IMAGE_AD_API = '/products/generate-image-ad';

const STYLES = ['PHOTOREALISM', 'DIGITAL_ART', 'ANIME'];
const TONES = ['Bold', 'Confident', 'Energetic', 'Professional', 'Minimalist'];
const LIGHTING_OPTIONS = ['Golden Hour', 'Studio Lighting', 'Neon', 'Natural Light'];
const COMPOSITIONS = ['Rule of Thirds', 'Centered', 'Close-up Product', 'Lifestyle Shot'];
const QUALITIES = ['standard', 'premium', 'extreme'];

const STYLE_FALLBACKS = {
  PHOTOREALISM: 'PHOTOREALISM',
  DIGITAL_ART: 'DIGITAL_ART',
  ANIME: 'ANIME',
  CINEMATIC: 'PHOTOREALISM',
  '3D_RENDER': 'DIGITAL_ART',
  PIXEL_ART: 'ANIME',
};

const DEFAULT_PREVIEW_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#111827"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#g)"/>
    <text x="512" y="485" text-anchor="middle" fill="#e2e8f0" font-family="Arial" font-size="52" font-weight="700">Image Preview</text>
    <text x="512" y="545" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="28">Generated image will appear here</text>
  </svg>`
)}`;

function extractImageUrl(payload) {
  const candidates = [
    payload?.data?.imageUrl,
    payload?.data?.image_url,
    payload?.data?.url,
    payload?.data?.presigned_url,
    payload?.data?.presigned_urls?.[0],
    payload?.imageUrl,
    payload?.image_url,
    payload?.url,
    payload?.presigned_url,
    payload?.presigned_urls?.[0],
    payload?.data?.images?.[0],
    payload?.images?.[0],
    payload?.data?.images?.[0]?.url,
    payload?.images?.[0]?.url,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value;
  }

  const base64Candidates = [
    payload?.data?.base64,
    payload?.data?.imageBase64,
    payload?.data?.image_base64,
    payload?.data?.b64_json,
    payload?.base64,
    payload?.b64_json,
  ];

  for (const value of base64Candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.startsWith('data:') ? value : `data:image/png;base64,${value}`;
    }
  }

  const s3Key = payload?.data?.s3_keys?.[0] || payload?.s3_keys?.[0];
  if (typeof s3Key === 'string' && s3Key.trim()) {
    return `https://reels-database.s3.amazonaws.com/${s3Key}`;
  }

  return null;
}

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
      {children}{required && <span className="text-brand-light ml-1">*</span>}
    </label>
  );
}

function Select({ value, options, onChange, placeholder, ariaLabel }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel || placeholder}
      className="input-field"
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

export default function ImageAdGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState(DEFAULT_PREVIEW_IMAGE);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    campaignGoal: '',
    targetAudience: '',
    tone: '',
    stylePreference: '',
    sceneType: '',
    lighting: '',
    composition: '',
    brandColors: ['#FF0000', '#000000', '#FFFFFF'],
    tagline: '',
    offerText: '',
    ctaText: '',
    style: 'PHOTOREALISM',
    width: 1024,
    height: 1024,
    quality: 'premium',
    cfgScale: 8,
    seed: 77,
    numberOfImages: 1,
  });

  const isValid = useMemo(
    () => !!(form.campaignGoal && form.targetAudience && form.tone && form.sceneType),
    [form]
  );

  const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleGenerate = async () => {
    if (!isValid || isLoading) return;
    setIsLoading(true);

    try {
      const payload = {
        ...form,
        style: STYLE_FALLBACKS[String(form.style || '').toUpperCase()] || 'PHOTOREALISM',
        width: Number(form.width),
        height: Number(form.height),
        cfgScale: Number(form.cfgScale),
        seed: Number(form.seed),
        numberOfImages: Number(form.numberOfImages),
        brandColors: (form.brandColors || []).filter(Boolean),
      };

      const response = await api.post(IMAGE_AD_API, payload);
      const imageUrl = extractImageUrl(response?.data);

      if (!imageUrl) {
        showToast(response?.data?.message || 'Image generated but no preview URL returned', 'error');
        return;
      }

      setResultImageUrl(imageUrl);
      showToast('Image generated successfully');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Image generation failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto text-slate-200">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-brand-light" /> AI Image Ad Generator
          </h1>
          <p className="text-sm text-slate-500 mt-1">Simple flow: choose preset, adjust details, generate.</p>
        </div>
        <div className="px-3 py-2 rounded-xl bg-brand/10 border border-brand/20 text-brand-light text-sm font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Quick & Accessible UI
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card p-4 grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label required>Campaign Goal</Label>
              <textarea
                rows={2}
                className="input-field resize-none"
                value={form.campaignGoal}
                onChange={(e) => setValue('campaignGoal', e.target.value)}
                placeholder="What do you want to achieve?"
              />
            </div>

            <div className="md:col-span-2">
              <Label required>Target Audience</Label>
              <input
                className="input-field"
                value={form.targetAudience}
                onChange={(e) => setValue('targetAudience', e.target.value)}
                placeholder="Who is this ad for?"
              />
            </div>

            <div>
              <Label required>Tone</Label>
              <Select value={form.tone} onChange={(v) => setValue('tone', v)} options={TONES} placeholder="Select tone" />
            </div>

            <div>
              <Label>Base Style</Label>
              <Select value={form.style} onChange={(v) => setValue('style', v)} options={STYLES} placeholder="Select style" />
            </div>

            <div className="md:col-span-2">
              <Label required>Scene Type</Label>
              <textarea
                rows={2}
                className="input-field resize-none"
                value={form.sceneType}
                onChange={(e) => setValue('sceneType', e.target.value)}
                placeholder="Describe the scene for the generated image"
              />
            </div>

            <div>
              <Label>Lighting</Label>
              <Select value={form.lighting} onChange={(v) => setValue('lighting', v)} options={LIGHTING_OPTIONS} placeholder="Select lighting" />
            </div>

            <div>
              <Label>Composition</Label>
              <Select value={form.composition} onChange={(v) => setValue('composition', v)} options={COMPOSITIONS} placeholder="Select composition" />
            </div>

            <div className="md:col-span-2">
              <Label>Style Preference</Label>
              <input
                className="input-field"
                value={form.stylePreference}
                onChange={(e) => setValue('stylePreference', e.target.value)}
                placeholder="Extra visual direction (optional)"
              />
            </div>

            <div>
              <Label>Tagline</Label>
              <input className="input-field" value={form.tagline} onChange={(e) => setValue('tagline', e.target.value)} />
            </div>
            <div>
              <Label>Offer Text</Label>
              <input className="input-field" value={form.offerText} onChange={(e) => setValue('offerText', e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <Label>CTA Text</Label>
              <input className="input-field" value={form.ctaText} onChange={(e) => setValue('ctaText', e.target.value)} placeholder="e.g. Shop Now" />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" /> {showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
              </button>
            </div>

            {showAdvanced && (
              <>
                <div>
                  <Label>Width</Label>
                  <input type="number" className="input-field" value={form.width} onChange={(e) => setValue('width', Number(e.target.value))} />
                </div>
                <div>
                  <Label>Height</Label>
                  <input type="number" className="input-field" value={form.height} onChange={(e) => setValue('height', Number(e.target.value))} />
                </div>
                <div>
                  <Label>Quality</Label>
                  <Select value={form.quality} onChange={(v) => setValue('quality', v)} options={QUALITIES} placeholder="Select quality" />
                </div>
                <div>
                  <Label>CFG Scale</Label>
                  <input type="number" className="input-field" value={form.cfgScale} onChange={(e) => setValue('cfgScale', Number(e.target.value))} />
                </div>
                <div>
                  <Label>Seed</Label>
                  <input type="number" className="input-field" value={form.seed} onChange={(e) => setValue('seed', Number(e.target.value))} />
                </div>
                <div>
                  <Label>No. of Images</Label>
                  <input type="number" min={1} max={4} className="input-field" value={form.numberOfImages} onChange={(e) => setValue('numberOfImages', Number(e.target.value))} />
                </div>
              </>
            )}

            <div className="md:col-span-2 pt-2">
              <button
                disabled={!isValid || isLoading}
                onClick={handleGenerate}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition
                ${isValid && !isLoading
                    ? 'bg-brand text-white hover:bg-brand-light'
                    : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'}`}
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Wand2 className="w-4 h-4" /> Generate Image</>}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 sticky top-24">
          <div className="glass-card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Preview</p>
            <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black/30 aspect-square">
              <img src={resultImageUrl} alt="Generated preview" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="glass-card p-4 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Tone</span><span className="text-slate-300">{form.tone || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Style</span><span className="text-slate-300">{form.style}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Lighting</span><span className="text-slate-300">{form.lighting || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Composition</span><span className="text-slate-300">{form.composition || '—'}</span></div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl flex items-center gap-2 border text-sm
              ${toast.type === 'error' ? 'bg-red-500/15 border-red-500/30 text-red-300' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'}`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
