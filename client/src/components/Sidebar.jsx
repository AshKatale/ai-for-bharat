import { NavLink } from 'react-router-dom';

const links = [
  { name: 'Overview', to: '/dashboard' },
  { name: 'Product Listing', to: '/dashboard/product-onboarding' },
  { name: 'AI Presence Analytics', to: '/dashboard/ai-presence' },
  { name: 'Campaign Strategy', to: '/dashboard/campaign-strategy' },
  { name: 'Design Studio', to: '/dashboard/design-studio' },
  { name: 'Sentiment Analysis', to: '/dashboard/sentiment' },
  { name: 'Settings', to: '/dashboard/settings' }
];

function Sidebar() {
  return (
    <>
      <aside className="glass hidden w-72 shrink-0 border-r border-slate-700/50 p-5 lg:block">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">AIO Platform</div>
          <h2 className="mt-2 text-lg font-semibold text-white">Control Center</h2>
        </div>
        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm transition ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-700 bg-slate-950/95 p-2 backdrop-blur lg:hidden">
        <nav className="flex gap-2 overflow-x-auto">
          {links.slice(0, 6).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-xs ${
                  isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-300'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}

export default Sidebar;
