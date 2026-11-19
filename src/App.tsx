import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { MobileShell } from './components/MobileShell';
import { AgapayLogo } from './components/AgapayLogo';

function PlaceholderView({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <MobileShell>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AgapayLogo size="md" />
        <h1 className="font-brand mt-4 text-3xl font-semibold text-[var(--accent)]">{title}</h1>
        <p className="mt-2 max-w-xs text-sm text-[var(--sub)]">{subtitle}</p>
      </div>
    </MobileShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <PlaceholderView
                title="Agapay"
                subtitle="Plant at the right time. Mobile-first PWA foundation ready."
              />
            }
          />
          <Route
            path="/home"
            element={<PlaceholderView title="Home" subtitle="Planting window & field overview." />}
          />
          <Route
            path="/map"
            element={<PlaceholderView title="Map" subtitle="Hyper-local Baybay City weather-crop map." />}
          />
          <Route
            path="/alerts"
            element={<PlaceholderView title="Alerts" subtitle="Risk & waterlogging advisories." />}
          />
          <Route
            path="/profile"
            element={<PlaceholderView title="Profile" subtitle="Farm settings, plans & privacy." />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
