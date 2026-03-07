// DashboardLayout.jsx — Sidebar + main content area
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

function DashboardLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-60 min-h-screen">
        <Navbar showAuth={false} showDashboard={false} />
        <main className="flex-1 overflow-y-auto pt-16">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;