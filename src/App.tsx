import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './context/ThemeContext';
import { AppStateProvider } from './context/AppStateContext';
import { MobileShell } from './components/MobileShell';
import { AgapayLogo } from './components/AgapayLogo';
import { LanguageSwitcher } from './components/LanguageSwitcher';

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
            <Route
              path="/"
              element={<PlaceholderView titleKey="brand.name" subtitleKey="brand.tagline" />}
            />
            <Route
              path="/home"
              element={<PlaceholderView titleKey="nav.home" subtitleKey="home.plantingWindow" />}
            />
            <Route
              path="/map"
              element={<PlaceholderView titleKey="nav.map" subtitleKey="map.tapCellHint" />}
            />
            <Route
              path="/alerts"
              element={<PlaceholderView titleKey="alerts.title" subtitleKey="alerts.smsActiveNote" />}
            />
            <Route
              path="/profile"
              element={<PlaceholderView titleKey="profile.title" subtitleKey="profile.privacySupport" />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppStateProvider>
    </ThemeProvider>
  );
}
