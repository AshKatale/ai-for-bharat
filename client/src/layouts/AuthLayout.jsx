import { Link, Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-950/70 p-6 shadow-xl">
        <Link to="/" className="mb-6 block text-sm text-cyan-300 hover:text-cyan-200">
          Back to Home
        </Link>
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
