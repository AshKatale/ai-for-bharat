import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import Card from '../components/Card';
import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ProgressCircle from '../components/ProgressCircle';
import { api } from '../services/api';

function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getOverview().then((res) => {
      if (mounted) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Loader label="Loading dashboard overview..." />;
  if (!data) return <EmptyState title="No Overview Data" description="Try refreshing to load overview metrics." />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Overview</h2>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="AI Visibility Score">
          <ProgressCircle value={data.visibilityScore} />
        </Card>
        <Card title="AI Platform Presence" className="lg:col-span-2">
          <div className="grid gap-3 md:grid-cols-3">
            {data.presence.map((item) => (
              <div key={item.platform} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-sm text-slate-400">{item.platform}</p>
                <p className="mt-1 text-2xl font-bold text-cyan-300">{item.score}%</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="AI Visibility Trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Competitor Comparison">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.competitors}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="visibility" fill="#34d399" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card title="Recent Campaigns">
        <div className="space-y-3">
          {data.campaigns.map((campaign) => (
            <div key={campaign.id} className="flex flex-wrap items-center justify-between rounded-xl border border-slate-700 p-3">
              <div>
                <p className="font-medium text-slate-100">{campaign.name}</p>
                <p className="text-sm text-slate-400">{campaign.channel}</p>
              </div>
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300">{campaign.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default OverviewPage;
