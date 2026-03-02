import { useState, useEffect } from 'react';
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';
import Card from '../components/Card';
import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import ProgressCircle from '../components/ProgressCircle';
import Button from '../components/Button';
import { api } from '../services/api';

const COLORS = ['#34d399', '#94a3b8', '#fb7185']; // Positive (Green), Neutral (Slate), Negative (Red)

function SentimentAnalysisPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Form state
  const [form, setForm] = useState({
    productName: '',
    category: '',
    description: '',
    targetAudience: '',
    competitors: '',
    websiteUrl: ''
  });

  // Pull from local storage if they just came from the onboarding page
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('onboarding_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setForm({
          productName: parsed.productName || '',
          category: parsed.category || '',
          description: parsed.description || '',
          targetAudience: parsed.targetAudience || '',
          competitors: parsed.competitors || '',
          websiteUrl: parsed.websiteUrl || ''
        });
      }
    } catch (e) { }
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleStartAnalysis = async (e) => {
    e.preventDefault();
    setHasStarted(true);
    setLoading(true);
    setError(null);

    const extraKeywords = form.competitors.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const res = await api.analyzeSentiment(`prod_${Date.now()}`, {
        brandName: form.category || 'AI Discoverability',
        productName: form.productName || 'Pro Analyzer',
        extraKeywords
      });
      if (res.success) {
        setData(res.data);
      } else {
        setError('Failed to fetch sentiment data');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to sentiment pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setHasStarted(false);
    setData(null);
  };

  if (!hasStarted) {
    return (
      <div className="max-w-xl mx-auto space-y-6 mt-10 animate-in fade-in duration-500">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">Setup Sentiment Analysis</h2>
          <p className="text-slate-400 mt-2">Enter the details of the product you want to analyze.</p>
        </div>
        <Card>
          <form onSubmit={handleStartAnalysis} className="space-y-4">
            <input
              name="productName"
              placeholder="Product Name"
              className="input text-sm px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={form.productName}
              onChange={handleChange}
              required
            />
            <input
              name="category"
              placeholder="Category"
              className="input text-sm px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={form.category}
              onChange={handleChange}
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              className="input text-sm px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 rounded-md w-full min-h-[100px] focus:outline-none focus:ring-1 focus:ring-slate-500 resize-y"
              value={form.description}
              onChange={handleChange}
            />
            <input
              name="targetAudience"
              placeholder="Target Audience"
              className="input text-sm px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={form.targetAudience}
              onChange={handleChange}
            />
            <input
              name="competitors"
              placeholder="Competitors"
              className="input text-sm px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={form.competitors}
              onChange={handleChange}
            />
            <input
              name="websiteUrl"
              placeholder="Website URL"
              className="input text-sm px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={form.websiteUrl}
              onChange={handleChange}
            />
            <Button type="submit" className="w-full mt-4">Analyze Market Sentiment</Button>
          </form>
        </Card>
      </div>
    );
  }

  if (loading) return <Loader label="Fetching real-time data & analyzing live market sentiment..." />;

  if (error) {
    return (
      <div className="flex flex-col h-64 items-center justify-center rounded-xl bg-slate-800/50 border border-slate-700">
        <div className="text-center mb-4">
          <p className="text-red-400 font-medium mb-2">Analysis Failed</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
        <Button variant="secondary" onClick={handleReset}>Try Again</Button>
      </div>
    );
  }

  if (!data) return null;

  // Format sentiment distribution for PieChart
  const pieData = [
    { name: 'Positive', value: data.sentiment_distribution.positive },
    { name: 'Neutral', value: data.sentiment_distribution.neutral },
    { name: 'Negative', value: data.sentiment_distribution.negative }
  ];

  const getRiskColor = (risk) => {
    if (risk === 'LOW') return 'text-emerald-400';
    if (risk === 'MEDIUM') return 'text-yellow-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Sentiment Intelligence Dashboard</h2>
          <p className="text-slate-400 mt-1">Analyzing: <span className="text-emerald-400 font-medium">{form.category || 'AI Discoverability'} {form.productName}</span></p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleReset}>New Analysis</Button>
      </div>

      {/* TOP ROW */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Market Perception Score" className="group relative overflow-hidden transition-all hover:bg-slate-800/80">
          <div className="flex flex-col items-center justify-center h-full py-4">
            <ProgressCircle value={data.market_perception_score} />
            <div className="mt-4 text-center">
              <span className="text-lg font-medium text-white">{data.market_perception_label}</span>
            </div>
          </div>
        </Card>

        <Card title="AI Visibility Risk" className="group relative overflow-hidden transition-all hover:bg-slate-800/80">
          <div className="flex flex-col items-center justify-center h-full py-4 text-center">
            <div className={`text-4xl font-bold tracking-tight mb-3 ${getRiskColor(data.ai_visibility_risk)}`}>
              {data.ai_visibility_risk}
            </div>
            <p className="text-sm text-slate-300 max-w-[200px] leading-relaxed">
              {data.ai_visibility_reason}
            </p>
          </div>
        </Card>

        <ChartCard title="Sentiment Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                label={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>{pieData[0].value}% Pos</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span>{pieData[1].value}% Neu</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span>{pieData[2].value}% Neg</div>
          </div>
        </ChartCard>
      </div>

      {/* MIDDLE ROW */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Competitor Sentiment Gap">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.competitor_sentiment_gap} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
              />
              <Bar dataKey="sentiment_gap" radius={[4, 4, 4, 4]}>
                {data.competitor_sentiment_gap.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.sentiment_gap > 0 ? '#34d399' : '#fb7185'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card title="Trending Customer Themes">
          <div className="flex flex-wrap gap-3 items-center justify-center p-4 min-h-[250px]">
            {data.trending_customer_themes.map((theme, idx) => (
              <span
                key={idx}
                className="rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-center transition-colors hover:border-slate-500 hover:bg-slate-700 cursor-default"
                style={{
                  fontSize: `${Math.max(0.8, Math.min(1.5, theme.weight / 40))}rem`,
                  color: theme.sentiment_score > 60 ? '#34d399' : theme.sentiment_score < 40 ? '#fb7185' : '#e2e8f0',
                  opacity: Math.max(0.6, theme.weight / 100)
                }}
              >
                {theme.theme}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* BOTTOM ROW */}
      <ChartCard title="Sentiment Trend (Last 1 Year)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.sentiment_trend_30d} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#bae6fd', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export default SentimentAnalysisPage;
