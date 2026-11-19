import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  ChevronRight,
  CloudRain,
  Droplets,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { OfflineBanner } from '../components/OfflineBanner';
import { StatusPill } from '../components/StatusPill';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAppState } from '../context/AppStateContext';

export function HomePage() {
  const { t } = useTranslation();
  const {
    barangays,
    crops,
    advisories,
    alerts,
    activeParcel,
    parcels,
    setActiveParcelId,
    isOnline,
    isCacheStale,
    lastSyncedAt,
    profile,
  } = useAppState();

  const crop = crops.find((c) => c.slug === activeParcel.crop_slug) ?? crops[0];
  const barangay =
    barangays.find((b) => b.id === activeParcel.barangay_id) ?? barangays[0];
  const advisory = advisories[crop.slug] ?? advisories.corn ?? Object.values(advisories)[0];

  const activeAlertCount = alerts.filter((a) => a.is_active).length;

  const todayLabel = new Date().toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const updatedLabel = new Date(lastSyncedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const maxRain = Math.max(...advisory.daily_rain.map((d) => d.mm), 12);

  const cycleField = () => {
    if (parcels.length <= 1) return;
    const idx = parcels.findIndex((p) => p.id === activeParcel.id);
    const next = parcels[(idx + 1) % parcels.length];
    setActiveParcelId(next.id);
  };

  return (
    <MobileShell>
      {/* Top Utility Row */}
      <div className="flex items-center justify-between gap-2 pb-2 pt-1">
        <LanguageSwitcher variant="pill" className="min-h-[40px] px-3 py-1.5 text-xs" />
        <Link
          to="/sync"
          className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
            isOnline ? 'status-go' : 'status-wait'
          }`}
        >
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isOnline ? t('common.online') : t('common.offline')}</span>
        </Link>
      </div>

      {/* Main Header (Figma 02 Home) */}
      <header className="pb-3">
        <p className="text-xs font-semibold text-[var(--sub)]">
          {todayLabel} · {barangay.municipality}, {barangay.province}
        </p>
        <div className="mt-0.5 flex items-baseline justify-between gap-2">
          <h1 className="text-[36px] font-bold leading-tight tracking-tight text-[var(--ink)]">
            {crop.name}
          </h1>
          <span className="text-sm font-semibold text-[var(--sub)]">{crop.local_name}</span>
        </div>
      </header>

      <OfflineBanner />

      <div className="space-y-3.5">
        {/* Selected Field Card */}
        <section className="ag-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--sub)]">
                {t('home.selectedField')}
              </p>
              <h2 className="mt-0.5 text-xl font-bold text-[var(--ink)]">
                {activeParcel.field_name}
              </h2>
            </div>

            {parcels.length > 1 ? (
              <button
                type="button"
                onClick={cycleField}
                className="min-h-[40px] rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 text-xs font-bold text-[var(--ink)] transition hover:border-[var(--accent)]"
              >
                {t('home.switchField')} ({parcels.length})
              </button>
            ) : (
              <Link
                to="/fields"
                className="min-h-[40px] inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 text-xs font-bold text-[var(--ink)]"
              >
                {t('profile.manageFields')}
              </Link>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--sub)]">
            <span className="font-semibold text-[var(--ink)]">Brgy. {barangay.name}</span>
            <span>
              {activeParcel.area_ha} {t('common.hectares')}
            </span>
            <span>Zone {activeParcel.grid_cell}</span>
          </div>
        </section>

        {/* Planting Window Hero Card */}
        <section className="ag-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--sub)]">
              {t('home.plantingWindow')}
            </p>
            {advisory.technician_reviewed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent)]">
                <ShieldCheck size={12} />
                {t('common.technicianReviewed')}
              </span>
            )}
          </div>

          <p className="mt-1.5 text-[34px] font-extrabold leading-none tracking-tight text-[var(--ink)]">
            {advisory.window_label}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill variant={advisory.decision} size="md" />
            <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--sub)]">
              {advisory.confidence === 'high'
                ? t('common.confidenceHigh')
                : advisory.confidence === 'low'
                ? t('common.confidenceLow')
                : t('common.confidenceMedium')}{' '}
              · {t('common.modeled')}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-bold leading-snug text-[var(--ink)]">
            {advisory.headline}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--sub)]">
            {advisory.plain_explanation}
          </p>

          <p className="mt-3 text-xs text-[var(--muted)]">
            {t('common.updated')} {updatedLabel}
            {isCacheStale ? ` · ${t('common.staleWarning')}` : ''}
          </p>

          <Link
            to="/planting-window"
            className="mt-3 flex min-h-[48px] items-center justify-between rounded-2xl bg-[var(--accent-soft)] px-4 text-sm font-bold text-[var(--accent)] transition hover:opacity-90"
          >
            <span>{t('home.openWindowDetails')}</span>
            <ChevronRight size={18} />
          </Link>
        </section>

        {/* Conditions 2-Column Row (Waterlogging + 7-Day Rain) */}
        <section className="grid grid-cols-2 gap-3">
          <Link
            to="/map"
            className="ag-card flex flex-col justify-between p-4 transition hover:border-[var(--accent)]"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                advisory.waterlogging_status === 'low'
                  ? 'bg-[var(--go-bg)] text-[var(--go-text)]'
                  : 'bg-[var(--wait-bg)] text-[var(--wait-text)]'
              }`}
            >
              <Droplets size={20} />
            </span>
            <div className="mt-3">
              <p className="text-xs font-semibold text-[var(--sub)]">{t('home.waterlogging')}</p>
              <p className="mt-0.5 text-xl font-bold text-[var(--ink)]">
                {advisory.waterlogging_status === 'low'
                  ? 'Low risk'
                  : advisory.waterlogging_status === 'high'
                  ? 'High risk'
                  : 'Check field'}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Soil {advisory.soil_moisture_pct}% wet
              </p>
            </div>
          </Link>

          <Link
            to="/planting-window"
            className="ag-card flex flex-col justify-between p-4 transition hover:border-[var(--accent)]"
          >
            <div className="flex h-10 items-end gap-1.5" aria-hidden="true">
              {advisory.daily_rain.map((d) => (
                <div
                  key={d.dateNum}
                  className="flex-1 rounded-full bg-[var(--accent-sage)]"
                  style={{ height: `${Math.max(20, (d.mm / maxRain) * 100)}%` }}
                />
              ))}
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-[var(--sub)]">{t('home.rain7Days')}</p>
              <p className="mt-0.5 text-xl font-bold text-[var(--ink)]">
                {advisory.rain_7d_mm} mm
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">Peak Tue (14 mm)</p>
            </div>
          </Link>
        </section>

        {/* One-Tap Rain Check-In Prompt */}
        <Link
          to="/rain-checkin"
          className="flex min-h-[72px] items-center justify-between gap-3 rounded-[22px] bg-[var(--accent)] px-4 py-3.5 text-[var(--on-accent)] shadow-sm transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
              <CloudRain size={22} />
            </span>
            <div>
              <p className="text-base font-bold leading-tight">{t('home.rainCheckinCta')}</p>
              <p className="mt-0.5 text-xs opacity-90">{t('home.rainCheckinSub')}</p>
            </div>
          </div>
          <ChevronRight size={20} className="shrink-0" />
        </Link>

        {/* Quick Navigation Cards: What to Plant, Crop Guides, Yield Estimate */}
        <section className="ag-card divide-y divide-[var(--border)] overflow-hidden">
          <Link
            to="/crops"
            className="flex min-h-[68px] items-center justify-between gap-3 px-4 py-3 transition hover:bg-[var(--surface-muted)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <Sprout size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-[var(--ink)]">
                    {t('home.whatToPlant')}
                  </p>
                  {profile.subscription_tier === 'free' && (
                    <span className="rounded-full bg-[var(--wait-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--wait-text)]">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--sub)]">{t('home.whatToPlantSub')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[var(--sub)]" />
          </Link>

          <Link
            to="/crop-guides"
            className="flex min-h-[68px] items-center justify-between gap-3 px-4 py-3 transition hover:bg-[var(--surface-muted)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <BookOpen size={20} />
              </span>
              <div>
                <p className="text-[15px] font-bold text-[var(--ink)]">{t('home.cropGuides')}</p>
                <p className="text-xs text-[var(--sub)]">{t('home.cropGuidesSub')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[var(--sub)]" />
          </Link>

          <Link
            to="/yield"
            className="flex min-h-[68px] items-center justify-between gap-3 px-4 py-3 transition hover:bg-[var(--surface-muted)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <TrendingUp size={20} />
              </span>
              <div>
                <p className="text-[15px] font-bold text-[var(--ink)]">
                  {t('home.yieldEstimate')}
                </p>
                <p className="text-xs text-[var(--sub)]">{t('home.yieldEstimateSub')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[var(--sub)]" />
          </Link>
        </section>

        {/* 7-Day Daily Rain Breakdown */}
        <section className="ag-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--ink)]">Nov 20 – 26 · Daily rainfall</h3>
            <Link to="/alerts" className="text-xs font-bold text-[var(--accent)]">
              {activeAlertCount} alerts ›
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5 text-center">
            {advisory.daily_rain.map((d) => (
              <div
                key={d.dateNum}
                className="flex flex-col items-center rounded-xl bg-[var(--bg)] px-1 py-2"
              >
                <span className="text-[10px] font-semibold text-[var(--sub)]">{d.day}</span>
                <span className="text-xs font-bold text-[var(--ink)]">{d.dateNum}</span>
                <div className="my-1.5 flex h-9 w-3 items-end rounded-full bg-[var(--border)] p-0.5">
                  <div
                    className="w-full rounded-full bg-[var(--accent)]"
                    style={{ height: `${Math.max(18, (d.mm / maxRain) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-[var(--sub)]">{d.mm}mm</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
