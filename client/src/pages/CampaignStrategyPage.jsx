import { useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { api } from '../services/api';

function CampaignStrategyPage() {
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const response = await api.getStrategy();
    setStrategy(response);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">Campaign Strategy</h2>
        <Button onClick={generate}>Generate Strategy</Button>
      </div>

      {loading ? <Loader label="Generating AI campaign strategy..." /> : null}

      {!loading && strategy ? (
        <>
          <Card title="AI Generated Strategy Card">
            <p className="text-slate-300">{strategy.summary}</p>
          </Card>

          <Card title="Recommended Marketing Channels">
            <div className="flex flex-wrap gap-2">
              {strategy.channels.map((channel) => (
                <span key={channel} className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-300">
                  {channel}
                </span>
              ))}
            </div>
          </Card>

          <Card title="SEO + AI Optimization Suggestions">
            <ul className="space-y-2 text-sm text-slate-300">
              {strategy.optimizations.map((item) => (
                <li key={item} className="rounded-lg border border-slate-700 p-3">
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}

      {!loading && !strategy ? (
        <Card>
          <p className="text-slate-400">No strategy generated yet. Click “Generate Strategy” to start.</p>
        </Card>
      ) : null}
    </div>
  );
}

export default CampaignStrategyPage;
