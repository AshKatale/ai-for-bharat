// LandingPage.jsx — No emojis version
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const features = [
  {
    title: 'Live Search Simulation',
    desc: 'Watch every backend step in real-time as your query is processed.',
    icon: (
      <svg className="w-6 h-6 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: 'Indian AI Ecosystem',
    desc: 'Discover and showcase AI tools, platforms, and APIs built by Indian developers.',
    icon: (
      <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Engagement Analytics',
    desc: 'Track downloads, stars, views, and active users for every product.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Instant Listing',
    desc: 'Onboard your product in minutes with our guided multi-step form.',
    icon: (
      <svg className="w-6 h-6 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
];

const steps = [
  { no: '01', label: 'Create an account', desc: 'Sign up free in under 30 seconds.' },
  { no: '02', label: 'List your product', desc: 'Fill in name, category, links, and tags.' },
  { no: '03', label: 'Get discovered', desc: 'Users find you through live AI-powered search.' },
];

const LIVE_STEP_LABELS = [
  'Query received: "AI image tools"',
  'Parsing query intent',
  'Fetching products',
  'Filtering by category and tags',
  'Ranking by engagement score',
  'Results ready',
];

function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [productQuery, setProductQuery] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % LIVE_STEP_LABELS.length);
    }, 1400);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pulseTimer = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 20);
    }, 180);

    return () => clearInterval(pulseTimer);
  }, []);

  const liveSteps = LIVE_STEP_LABELS.map((label, i) => ({
    label,
    s: i < activeStep ? 'done' : i === activeStep ? 'active' : 'pending',
  }));

  const signalBars = [0, 1, 2, 3, 4].map((i) => {
    const wave = (pulsePhase + i * 3) % 20;
    const base = wave < 10 ? wave : 20 - wave;
    return Math.max(30, base * 7 + 20);
  });

  return (
    <div className="min-h-screen flex flex-col landing-grid">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-24 px-4 text-center max-w-5xl mx-auto w-full relative">
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />
        <div className="hero-orb hero-orb-bottom" />

        <span className="inline-flex items-center gap-2 mb-6 text-xs font-medium px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand-light">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          India's AI Product Discovery Platform
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6 animate-fade-slide">
          Discover AI Products{' '}
          <span className="gradient-text">Built for Bharat</span>
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
          Discover, showcase, and supercharge AI products built by Indian developers. Leverage built-in tools for geo-analysis, automated ad creatives, and actionable insights.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/signup">
            <button className="btn-primary text-base px-7 py-3 glow-button">Get Started Free</button>
          </Link>
          <Link to="/login">
            <button className="btn-outline text-base px-7 py-3">Sign In</button>
          </Link>
        </div>

        {/* Live simulation preview strip */}
        <div className="mt-14 glass-card simulation-card max-w-2xl mx-auto p-5 text-left">
          <div className="flex items-start justify-between gap-4 mb-4">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              Live simulation preview
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="text-[11px] text-emerald-300 font-medium">Realtime</span>
            </div>
          </div>
          <div className="space-y-2.5 relative z-10">
            {liveSteps.map((item, i) => (
              <div key={item.label} className={`flex items-center gap-3 live-step-row ${item.s === 'active' ? 'live-step-active-row' : ''}`}>
                {item.s === 'done' && (
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {item.s === 'active' && (
                  <span className="w-4 h-4 rounded-full border-2 border-brand flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                  </span>
                )}
                {item.s === 'pending' && (
                  <span className="w-4 h-4 rounded-full border-2 border-slate-700 shrink-0 inline-block" />
                )}
                <span className={`text-sm transition-colors duration-300 ${item.s === 'done' ? 'text-slate-300' :
                  item.s === 'active' ? 'text-white font-medium' :
                    'text-slate-600'
                  }`}>{item.label}</span>
                {item.s === 'active' && (
                  <span className="ml-auto text-xs text-brand-light font-mono live-running">running...</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">Signal strength</span>
              <span className="text-[11px] text-slate-400 font-mono">42ms latency</span>
            </div>
            <div className="flex items-end gap-1 h-8">
              {signalBars.map((h, i) => (
                <span
                  key={`bar-${i}`}
                  className="w-2 rounded-t bg-gradient-to-t from-emerald-600/80 to-brand-light/90 transition-all duration-200"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Everything you need to <span className="gradient-text">discover and list</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div key={i} className="glass-card p-5 feature-card" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="p-2.5 rounded-lg bg-white/5 w-fit mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 max-w-4xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-white text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="glass-card p-6 text-center step-card" style={{ animationDelay: `${i * 110}ms` }}>
              <div className="text-4xl font-black gradient-text mb-3">{s.no}</div>
              <h3 className="text-base font-semibold text-white mb-2">{s.label}</h3>
              <p className="text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="glass-card cta-card max-w-2xl mx-auto p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get discovered?</h2>
          <p className="text-slate-400 mb-8">Join the platform built for India's AI builders.</p>
          <Link to="/signup">
            <button className="btn-primary text-base px-8 py-3">Create Free Account</button>
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-xs text-slate-600 border-t border-white/5">
        2025 Geonix · Built in India
      </footer>
    </div>
  );
}

export default LandingPage;
