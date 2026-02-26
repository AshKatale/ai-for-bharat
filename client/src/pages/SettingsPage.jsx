import Card from '../components/Card';

function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Settings</h2>
      <Card>
        <p className="text-slate-300">Workspace preferences, integrations, and billing controls can be configured here.</p>
      </Card>
    </div>
  );
}

export default SettingsPage;
