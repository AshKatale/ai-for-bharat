import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '../components/Card';
import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import ProgressCircle from '../components/ProgressCircle';
import { api } from '../services/api';

const colors = ['#34d399', '#facc15', '#fb7185'];

function SentimentAnalysisPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getSentiment().then((res) => setData(res));
  }, []);

  if (!data) return <Loader label="Loading sentiment signals..." />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Sentiment Analysis</h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Sentiment Score Gauge">
          <ProgressCircle value={data.score} />
        </Card>

        <ChartCard title="Sentiment Breakdown">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.breakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                {data.breakdown.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card title="Keyword Cloud">
        <div className="flex flex-wrap gap-3">
          {data.keywords.map((keyword, idx) => (
            <span
              key={keyword}
              className="rounded-full border border-slate-600 bg-slate-900/70 px-4 py-2 text-sm text-slate-200"
              style={{ fontSize: `${0.8 + (idx % 4) * 0.15}rem` }}
            >
              {keyword}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default SentimentAnalysisPage;
