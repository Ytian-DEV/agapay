import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './context/ThemeContext';
import { AppStateProvider } from './context/AppStateContext';
import { MobileShell } from './components/MobileShell';
import { AgapayLogo } from './components/AgapayLogo';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { WelcomePage } from './pages/WelcomePage';
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

function PlaceholderView({ titleKey, subtitleKey }: { titleKey: string; subtitleKey: string }) {
  const { t } = useTranslation();
  return (
    <MobileShell>
      <div className="flex justify-end pt-2">
        <LanguageSwitcher variant="pill" />
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AgapayLogo size="md" />
        <h1 className="font-brand mt-4 text-3xl font-semibold text-[var(--accent)]">
          {t(titleKey)}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-[var(--sub)]">{t(subtitleKey)}</p>
      </div>
    </MobileShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppStateProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
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
            <Route
              path="/lgu"
              element={<PlaceholderView titleKey="lgu.title" subtitleKey="lgu.privacyNote" />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppStateProvider>
    </ThemeProvider>
  );
}
