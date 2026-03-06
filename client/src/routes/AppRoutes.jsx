import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import OverviewPage from '../pages/OverviewPage';
import ProductsPage from '../pages/ProductsPage';
import ProductOnboardingPage from '../pages/ProductOnboardingPage';
import SettingsPage from '../pages/SettingsPage';
import VideoAdGeneratorPage from '../pages/VideoAdGeneratorPage';
import ImageAdGeneratorPage from '../pages/ImageAdGeneratorPage';
import PostGeneratorPage from '../pages/PostGeneratorPage';
import ProductDashboardPage from '../pages/ProductDashboardPage';
import AddProductPage from '../pages/AddProductPage';

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/add-product" element={<AddProductPage />} />

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Product Dashboard (public placeholder page) */}
      <Route path="/products/:productId/dashboard" element={<ProductDashboardPage />} />

      {/* Dashboard (protected by sidebar layout) */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="add-product" element={<ProductOnboardingPage />} />
        <Route path="image-generator" element={<ImageAdGeneratorPage />} />
        <Route path="video-generator" element={<VideoAdGeneratorPage />} />
        <Route path="post-generator" element={<PostGeneratorPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
