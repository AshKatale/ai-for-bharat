import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import OverviewPage from '../pages/OverviewPage';
import SearchSimulationPage from '../pages/SearchSimulationPage';
import ProductsPage from '../pages/ProductsPage';
import ProductOnboardingPage from '../pages/ProductOnboardingPage';
import SettingsPage from '../pages/SettingsPage';
import VideoAdGeneratorPage from '../pages/VideoAdGeneratorPage';
import ImageAdGeneratorPage from '../pages/ImageAdGeneratorPage';

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Dashboard (protected by sidebar layout) */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="search" element={<SearchSimulationPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="add-product" element={<ProductOnboardingPage />} />
        <Route path="image-generator" element={<ImageAdGeneratorPage />} />
        <Route path="video-generator" element={<VideoAdGeneratorPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
