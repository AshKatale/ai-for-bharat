// ImageAdGeneratorPage.jsx — AI Marketing Image Generator
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Image, Target, Mic, MousePointerClick, Palette,
    Settings2, ChevronDown, ChevronRight, Loader2,
    CheckCircle2, AlertCircle, Zap, Sparkles,
    BarChart2, Sun, Layout, Layers, Box, Maximize, Monitor, FileText
} from 'lucide-react';
import api from '../services/api';

// ─── Constants ────────────────────────────────────────────────
const CAMPAIGN_GOALS = ['Brand Awareness', 'Product Launch', 'Lead Generation', 'Sales Conversion', 'Event Promotion'];
const TONES = ['Bold', 'Confident', 'Energetic', 'Professional', 'Minimalist', 'Luxurious'];
const STYLES = ['PHOTOREALISM', 'DIGITAL_ART', 'ANIME', 'CINEMATIC', '3D_RENDER', 'PIXEL_ART'];
const QUALITIES = ['standard', 'premium', 'extreme'];
const LIGHTING_OPTIONS = ['Golden Hour', 'Studio Lighting', 'Neon', 'Natural Light', 'Dynamic Shadows', 'Soft Glow'];
const COMPOSITIONS = ['Rule of Thirds', 'Centered', 'Close-up Product', 'Lifestyle Shot', 'Wide Angle', 'Bird\'s Eye'];

const SECTIONS = [
    { id: 'campaign', label: 'Campaign Setup', icon: BarChart2 },
    { id: 'style', label: 'Visual Style', icon: Image },
    { id: 'content', label: 'Content & Brand', icon: Palette },
    { id: 'settings', label: 'Image Settings', icon: Settings2 },
];

const IMAGE_AD_API = '/products/generate-image-ad';

function extractImageUrl(payload) {
    const candidates = [
        payload?.data?.imageUrl,
        payload?.data?.image_url,
        payload?.data?.url,
        payload?.data?.presigned_url,
        payload?.imageUrl,
        payload?.image_url,
        payload?.url,
        payload?.presigned_url,
        payload?.images?.[0],
        payload?.data?.images?.[0],
        payload?.data?.output?.[0]?.url,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate;
        }
    }
    return null;
}

export default function ImageAdGeneratorPage() {
    const [openSection, setOpenSection] = useState('campaign');
    const [isLoading, setIsLoading] = useState(false);
    const [resultImageUrl, setResultImageUrl] = useState(null);
    const [toast, setToast] = useState(null);

    const [imageConfig, setImageConfig] = useState({
        campaignGoal: '',
        targetAudience: '',
        tone: '',
        stylePreference: '',
        sceneType: '',
        lighting: '',
        composition: '',
        brandColors: ['#000000', '#FFFFFF', '#6366f1'],
        tagline: '',
        offerText: '',
        ctaText: '',
        style: 'PHOTOREALISM',
        width: 1024,
        height: 1024,
        quality: 'premium',
        cfgScale: 8,
        seed: 77,
        numberOfImages: 1
    });

    const set = useCallback((path, val) => {
        setImageConfig(prev => {
            const next = { ...prev };
            next[path] = val;
            return next;
        });
    }, []);

    const toggleSection = (id) => setOpenSection(openSection === id ? null : id);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Validation — Required Fields ─────
    const isValid = (
        imageConfig.campaignGoal &&
        imageConfig.targetAudience &&
        imageConfig.tone &&
        imageConfig.sceneType
    );

    const sectionValid = {
        campaign: !!(imageConfig.campaignGoal && imageConfig.targetAudience && imageConfig.tone),
        style: !!(imageConfig.stylePreference && imageConfig.sceneType && imageConfig.lighting),
        content: !!(imageConfig.ctaText),
        settings: !!(imageConfig.width && imageConfig.height),
    };

    const handleGenerate = async () => {
        if (!isValid) return;
        setIsLoading(true);
        setResultImageUrl(null);

        try {
            const payload = {
                ...imageConfig,
                width: Number(imageConfig.width),
                height: Number(imageConfig.height),
                cfgScale: Number(imageConfig.cfgScale),
                seed: Number(imageConfig.seed),
                numberOfImages: Number(imageConfig.numberOfImages),
                brandColors: (imageConfig.brandColors || []).filter(Boolean),
            };

            const response = await api.post(IMAGE_AD_API, payload);
            const imageUrl = extractImageUrl(response?.data);

            if (!imageUrl) {
                const message = response?.data?.message || 'Image generated but no preview URL returned';
                showToast(message, 'error');
                return;
            }

            setResultImageUrl(imageUrl);
            showToast('Image generated successfully!');
        } catch (err) {
            const errorMessage =
                err?.response?.data?.message ||
                err?.message ||
                'Server error during image generation';
            showToast(errorMessage, 'error');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-slate-200">
            {/* Header */}
            <div className="border-b border-white/[0.05] bg-black/40 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            AI Image Ad Generator
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">High-conversion product visuals in seconds</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">150 Credits Left</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Form (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">

                        {/* 1. Campaign Setup */}
                        <AccordionSection id="campaign" label="Campaign Setup" icon={BarChart2}
                            open={openSection === 'campaign'} onToggle={toggleSection}
                            isValid={sectionValid.campaign}>
                            <div className="space-y-4">
                                <div>
                                    <Label required>Campaign Goal</Label>
                                    <textarea className="input-field resize-none" rows={2}
                                        placeholder="e.g. boost sales of boAt Airdopes wireless earbuds..."
                                        value={imageConfig.campaignGoal}
                                        onChange={e => set('campaignGoal', e.target.value)} />
                                </div>
                                <div>
                                    <Label required>Target Audience</Label>
                                    <input className="input-field"
                                        placeholder="e.g. Indian youth aged 18-30 who enjoy music..."
                                        value={imageConfig.targetAudience}
                                        onChange={e => set('targetAudience', e.target.value)} />
                                </div>
                                <div>
                                    <Label required>Tone</Label>
                                    <PillSelector options={TONES} selected={imageConfig.tone}
                                        onSelect={v => set('tone', v)} />
                                </div>
                            </div>
                        </AccordionSection>

                        {/* 2. Visual Style */}
                        <AccordionSection id="style" label="Visual Style" icon={Image}
                            open={openSection === 'style'} onToggle={toggleSection}
                            isValid={sectionValid.style}>
                            <div className="space-y-4">
                                <div>
                                    <Label>Style Preference</Label>
                                    <input className="input-field"
                                        placeholder="e.g. modern dark aesthetic with vibrant color accents"
                                        value={imageConfig.stylePreference}
                                        onChange={e => set('stylePreference', e.target.value)} />
                                </div>
                                <div>
                                    <Label required>Scene Type</Label>
                                    <textarea className="input-field resize-none" rows={2}
                                        placeholder="e.g. a young person enjoying music outdoors in a modern urban environment"
                                        value={imageConfig.sceneType}
                                        onChange={e => set('sceneType', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Lighting</Label>
                                        <Select value={imageConfig.lighting} options={LIGHTING_OPTIONS}
                                            onChange={v => set('lighting', v)} placeholder="Select lighting..." />
                                    </div>
                                    <div>
                                        <Label>Composition</Label>
                                        <Select value={imageConfig.composition} options={COMPOSITIONS}
                                            onChange={v => set('composition', v)} placeholder="Select composition..." />
                                    </div>
                                </div>
                            </div>
                        </AccordionSection>

                        {/* 3. Content & Brand */}
                        <AccordionSection id="content" label="Content & Brand" icon={Palette}
                            open={openSection === 'content'} onToggle={toggleSection}
                            isValid={sectionValid.content}>
                            <div className="space-y-4">
                                <div>
                                    <Label>Tagline</Label>
                                    <input className="input-field" placeholder="e.g. Plug In. Tune Out."
                                        value={imageConfig.tagline}
                                        onChange={e => set('tagline', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Offer Text</Label>
                                    <input className="input-field" placeholder="e.g. Flat 500 rupees off"
                                        value={imageConfig.offerText}
                                        onChange={e => set('offerText', e.target.value)} />
                                </div>
                                <div>
                                    <Label required>CTA Text</Label>
                                    <input className="input-field" placeholder="e.g. Shop Now on boAt"
                                        value={imageConfig.ctaText}
                                        onChange={e => set('ctaText', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Brand Colors</Label>
                                    <div className="flex gap-2">
                                        {imageConfig.brandColors.map((color, idx) => (
                                            <input key={idx} type="color" className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer"
                                                value={color} onChange={e => {
                                                    const newColors = [...imageConfig.brandColors];
                                                    newColors[idx] = e.target.value;
                                                    set('brandColors', newColors);
                                                }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AccordionSection>

                        {/* 4. Image Settings */}
                        <AccordionSection id="settings" label="Image Settings" icon={Settings2}
                            open={openSection === 'settings'} onToggle={toggleSection}
                            isValid={sectionValid.settings}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Base Style</Label>
                                        <Select value={imageConfig.style} options={STYLES}
                                            onChange={v => set('style', v)} />
                                    </div>
                                    <div>
                                        <Label>Quality</Label>
                                        <Select value={imageConfig.quality} options={QUALITIES}
                                            onChange={v => set('quality', v)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label>Width</Label>
                                        <input type="number" className="input-field" value={imageConfig.width}
                                            onChange={e => set('width', parseInt(e.target.value))} />
                                    </div>
                                    <div>
                                        <Label>Height</Label>
                                        <input type="number" className="input-field" value={imageConfig.height}
                                            onChange={e => set('height', parseInt(e.target.value))} />
                                    </div>
                                    <div>
                                        <Label>CFG Scale</Label>
                                        <input type="number" className="input-field" value={imageConfig.cfgScale}
                                            onChange={e => set('cfgScale', parseInt(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                        </AccordionSection>

                        <button
                            disabled={!isValid || isLoading}
                            onClick={handleGenerate}
                            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-semibold transition-all duration-300 transform
                                ${isValid && !isLoading
                                    ? 'bg-brand text-white hover:bg-brand-light shadow-lg shadow-brand/20 scale-[1.01] active:scale-[0.99]'
                                    : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/[0.05]'
                                }`}>
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Generating Magic...</>
                            ) : (
                                <><Zap className="w-5 h-5 fill-current" /> Generate Image Ad</>
                            )}
                        </button>
                    </div>

                    {/* Right Column: Preview (5 cols) */}
                    <div className="lg:col-span-5 relative">
                        <div className="sticky top-28 space-y-6">

                            {/* Live Preview Console */}
                            <div className="rounded-2xl bg-black/40 border border-white/[0.05] overflow-hidden">
                                <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="w-4 h-4 text-brand-light" />
                                        <span className="text-xs font-medium text-slate-400">Live Preview Console</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-500/20" />
                                        <div className="w-2 h-2 rounded-full bg-amber-500/20" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                                    </div>
                                </div>
                                <div className="p-6 aspect-square flex flex-col items-center justify-center relative overflow-hidden group">
                                    {resultImageUrl ? (
                                        <img src={resultImageUrl} alt="Generated Ad" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                                                <Image className="w-8 h-8 text-slate-700" />
                                            </div>
                                            <div className="max-w-[200px]">
                                                <p className="text-sm font-medium text-slate-500 italic">"Fill in the details to visualize your campaign..."</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Scanline Effect */}
                                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,4px_100%] opacity-20" />
                                </div>
                            </div>

                            {/* Prompt Mock */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-tighter">AI Processing Pipeline</span>
                                </div>
                                <div className="space-y-3 font-mono text-[11px] leading-relaxed">
                                    <p className="text-slate-400">
                                        <span className="text-emerald-500">INIT</span> image_generator_v2.bin<br />
                                        <span className="text-emerald-500">STYLE</span> {imageConfig.style}<br />
                                        <span className="text-brand-light">SCENE</span> {imageConfig.sceneType || 'Waiting for scene description...'}<br />
                                        <span className="text-brand-light">LIGHT</span> {imageConfig.lighting || 'Balanced'}<br />
                                        <span className="text-slate-600">--cfg_scale {imageConfig.cfgScale} --seed {imageConfig.seed}</span>
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                        className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 border
                            ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                        {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                        <span className={`text-sm font-medium ${toast.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>{toast.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Components ──────────────────────────────────────────────

function AccordionSection({ id, label, icon: Icon, children, open, onToggle, isValid }) {
    return (
        <div className={`rounded-2xl border transition-all duration-300 overflow-hidden
            ${open
                ? 'bg-white/[0.03] border-white/10 ring-1 ring-white/10 shadow-2xl'
                : 'bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.02] hover:border-white/10 cursor-pointer'
            }`}>
            <div onClick={() => onToggle(id)} className="px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl transition-colors
                        ${open ? 'bg-brand/20 text-brand-light' : 'bg-white/[0.03] text-slate-500'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className={`font-semibold transition-colors ${open ? 'text-white' : 'text-slate-300'}`}>{label}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isValid && <CheckCircle2 className="w-4 h-4 text-emerald-500/50" />}
                    {open ? <ChevronDown className="w-5 h-5 text-slate-600" /> : <ChevronRight className="w-5 h-5 text-slate-600" />}
                </div>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                        <div className="px-6 pb-6 pt-2 border-t border-white/[0.05] space-y-6">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Label({ children, required }) {
    return (
        <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                {children} {required && <span className="text-brand-light ml-0.5">•</span>}
            </span>
        </div>
    );
}

function Select({ value, options, onChange, placeholder = "Select..." }) {
    return (
        <div className="relative group">
            <select value={value} onChange={e => onChange(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all appearance-none cursor-pointer">
                <option value="" disabled className="bg-slate-900">{placeholder}</option>
                {options.map(o => (
                    <option key={o} value={o} className="bg-slate-900 text-slate-200 py-2">{o}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none group-hover:text-slate-400 transition-colors" />
        </div>
    );
}

function PillSelector({ options, selected, onSelect }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(opt => (
                <button key={opt} onClick={() => onSelect(opt)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border
                        ${selected === opt
                            ? 'bg-brand/20 border-brand/40 text-brand-light shadow-lg shadow-brand/10'
                            : 'bg-white/[0.02] border-white/[0.05] text-slate-500 hover:text-slate-300 hover:border-white/10'}`}>
                    {opt}
                </button>
            ))}
        </div>
    );
}
