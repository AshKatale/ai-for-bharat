import { useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';

function DesignStudioPage() {
  const [tab, setTab] = useState('poster');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Design Studio</h2>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('poster')}
          className={`rounded-lg px-4 py-2 text-sm ${tab === 'poster' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-300'}`}
        >
          Poster Generator
        </button>
        <button
          onClick={() => setTab('video')}
          className={`rounded-lg px-4 py-2 text-sm ${tab === 'video' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-300'}`}
        >
          Video Ad Generator
        </button>
      </div>

      {tab === 'poster' ? (
        <Card title="Poster Generator">
          <div className="mb-4 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-900/60 text-slate-400">
            Poster preview area
          </div>
          <div className="flex flex-wrap gap-3">
            <Button>Generate Poster</Button>
            <Button variant="outline">Regenerate</Button>
            <Button variant="outline">Download</Button>
          </div>
        </Card>
      ) : (
        <Card title="Video Ad Generator">
          <div className="mb-4 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-900/60 text-slate-400">
            Video preview placeholder
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <input className="input" placeholder="Duration (sec)" />
            <input className="input" placeholder="Tone (Energetic/Professional)" />
            <input className="input" placeholder="Aspect Ratio" />
          </div>
          <Button>Generate Video</Button>
        </Card>
      )}
    </div>
  );
}

export default DesignStudioPage;
