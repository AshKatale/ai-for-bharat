// Navbar.jsx — Sticky top bar (used in auth layout and as mobile bar)
import { Link } from 'react-router-dom';

function Navbar({ showAuth = true }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/6 h-16">
      <div className="h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-shadow">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="text-sm font-bold text-white">AI for Bharat</span>
        </Link>

        {showAuth && (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <button className="btn-ghost text-sm">Login</button>
            </Link>
            <Link to="/signup">
              <button className="btn-primary text-sm">Get Started</button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
