import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AIPresenceAnalyticsPage from '../pages/AIPresenceAnalyticsPage';
import CampaignStrategyPage from '../pages/CampaignStrategyPage';
import DesignStudioPage from '../pages/DesignStudioPage';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import OverviewPage from '../pages/OverviewPage';
import ProductOnboardingPage from '../pages/ProductOnboardingPage';
import SentimentAnalysisPage from '../pages/SentimentAnalysisPage';
import SettingsPage from '../pages/SettingsPage';
import SignupPage from '../pages/SignupPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="product-onboarding" element={<ProductOnboardingPage />} />
        <Route path="ai-presence" element={<AIPresenceAnalyticsPage />} />
        <Route path="campaign-strategy" element={<CampaignStrategyPage />} />
        <Route path="design-studio" element={<DesignStudioPage />} />
        <Route path="sentiment" element={<SentimentAnalysisPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
