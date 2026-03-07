// Navbar.jsx — Sticky top bar (used in auth layout and as mobile bar)
import { Link } from 'react-router-dom';

function Navbar({ showAuth = true, showDashboard = false }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/6 h-16">
      <div className="h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-shadow">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="text-sm font-bold text-white">AI for Bharat</span>
        </Link>

        <div className="flex items-center gap-2">
          {showDashboard && (
            <Link to="/dashboard">
              <button className="btn-outline text-sm flex items-center gap-1.5 px-4 py-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>
            </Link>
          )}
          {showAuth && (
            <>
              <Link to="/login">
                <button className="btn-ghost text-sm">Login</button>
              </Link>
              <Link to="/signup">
                <button className="btn-primary text-sm">Get Started</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
