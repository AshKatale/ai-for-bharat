// AuthLayout.jsx — Centered auth pages with glass card
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showAuth={false} />
      <div className="flex-1 flex items-center justify-center px-4 pt-20">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
