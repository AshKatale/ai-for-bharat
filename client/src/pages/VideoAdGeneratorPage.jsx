// VideoAdGeneratorPage.jsx — AI Marketing Video Generator
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video, Target, Mic, Music2, MousePointerClick, Palette,
    Settings2, ChevronDown, ChevronRight, Loader2,
    CheckCircle2, AlertCircle, Upload, Zap, Play,
    BarChart2, FileText, Layers, Clock, Monitor,
} from 'lucide-react';
import api from '../services/api';

// ─── Constants ────────────────────────────────────────────────
const CAMPAIGN_GOALS = ['Brand Awareness', 'Product Launch', 'Lead Generation', 'Sales Conversion', 'App Downloads', 'Event Promotion'];
const PLATFORMS = ['Instagram Reels', 'YouTube Shorts', 'TikTok', 'Facebook Ads', 'LinkedIn', 'Twitter/X'];
const HOOK_STYLES = ['Question Hook', 'Bold Statement', 'Story Hook', 'Shock/Surprise', 'Tutorial Hook', 'Social Proof'];
const AGE_GROUPS = ['13–17', '18–24', '25–34', '35–44', '45–54', '55+'];
const AUDIENCE_TYPES = ['Students', 'Young Professionals', 'Parents', 'Entrepreneurs', 'Homemakers', 'Senior Citizens'];
const TONES = ['Professional', 'Conversational', 'Energetic', 'Emotional', 'Humorous', 'Inspirational'];
const VOICE_GENDERS = ['Male', 'Female', 'Neutral'];
const ACCENTS = ['Indian English', 'American English', 'British English', 'Hindi', 'Regional Indian'];
const ENERGY_LEVELS = ['Low', 'Medium', 'High'];
const MUSIC_MOODS = ['Upbeat', 'Motivational', 'Calm', 'Dramatic', 'Corporate', 'Fun'];
const CTA_TYPES = ['Shop Now', 'Download App', 'Sign Up Free', 'Learn More', 'Book Demo', 'Claim Offer'];
const ASPECT_RATIOS = ['9:16 (Vertical)', '16:9 (Landscape)', '1:1 (Square)', '4:5 (Portrait)'];
const RESOLUTIONS = ['720p HD', '1080p Full HD', '4K Ultra HD'];

const SECTIONS = [
    { id: 'campaign', label: 'Campaign Setup', icon: BarChart2 },
    { id: 'audience', label: 'Target Audience', icon: Target },
    { id: 'tone', label: 'Tone', icon: Mic },
    { id: 'audio', label: 'Audio', icon: Music2 },
    { id: 'cta', label: 'Call to Action', icon: MousePointerClick },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'video', label: 'Video Settings', icon: Settings2 },
];

const VIDEO_AD_API = `${process.env.VITE_BACKEND_URI}/api/products/generate-video`;

// ─── Sub-components ───────────────────────────────────────────

function Label({ children, required }) {
    return (
        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
            {children}{required && <span className="text-brand-light ml-1">*</span>}
        </label>
    );
}

function Select({ value, onChange, options, placeholder }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="input-field appearance-none pr-8 cursor-pointer"
            >
                <option value="">{placeholder || 'Select...'}</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
    );
}

function AccordionSection({ id, label, icon: Icon, open, onToggle, children, isValid }) {
    return (
        <div className="glass-card overflow-hidden">
            <button
                onClick={() => onToggle(id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg transition-colors ${open ? 'bg-brand/15 text-brand-light' : 'bg-white/5 text-slate-500'}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-white">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isValid && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
                </div>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-white/[0.06]">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ToneCard({ tone, selected, onSelect }) {
    return (
        <button
            onClick={() => onSelect(tone)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left
        ${selected
                    ? 'bg-brand/15 border-brand/40 text-brand-light'
                    : 'bg-white/5 border-white/[0.08] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                }`}
        >
            {tone}
        </button>
    );
}

function PillSelector({ options, selected, onSelect }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(o => (
                <button
                    key={o}
                    onClick={() => onSelect(o)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
            ${selected === o
                            ? 'bg-brand/20 border-brand/40 text-brand-light'
                            : 'bg-white/5 border-white/[0.08] text-slate-400 hover:text-slate-200'
                        }`}
                >
                    {o}
                </button>
            ))}
        </div>
    );
}

function Toast({ type, message }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-xl text-sm font-medium
        ${type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/20 border-red-500/30 text-red-300'
                }`}
        >
            {type === 'success'
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />}
            {message}
        </motion.div>
    );
}

// ─── Preview Panel ────────────────────────────────────────────
function PreviewPanel({ config, loading, progress, generatedVideoUrl }) {
    const isVertical = config.videoSettings.aspectRatio.startsWith('9:16');
    const is1x1 = config.videoSettings.aspectRatio.startsWith('1:1');

    return (
        <div className="space-y-4">
            {/* Video placeholder */}
            <div className="glass-card p-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Video Preview</p>
                <div className={`relative bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden flex items-center justify-center mx-auto
          ${isVertical ? 'w-36 h-64' : is1x1 ? 'w-full aspect-square max-w-[220px]' : 'w-full aspect-video'}`}>
                    {loading ? (
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mb-2" />
                            <p className="text-xs text-slate-500">Generating...</p>
                            <div className="mt-3 w-32 bg-white/10 rounded-full h-1.5">
                                <motion.div
                                    className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    ) : generatedVideoUrl ? (
                        <video
                            src={generatedVideoUrl}
                            controls
                            autoPlay
                            muted
                            className="w-full h-full object-cover rounded-xl"
                        />
                    ) : (
                        <div className="text-center text-slate-600">
                            <Play className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-xs">Preview will appear here</p>
                        </div>
                    )}
                    {/* Ratio badge */}
                    {config.videoSettings.aspectRatio && (
                        <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded bg-black/50 text-slate-300 font-mono">
                            {config.videoSettings.aspectRatio.split(' ')[0]}
                        </span>
                    )}
                </div>
            </div>

            {/* Config summary */}
            <div className="glass-card p-4 space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Configuration</p>
                {[
                    ['Platform', config.platform],
                    ['Goal', config.campaignGoal],
                    ['Tone', config.tone],
                    ['Hook', config.hookStyle],
                    ['Duration', config.videoSettings.duration ? `${config.videoSettings.duration}s` : ''],
                    ['Resolution', config.videoSettings.resolution],
                    ['Music', config.audio?.backgroundMusicMood],
                ].map(([k, v]) => v ? (
                    <div key={k} className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{k}</span>
                        <span className="text-xs text-slate-300 font-medium truncate ml-2 max-w-[60%] text-right">{v}</span>
                    </div>
                ) : null)}
            </div>

            {/* Script preview mock */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-brand-light" />
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Script Preview</p>
                </div>
                <div className="space-y-2">
                    {config.hookStyle ? (
                        <>
                            <div className="text-xs p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                                <span className="text-brand-light font-semibold text-[10px] uppercase">Hook · </span>
                                <span className="text-slate-300">
                                    {config.hookStyle === 'Question Hook' ? 'Did you know that most Indian businesses miss out on...' :
                                        config.hookStyle === 'Bold Statement' ? 'This changes everything for your brand.' :
                                            config.hookStyle === 'Story Hook' ? 'Three months ago, we had zero customers. Here\'s what happened...' :
                                                config.hookStyle === 'Social Proof' ? '50,000+ businesses already trust this. Here\'s why.' :
                                                    'We\'re about to show you something you\'ve never seen.'}
                                </span>
                            </div>
                            <div className="text-xs p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-500 italic">
                                Body · Tailored to {config.targetAudience?.audienceType || 'your audience'} ...
                            </div>
                            {config.cta.type && (
                                <div className="text-xs p-3 rounded-lg bg-brand/10 border border-brand/20">
                                    <span className="text-brand-light font-semibold text-[10px] uppercase">CTA · </span>
                                    <span className="text-slate-300">{config.cta.type}{config.cta.offerText ? ` — ${config.cta.offerText}` : ''}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-xs text-slate-600 text-center py-4">Select a hook style to preview the script</p>
                    )}
                </div>
            </div>

            {/* Scene breakdown mock */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-brand-light" />
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Scene Breakdown</p>
                </div>
                {config.videoSettings.duration ? (
                    <div className="space-y-2">
                        {[
                            { scene: 'Hook', time: '0–5s', pct: 17 },
                            { scene: 'Problem', time: '5–12s', pct: 23 },
                            { scene: 'Solution', time: '12–22s', pct: 33 },
                            { scene: 'CTA', time: '22–30s', pct: 27 },
                        ].map(({ scene, time, pct }) => (
                            <div key={scene} className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-slate-500 w-14 shrink-0">{time}</span>
                                <div className="flex-1 bg-white/5 rounded-full h-1.5">
                                    <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                        style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[10px] text-slate-400 w-14 text-right shrink-0">{scene}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-slate-600 text-center py-3">Set video duration to see breakdown</p>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────
function VideoAdGeneratorPage() {
    const [videoConfig, setVideoConfig] = useState({
        productId: '',
        campaignGoal: '',
        targetAudience: { ageGroup: '', location: '', audienceType: '', painPoint: '' },
        tone: '',
        platform: '',
        hookStyle: '',
        cta: { type: '', offerText: '', promoCode: '' },
        branding: { logoUrl: '', brandColors: ['#22c55e', '#10b981'], websiteUrl: '', tagline: '' },
        audio: { voiceGender: '', accent: '', energyLevel: '', backgroundMusicMood: '' },
        videoSettings: { duration: 30, aspectRatio: '', resolution: '' },
    });

    const [openSection, setOpenSection] = useState('campaign');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
    const [toast, setToast] = useState(null);
    const logoInputRef = useRef(null);

    // ── State helpers ─────────────────────────────────────────
    const set = useCallback((path, value) => {
        setVideoConfig(prev => {
            const next = { ...prev };
            const keys = path.split('.');
            let obj = next;
            for (let i = 0; i < keys.length - 1; i++) {
                obj[keys[i]] = { ...obj[keys[i]] };
                obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = value;
            return next;
        });
    }, []);

    const toggleSection = (id) => setOpenSection(s => s === id ? null : id);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Validation — Required: campaignGoal, platform, tone ─────
    const isValid = (
        videoConfig.campaignGoal &&
        videoConfig.platform &&
        videoConfig.tone
    );

    const sectionValid = {
        campaign: !!(videoConfig.campaignGoal && videoConfig.platform),
        audience: !!(videoConfig.targetAudience.ageGroup),
        tone: !!(videoConfig.tone),
        audio: !!(videoConfig.audio.voiceGender),
        cta: !!(videoConfig.cta.type),
        branding: !!(videoConfig.branding.websiteUrl),
        video: !!(videoConfig.videoSettings.aspectRatio),
    };

    // ── Generate ──────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!isValid) return;
        setLoading(true);
        setProgress(0);
        setGeneratedVideoUrl(null);

        // Simulate progress
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 90) { clearInterval(interval); return 90; }
                return p + Math.random() * 12;
            });
        }, 800);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(VIDEO_AD_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(videoConfig),
            });

            clearInterval(interval);
            setProgress(100);

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `API error ${res.status}`);
            }

            const data = await res.json();
            if (data && data.presigned_url) {
                setGeneratedVideoUrl(data.presigned_url);
                showToast('success', 'Video generated successfully!');
            } else {
                showToast('success', 'Video generation started! Check your email when it\'s ready.');
            }
        } catch (err) {
            clearInterval(interval);
            setProgress(0);
            showToast('error', err.message || 'Failed to generate video. Try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Logo upload ───────────────────────────────────────────
    const handleLogoDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files[0] || e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        set('branding.logoUrl', url);
    };

    return (
        <div className="max-w-screen-xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Video className="w-6 h-6 text-brand-light" />
                        AI Marketing Video Generator
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Configure your campaign and generate a professional ad video in minutes.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand/10 border border-brand/20">
                    <Zap className="w-4 h-4 text-brand-light" />
                    <span className="text-sm font-medium text-brand-light">3 credits left</span>
                </div>
            </div>

            {/* Main layout */}
            <div className="grid lg:grid-cols-5 gap-6 items-start">
                {/* Left — Form (3/5) */}
                <div className="lg:col-span-3 space-y-3">

                    {/* 1. Campaign Setup */}
                    <AccordionSection id="campaign" label="Campaign Setup" icon={BarChart2}
                        open={openSection === 'campaign'} onToggle={toggleSection}
                        isValid={sectionValid.campaign}>
                        <div>
                            <Label required>Campaign Goal</Label>
                            <Select value={videoConfig.campaignGoal} onChange={v => set('campaignGoal', v)}
                                options={CAMPAIGN_GOALS} placeholder="Choose a goal..." />
                        </div>
                        <div>
                            <Label required>Platform</Label>
                            <Select value={videoConfig.platform} onChange={v => set('platform', v)}
                                options={PLATFORMS} placeholder="Choose platform..." />
                        </div>
                        <div>
                            <Label required>Hook Style</Label>
                            <Select value={videoConfig.hookStyle} onChange={v => set('hookStyle', v)}
                                options={HOOK_STYLES} placeholder="Choose hook style..." />
                        </div>
                    </AccordionSection>

                    {/* 2. Target Audience */}
                    <AccordionSection id="audience" label="Target Audience" icon={Target}
                        open={openSection === 'audience'} onToggle={toggleSection}
                        isValid={sectionValid.audience}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label required>Age Group</Label>
                                <Select value={videoConfig.targetAudience.ageGroup}
                                    onChange={v => set('targetAudience.ageGroup', v)}
                                    options={AGE_GROUPS} placeholder="Select..." />
                            </div>
                            <div>
                                <Label required>Audience Type</Label>
                                <Select value={videoConfig.targetAudience.audienceType}
                                    onChange={v => set('targetAudience.audienceType', v)}
                                    options={AUDIENCE_TYPES} placeholder="Select..." />
                            </div>
                        </div>
                        <div>
                            <Label>Location</Label>
                            <input className="input-field" placeholder="e.g. Mumbai, Delhi, Pan-India"
                                value={videoConfig.targetAudience.location}
                                onChange={e => set('targetAudience.location', e.target.value)} />
                        </div>
                        <div>
                            <Label>Pain Point</Label>
                            <textarea className="input-field resize-none" rows={3}
                                placeholder="What problem does your product solve for this audience?"
                                value={videoConfig.targetAudience.painPoint}
                                onChange={e => set('targetAudience.painPoint', e.target.value)} />
                        </div>
                    </AccordionSection>

                    {/* 3. Tone */}
                    <AccordionSection id="tone" label="Tone" icon={Mic}
                        open={openSection === 'tone'} onToggle={toggleSection}
                        isValid={sectionValid.tone}>
                        <div>
                            <Label required>Tone of your video</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {TONES.map(t => (
                                    <ToneCard key={t} tone={t}
                                        selected={videoConfig.tone === t}
                                        onSelect={v => set('tone', v)} />
                                ))}
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 4. Audio */}
                    <AccordionSection id="audio" label="Audio" icon={Music2}
                        open={openSection === 'audio'} onToggle={toggleSection}
                        isValid={sectionValid.audio}>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label required>Voice Gender</Label>
                                <Select value={videoConfig.audio.voiceGender}
                                    onChange={v => set('audio.voiceGender', v)}
                                    options={VOICE_GENDERS} placeholder="Select..." />
                            </div>
                            <div>
                                <Label>Accent</Label>
                                <Select value={videoConfig.audio.accent}
                                    onChange={v => set('audio.accent', v)}
                                    options={ACCENTS} placeholder="Select..." />
                            </div>
                            <div>
                                <Label>Energy Level</Label>
                                <Select value={videoConfig.audio.energyLevel}
                                    onChange={v => set('audio.energyLevel', v)}
                                    options={ENERGY_LEVELS} placeholder="Select..." />
                            </div>
                        </div>
                        <div>
                            <Label>Background Music Mood</Label>
                            <div className="flex flex-wrap gap-2">
                                {MUSIC_MOODS.map(m => (
                                    <button key={m}
                                        onClick={() => set('audio.backgroundMusicMood', m)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                                            ${videoConfig.audio.backgroundMusicMood === m
                                                ? 'bg-brand/20 border-brand/40 text-brand-light'
                                                : 'bg-white/5 border-white/[0.08] text-slate-400 hover:text-slate-200'
                                            }`}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 4. CTA */}
                    <AccordionSection id="cta" label="Call to Action" icon={MousePointerClick}
                        open={openSection === 'cta'} onToggle={toggleSection}
                        isValid={sectionValid.cta}>
                        <div>
                            <Label required>CTA Type</Label>
                            <Select value={videoConfig.cta.type} onChange={v => set('cta.type', v)}
                                options={CTA_TYPES} placeholder="Choose CTA..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Offer Text</Label>
                                <input className="input-field" placeholder="e.g. Get 30% off today"
                                    value={videoConfig.cta.offerText}
                                    onChange={e => set('cta.offerText', e.target.value)} />
                            </div>
                            <div>
                                <Label>Promo Code</Label>
                                <input className="input-field font-mono" placeholder="e.g. BHARAT30"
                                    value={videoConfig.cta.promoCode}
                                    onChange={e => set('cta.promoCode', e.target.value.toUpperCase())} />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 5. Branding */}
                    <AccordionSection id="branding" label="Branding" icon={Palette}
                        open={openSection === 'branding'} onToggle={toggleSection}
                        isValid={sectionValid.branding}>
                        {/* Logo upload */}
                        <div>
                            <Label>Logo</Label>
                            <div
                                onDrop={handleLogoDrop}
                                onDragOver={e => e.preventDefault()}
                                onClick={() => logoInputRef.current?.click()}
                                className="border-2 border-dashed border-white/[0.12] rounded-xl p-6 text-center cursor-pointer
                           hover:border-brand/40 hover:bg-brand/5 transition-all"
                            >
                                {videoConfig.branding.logoUrl ? (
                                    <img src={videoConfig.branding.logoUrl} alt="Logo"
                                        className="h-12 mx-auto rounded object-contain" />
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                                        <p className="text-xs text-slate-500">Drag & drop or click to upload logo</p>
                                        <p className="text-[10px] text-slate-600 mt-1">PNG, SVG, WEBP · Max 5MB</p>
                                    </>
                                )}
                                <input ref={logoInputRef} type="file" accept="image/*"
                                    className="hidden" onChange={handleLogoDrop} />
                            </div>
                        </div>
                        {/* Brand Colors */}
                        <div>
                            <Label>Brand Colors</Label>
                            <div className="flex items-center gap-3">
                                {[0, 1].map(i => (
                                    <label key={i} className="flex items-center gap-2 cursor-pointer">
                                        <div className="relative">
                                            <div className="w-9 h-9 rounded-lg border border-white/20 overflow-hidden">
                                                <input type="color"
                                                    value={videoConfig.branding.brandColors[i]}
                                                    onChange={e => {
                                                        const colors = [...videoConfig.branding.brandColors];
                                                        colors[i] = e.target.value;
                                                        set('branding.brandColors', colors);
                                                    }}
                                                    className="w-12 h-12 -m-1.5 opacity-0 absolute cursor-pointer" />
                                                <div className="w-full h-full" style={{ background: videoConfig.branding.brandColors[i] }} />
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono text-slate-400">
                                            {videoConfig.branding.brandColors[i]}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label required>Website URL</Label>
                                <input className="input-field" placeholder="https://yourwebsite.in"
                                    value={videoConfig.branding.websiteUrl}
                                    onChange={e => set('branding.websiteUrl', e.target.value)} />
                            </div>
                            <div>
                                <Label>Tagline</Label>
                                <input className="input-field" placeholder="e.g. Bharat Ka AI"
                                    value={videoConfig.branding.tagline}
                                    onChange={e => set('branding.tagline', e.target.value)} />
                            </div>
                        </div>
                    </AccordionSection>

                    {/* 6. Video Settings */}
                    <AccordionSection id="video" label="Video Settings" icon={Settings2}
                        open={openSection === 'video'} onToggle={toggleSection}
                        isValid={sectionValid.video}>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Duration (sec)</Label>
                                <div className="relative">
                                    <input type="number" className="input-field pr-8" min={10} max={120}
                                        value={videoConfig.videoSettings.duration}
                                        onChange={e => set('videoSettings.duration', Number(e.target.value))} />
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <Label required>Aspect Ratio</Label>
                                <Select value={videoConfig.videoSettings.aspectRatio}
                                    onChange={v => set('videoSettings.aspectRatio', v)}
                                    options={ASPECT_RATIOS} placeholder="Select..." />
                            </div>
                            <div>
                                <Label required>Resolution</Label>
                                <Select value={videoConfig.videoSettings.resolution}
                                    onChange={v => set('videoSettings.resolution', v)}
                                    options={RESOLUTIONS} placeholder="Select..." />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
                            <Monitor className="w-4 h-4 text-amber-400 shrink-0" />
                            <p className="text-xs text-amber-400">
                                Longer duration and higher resolution consume more credits.
                            </p>
                        </div>
                    </AccordionSection>

                    {/* Generate button */}
                    <motion.div className="pt-2" whileTap={{ scale: isValid && !loading ? 0.98 : 1 }}>
                        <button
                            onClick={handleGenerate}
                            disabled={!isValid || loading}
                            className={`w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-300
                ${isValid && !loading
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.01]'
                                    : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/[0.08]'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating... {Math.round(progress)}%
                                </>
                            ) : (
                                <>
                                    <Video className="w-4 h-4" />
                                    {isValid ? 'Generate Video — 1 Credit' : 'Complete all required fields to generate'}
                                </>
                            )}
                        </button>

                        {/* Progress bar */}
                        {loading && (
                            <div className="mt-3 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                <motion.div
                                    className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        )}

                        {!isValid && (
                            <p className="text-center text-xs text-slate-600 mt-2">
                                Required: <span className="text-slate-500">Campaign Goal · Platform · Tone</span>
                            </p>
                        )}
                    </motion.div>
                </div>

                {/* Right — Preview Panel (2/5) */}
                <div className="lg:col-span-2 sticky top-6">
                    <PreviewPanel
                        config={videoConfig}
                        loading={loading}
                        progress={progress}
                        generatedVideoUrl={generatedVideoUrl}
                    />
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast type={toast.type} message={toast.message} />}
            </AnimatePresence>
        </div>
    );
}

export default VideoAdGeneratorPage;
