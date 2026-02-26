import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../components/Card';
import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import { api } from '../services/api';

function AIPresenceAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPresenceAnalytics().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loader label="Analyzing AI presence data..." />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">AI Presence Analytics</h2>

      <ChartCard title="Your Product vs Competitors">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.competitors}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="visibility" fill="#22d3ee" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card title="Gap Analysis">
        <p className="text-slate-300">{data.gap}</p>
      </Card>

      <Card title="Improvement Suggestions">
        <div className="grid gap-3 md:grid-cols-3">
          {data.suggestions.map((suggestion) => (
            <div key={suggestion} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
              {suggestion}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AIPresenceAnalyticsPage;
