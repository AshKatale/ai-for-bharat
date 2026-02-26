import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';

const features = [
  'AI Presence Analysis',
  'Campaign Strategy Generation',
  'Poster & Video Ad Creation',
  'Public Sentiment Analysis'
];

const pricing = [
  { name: 'Starter', price: '$49/mo', details: 'Ideal for early-stage products' },
  { name: 'Growth', price: '$149/mo', details: 'Advanced analytics and campaigns' },
  { name: 'Scale', price: '$299/mo', details: 'Multi-brand optimization suite' }
];

function LandingPage() {
  return (
    <div className="grid-bg bg-grid">
      <section className="mx-auto max-w-6xl px-4 py-20 text-center lg:px-8">
        <p className="mb-6 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs text-cyan-200">
          AI Discoverability Optimization
        </p>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-white md:text-6xl">
          Transform Your Marketing with AI Discoverability Optimization
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-slate-300">
          Make your product visible inside GPT, Claude, and Perplexity responses with data-backed strategy and creative automation.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/signup">
            <Button>Get Started</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Login</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 lg:px-8">
        <h2 className="mb-6 text-2xl font-semibold text-white">Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature} className="hover:-translate-y-1 hover:shadow-glow">
              <p className="font-medium text-slate-100">{feature}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 lg:px-8">
        <h2 className="mb-6 text-2xl font-semibold text-white">Pricing Preview</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {pricing.map((plan) => (
            <Card key={plan.name} className="hover:border-cyan-400/40">
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-2 text-2xl font-bold text-cyan-300">{plan.price}</p>
              <p className="mt-2 text-sm text-slate-300">{plan.details}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
