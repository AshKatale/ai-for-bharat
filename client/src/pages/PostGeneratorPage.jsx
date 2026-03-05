import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, FileText, Image as ImageIcon, Loader2, Video } from 'lucide-react';
import api from '../services/api';

const POST_GENERATOR_API = '/products/generate-post';

const POST_LANGUAGES = ['english', 'hindi', 'hinglish', 'hindi-in-english'];
const TONES = ['professional', 'energetic', 'witty', 'casual', 'friendly'];
const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'x', 'youtube'];
const IMAGE_STYLES = ['PHOTOREALISM', 'DIGITAL_ART', 'ANIME'];
const VIDEO_ASPECT_RATIOS = ['9:16', '16:9', '1:1', '4:5'];
const VIDEO_RESOLUTIONS = ['720p', '1080p', '4k'];
const DEFAULT_PREVIEW_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#g)"/>
    <rect x="120" y="120" width="784" height="784" rx="36" fill="none" stroke="#64748b" stroke-width="6" stroke-dasharray="16 16"/>
    <circle cx="340" cy="360" r="60" fill="#334155"/>
    <path d="M220 760l180-200 120 120 120-140 170 220H220z" fill="#334155"/>
    <text x="512" y="860" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="42">
      Image preview will appear here
    </text>
  </svg>`
)}`;

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="text-brand-light ml-1">*</span>}
    </label>
  );
}

function Select({ value, options, onChange, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field"
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full text-left p-3 rounded-xl border transition ${
        checked ? 'border-brand/40 bg-brand/10' : 'border-white/[0.08] bg-white/5'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white font-semibold">{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
        <div className={`w-11 h-6 rounded-full p-1 transition ${checked ? 'bg-brand' : 'bg-slate-600'}`}>
          <div className={`w-4 h-4 rounded-full bg-white transition ${checked ? 'translate-x-5' : ''}`} />
        </div>
      </div>
    </button>
  );
}

function extractImageUrl(payload) {
  const candidates = [
    payload?.image?.presigned_urls?.[0],
    payload?.image?.presigned_url,
    payload?.image?.url,
    payload?.image?.imageUrl,
    payload?.image?.image_url,
    payload?.image?.images?.[0],
    payload?.image?.images?.[0]?.url,
    payload?.image?.output_images?.[0],
    payload?.image?.data?.presigned_urls?.[0],
    payload?.data?.image?.presigned_urls?.[0],
    payload?.data?.image?.presigned_url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }

  return null;
}

function extractVideoUrl(payload) {
  const candidates = [
    payload?.video?.presigned_urls?.[0],
    payload?.video?.presigned_url,
    payload?.video?.url,
    payload?.video?.videoUrl,
    payload?.video?.video_url,
    payload?.video?.videos?.[0],
    payload?.video?.videos?.[0]?.url,
    payload?.video?.output_videos?.[0],
    payload?.video?.data?.presigned_urls?.[0],
    payload?.data?.video?.presigned_urls?.[0],
    payload?.data?.video?.presigned_url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }

  return null;
}

function Toast({ type, message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
        type === 'error'
          ? 'bg-red-500/15 border-red-500/30 text-red-300'
          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
      }`}
    >
      {type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      {message}
    </motion.div>
  );
}

export default function PostGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null);
  const [previewImage, setPreviewImage] = useState(DEFAULT_PREVIEW_IMAGE);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [videoLoadError, setVideoLoadError] = useState(false);

  const [form, setForm] = useState({
    productId: '',
    brand_name: '',
    post_language: 'english',
    tone: 'energetic',
    input_text: '',
    platform: 'instagram',
    generateImage: false,
    generateVideo: false,
    imageDetails: {
      style: 'PHOTOREALISM',
      sceneType: '',
      lighting: '',
      composition: '',
      width: 1024,
      height: 1024,
      quality: 'premium',
      cfgScale: 7,
      seed: 42,
      numberOfImages: 1,
    },
    videoDetails: {
      duration: 15,
      aspectRatio: '9:16',
      resolution: '1080p',
      voiceStyle: '',
      backgroundMusicMood: '',
    },
  });

  const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setImageValue = (key, value) =>
    setForm((prev) => ({ ...prev, imageDetails: { ...prev.imageDetails, [key]: value } }));
  const setVideoValue = (key, value) =>
    setForm((prev) => ({ ...prev, videoDetails: { ...prev.videoDetails, [key]: value } }));

  const isValid = useMemo(() => {
    const baseValid =
      Boolean(form.productId.trim()) &&
      Boolean(form.brand_name.trim()) &&
      Boolean(form.post_language) &&
      Boolean(form.tone) &&
      Boolean(form.platform);

    if (!baseValid) return false;
    if (form.generateImage && !form.imageDetails.sceneType.trim()) return false;
    if (form.generateVideo && !form.videoDetails.duration) return false;
    return true;
  }, [form]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleGenerate = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setPreviewImage(DEFAULT_PREVIEW_IMAGE);
    setPreviewVideo(null);
    setVideoLoadError(false);

    try {
      const payload = {
        productId: form.productId.trim(),
        brand_name: form.brand_name.trim(),
        post_language: form.post_language,
        tone: form.tone,
        platform: form.platform,
        generateImage: form.generateImage,
        generateVideo: form.generateVideo,
      };

      if (form.input_text.trim()) payload.input_text = form.input_text.trim();
      if (form.generateImage) payload.imageDetails = { ...form.imageDetails };
      if (form.generateVideo) payload.videoDetails = { ...form.videoDetails, duration: Number(form.videoDetails.duration) };

      const response = await api.post(POST_GENERATOR_API, payload);
      const responseData = response?.data || null;
      const generatedImageUrl = extractImageUrl(responseData);
      const generatedVideoUrl = extractVideoUrl(responseData);

      setResult(responseData);
      setPreviewImage(generatedImageUrl || DEFAULT_PREVIEW_IMAGE);
      setPreviewVideo(generatedVideoUrl || null);
      setVideoLoadError(false);
      showToast('success', 'Post generated successfully');
    } catch (error) {
      showToast('error', error?.response?.data?.message || error?.message || 'Failed to generate post');
    } finally {
      setLoading(false);
    }
  };

  const postData = result?.post?.post || null;
  const imageUrl = extractImageUrl(result);
  const videoUrl = previewVideo || extractVideoUrl(result);

  return (
    <div className="max-w-screen-xl mx-auto text-slate-200">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-light" />
          AI Post Generator
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate social post content with optional image and video in one request.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card p-4 grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label required>Product ID</Label>
              <input
                className="input-field"
                value={form.productId}
                onChange={(e) => setValue('productId', e.target.value)}
                placeholder="product-xxxxxxxxx"
              />
            </div>

            <div>
              <Label required>Brand Name</Label>
              <input
                className="input-field"
                value={form.brand_name}
                onChange={(e) => setValue('brand_name', e.target.value)}
                placeholder="boAt"
              />
            </div>

            <div>
              <Label required>Platform</Label>
              <Select
                value={form.platform}
                options={PLATFORMS}
                onChange={(value) => setValue('platform', value)}
                placeholder="Select platform"
              />
            </div>

            <div>
              <Label required>Language</Label>
              <Select
                value={form.post_language}
                options={POST_LANGUAGES}
                onChange={(value) => setValue('post_language', value)}
                placeholder="Select language"
              />
            </div>

            <div>
              <Label required>Tone</Label>
              <Select
                value={form.tone}
                options={TONES}
                onChange={(value) => setValue('tone', value)}
                placeholder="Select tone"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Input Text (optional)</Label>
              <textarea
                rows={3}
                className="input-field resize-none"
                value={form.input_text}
                onChange={(e) => setValue('input_text', e.target.value)}
                placeholder="Key product points, features, offers..."
              />
            </div>

            <div className="md:col-span-2 grid md:grid-cols-2 gap-3">
              <Toggle
                checked={form.generateImage}
                onChange={(value) => setValue('generateImage', value)}
                label="Generate Image"
                description="If enabled, image details section becomes required."
              />
              <Toggle
                checked={form.generateVideo}
                onChange={(value) => setValue('generateVideo', value)}
                label="Generate Video"
                description="If enabled, video details section becomes required."
              />
            </div>

            {form.generateImage && (
              <div className="md:col-span-2 glass-card p-4 grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-white mb-2">Image Details</p>
                </div>

                <div>
                  <Label>Style</Label>
                  <Select
                    value={form.imageDetails.style}
                    options={IMAGE_STYLES}
                    onChange={(value) => setImageValue('style', value)}
                  />
                </div>

                <div>
                  <Label>Lighting</Label>
                  <input
                    className="input-field"
                    value={form.imageDetails.lighting}
                    onChange={(e) => setImageValue('lighting', e.target.value)}
                    placeholder="golden hour"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label required>Scene Type</Label>
                  <textarea
                    rows={2}
                    className="input-field resize-none"
                    value={form.imageDetails.sceneType}
                    onChange={(e) => setImageValue('sceneType', e.target.value)}
                    placeholder="person enjoying music outdoors..."
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Composition</Label>
                  <input
                    className="input-field"
                    value={form.imageDetails.composition}
                    onChange={(e) => setImageValue('composition', e.target.value)}
                    placeholder="close-up lifestyle shot..."
                  />
                </div>

                <div>
                  <Label>Width</Label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.imageDetails.width}
                    onChange={(e) => setImageValue('width', Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Height</Label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.imageDetails.height}
                    onChange={(e) => setImageValue('height', Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {form.generateVideo && (
              <div className="md:col-span-2 glass-card p-4 grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-white mb-2">Video Details</p>
                </div>

                <div>
                  <Label required>Duration (seconds)</Label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    className="input-field"
                    value={form.videoDetails.duration}
                    onChange={(e) => setVideoValue('duration', Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Aspect Ratio</Label>
                  <Select
                    value={form.videoDetails.aspectRatio}
                    options={VIDEO_ASPECT_RATIOS}
                    onChange={(value) => setVideoValue('aspectRatio', value)}
                  />
                </div>

                <div>
                  <Label>Resolution</Label>
                  <Select
                    value={form.videoDetails.resolution}
                    options={VIDEO_RESOLUTIONS}
                    onChange={(value) => setVideoValue('resolution', value)}
                  />
                </div>

                <div>
                  <Label>Voice Style</Label>
                  <input
                    className="input-field"
                    value={form.videoDetails.voiceStyle}
                    onChange={(e) => setVideoValue('voiceStyle', e.target.value)}
                    placeholder="friendly and conversational"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Background Music Mood</Label>
                  <input
                    className="input-field"
                    value={form.videoDetails.backgroundMusicMood}
                    onChange={(e) => setVideoValue('backgroundMusicMood', e.target.value)}
                    placeholder="chill lo-fi"
                  />
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <button
                onClick={handleGenerate}
                disabled={!isValid || loading}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                  isValid && !loading
                    ? 'bg-brand text-white hover:bg-brand-light'
                    : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  'Generate Post'
                )}
              </button>
              {!isValid && (
                <p className="text-xs text-slate-500 mt-2">
                  Required: Product ID, Brand Name, Language, Tone, Platform. Scene Type is required if image is enabled.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 sticky top-6">
          <div className="glass-card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Generated Post</p>
            {!postData ? (
              <p className="text-sm text-slate-500">Generated content will appear here.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-white font-semibold">{postData.title || 'Untitled'}</p>
                {postData.subtitle && <p className="text-slate-300">{postData.subtitle}</p>}
                {postData.content && (
                  <p className="text-slate-300 whitespace-pre-line max-h-64 overflow-auto">{postData.content}</p>
                )}
                {Array.isArray(postData.hashtags) && postData.hashtags.length > 0 && (
                  <p className="text-brand-light text-xs">{postData.hashtags.join(' ')}</p>
                )}
              </div>
            )}
          </div>

          <div className="glass-card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Image
            </p>
            <img src={previewImage} alt="Post image preview" className="w-full rounded-xl border border-white/[0.08]" />
            <p className="text-xs text-slate-500 mt-2">{imageUrl ? 'Generated image preview' : 'Default preview image'}</p>
          </div>

          <div className="glass-card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
              <Video className="w-4 h-4" /> Video
            </p>
            {videoUrl ? (
              <div className="space-y-2">
                <video
                  key={videoUrl}
                  controls
                  preload="metadata"
                  playsInline
                  onLoadedData={() => setVideoLoadError(false)}
                  onError={() => setVideoLoadError(true)}
                  className="w-full rounded-xl border border-white/[0.08]"
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
                {videoLoadError && (
                  <p className="text-xs text-amber-300">
                    Video URL is present but inline preview failed.{' '}
                    <a href={videoUrl} target="_blank" rel="noreferrer" className="underline text-amber-200">
                      Open video
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No video generated.</p>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>{toast && <Toast type={toast.type} message={toast.message} />}</AnimatePresence>
    </div>
  );
}
