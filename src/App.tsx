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
            <Route
              path="/crops"
              element={<PlaceholderView titleKey="crops.title" subtitleKey="crops.topThreeHint" />}
            />
            <Route
              path="/crop-guides"
              element={<PlaceholderView titleKey="crops.guidesTitle" subtitleKey="home.cropGuidesSub" />}
            />
            <Route
              path="/yield"
              element={<PlaceholderView titleKey="crops.yieldTitle" subtitleKey="home.yieldEstimateSub" />}
            />
            <Route
              path="/fields"
              element={<PlaceholderView titleKey="profile.manageFields" subtitleKey="home.selectedField" />}
            />
            <Route
              path="/profile"
              element={<PlaceholderView titleKey="profile.title" subtitleKey="profile.privacySupport" />}
            />
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
