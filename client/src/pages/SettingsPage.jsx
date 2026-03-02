// SettingsPage.jsx — Shows real user from localStorage
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SettingsPage() {
  const nav = useNavigate();
  const [saved, setSaved] = useState(false);

  // Read stored user from localStorage
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    nav('/login');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account preferences</p>
      </div>

      <div className="max-w-lg space-y-6">
        {/* Profile */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Profile</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Display Name</label>
              <input className="input-field" placeholder="Your name" defaultValue={storedUser.name || ''} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input className="input-field" type="email" placeholder="you@example.com"
                defaultValue={storedUser.email || ''} readOnly />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
              <input className="input-field" placeholder="username" defaultValue={storedUser.username || ''} readOnly />
            </div>
            <button type="submit" className="btn-primary text-sm">
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Session info */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-white mb-3">Session</h2>
          <div className="text-xs text-slate-500 space-y-1 mb-4">
            <p>Logged in as <span className="text-slate-300">{storedUser.email || '—'}</span></p>
            <p>User ID: <span className="font-mono text-slate-400">{storedUser.id || '—'}</span></p>
          </div>
          <button
            className="text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/5 border border-red-500/20"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
