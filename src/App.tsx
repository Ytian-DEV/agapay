import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppStateProvider } from './context/AppStateContext';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { SmsPreviewPage } from './pages/SmsPreviewPage';
import { OnboardingFlowPage } from './pages/OnboardingFlowPage';
import { HomePage } from './pages/HomePage';
import { PlantingWindowPage } from './pages/PlantingWindowPage';
import { RainCheckInPage } from './pages/RainCheckInPage';
import { MapPage } from './pages/MapPage';
import { AlertsPage } from './pages/AlertsPage';
import { SyncStatusPage } from './pages/SyncStatusPage';
import { CropSuggestionsPage } from './pages/CropSuggestionsPage';
import { CropCompareAndGuidesPage } from './pages/CropCompareAndGuidesPage';
import { YieldEstimatePage } from './pages/YieldEstimatePage';
import { HarvestFeedbackPage } from './pages/HarvestFeedbackPage';
import { ForecastAccuracyPage } from './pages/ForecastAccuracyPage';
import { ProfilePage } from './pages/ProfilePage';
import { PlansPage } from './pages/PlansPage';
import { FieldsPage } from './pages/FieldsPage';
import { PrivacyAndSourcesPage } from './pages/PrivacyAndSourcesPage';
import { LguDashboardPage } from './pages/LguDashboardPage';

export default function App() {
  return (
    <ThemeProvider>
      <AppStateProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingFlowPage />} />
            <Route path="/sms-preview" element={<SmsPreviewPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/planting-window" element={<PlantingWindowPage />} />
            <Route path="/rain-checkin" element={<RainCheckInPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/sync" element={<SyncStatusPage />} />
            <Route path="/crops" element={<CropSuggestionsPage />} />
            <Route path="/crop-compare" element={<CropCompareAndGuidesPage />} />
            <Route path="/crop-guides" element={<CropCompareAndGuidesPage />} />
            <Route path="/yield" element={<YieldEstimatePage />} />
            <Route path="/harvest-feedback" element={<HarvestFeedbackPage />} />
            <Route path="/accuracy" element={<ForecastAccuracyPage />} />
            <Route path="/fields" element={<FieldsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/privacy" element={<PrivacyAndSourcesPage />} />
            <Route path="/lgu" element={<LguDashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppStateProvider>
    </ThemeProvider>
  );
}
