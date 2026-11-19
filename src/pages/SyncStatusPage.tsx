import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CloudOff,
  RefreshCw,
  Wifi,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { useAppState } from '../context/AppStateContext';
import { isSupabaseConfigured } from '../lib/supabase';

export function SyncStatusPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    isOnline,
    isCacheStale,
    lastSyncedAt,
    pendingSyncCount,
    rainCheckins,
    harvestReports,
    disputes,
    simulateOffline,
    simulateStaleCache,
    setSimulateOffline,
    setSimulateStaleCache,
    syncPendingNow,
  } = useAppState();

  const lastSyncFormatted = new Date(lastSyncedAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <MobileShell showTabs={false}>
      <header className="flex items-center gap-3 pb-4 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-semibold text-[var(--sub)]">PWA Offline Storage</p>
          <h1 className="text-2xl font-bold text-[var(--ink)]">{t('profile.syncStatus')}</h1>
        </div>
      </header>

      <div className="space-y-4 pb-6">
        {/* Connection & Cache Status Card */}
        <section className="ag-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  isOnline
                    ? 'bg-[var(--go-bg)] text-[var(--go-text)]'
                    : 'bg-[var(--wait-bg)] text-[var(--wait-text)]'
                }`}
              >
                {isOnline ? <Wifi size={22} /> : <CloudOff size={22} />}
              </span>
              <div>
                <p className="text-lg font-bold text-[var(--ink)]">
                  {isOnline ? t('common.online') : t('common.offline')}
                </p>
                <p className="text-xs text-[var(--sub)]">
                  {t('common.updated')}: {lastSyncFormatted}
                </p>
              </div>
            </div>

            <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold text-[var(--sub)]">
              {pendingSyncCount} queued
            </span>
          </div>

          {isCacheStale && (
            <div className="status-avoid mt-3 rounded-xl px-3.5 py-2.5 text-xs font-bold">
              {t('common.staleWarning')} — reconnect to download fresh satellite & weather data.
            </div>
          )}

          <button
            type="button"
            disabled={!isOnline}
            onClick={syncPendingNow}
            className="mt-4 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--on-accent)] transition disabled:opacity-45"
          >
            <RefreshCw size={16} />
            <span>
              {pendingSyncCount > 0
                ? `Sync ${pendingSyncCount} queued report(s) now`
                : 'Refresh satellite & forecast cache'}
            </span>
          </button>

          <p className="mt-2.5 text-center text-[11px] text-[var(--muted)]">
            Backend: {isSupabaseConfigured ? 'Connected to Supabase' : 'Offline-first local mode (Supabase ready)'}
          </p>
        </section>

        {/* Queued & Recent Farmer Reports */}
        <section className="ag-card p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--sub)]">
            Local Field Reports Queue
          </h2>
          <div className="mt-3 space-y-2.5 text-sm">
            {rainCheckins.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-3.5 py-2.5"
              >
                <div>
                  <p className="font-bold capitalize text-[var(--ink)]">
                    Rain check-in: {r.intensity}
                  </p>
                  <p className="text-xs text-[var(--sub)]">
                    {new Date(r.observed_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    r.synced ? 'status-go' : 'status-wait'
                  }`}
                >
                  {r.synced ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {r.synced ? 'Synced' : 'Queued'}
                </span>
              </div>
            ))}

            {harvestReports.slice(0, 3).map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-3.5 py-2.5"
              >
                <div>
                  <p className="font-bold text-[var(--ink)]">
                    Harvest: {h.yield_sacks_per_ha} sacks/ha ({h.crop_slug})
                  </p>
                  <p className="text-xs text-[var(--sub)]">{h.variety}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    h.synced ? 'status-go' : 'status-wait'
                  }`}
                >
                  {h.synced ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {h.synced ? 'Synced' : 'Queued'}
                </span>
              </div>
            ))}

            {disputes.slice(0, 2).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-3.5 py-2.5"
              >
                <div>
                  <p className="font-bold text-[var(--ink)]">Advisory flag</p>
                  <p className="text-xs text-[var(--sub)]">{d.farmer_note}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    d.synced ? 'status-go' : 'status-wait'
                  }`}
                >
                  {d.synced ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {d.synced ? 'Synced' : 'Queued'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Clean Rural Signal & 3-Day Staleness Test Controls */}
        <section className="ag-card space-y-3 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--sub)]">
            Rural Connectivity Preview
          </h2>
          <p className="text-xs text-[var(--sub)]">
            Test how Agapay behaves without mobile signal or with cached forecasts older than 3 days.
          </p>

          <div className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-3.5 py-3">
            <span className="text-sm font-semibold text-[var(--ink)]">Simulate offline mode</span>
            <button
              type="button"
              role="switch"
              aria-checked={simulateOffline}
              onClick={() => setSimulateOffline(!simulateOffline)}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                simulateOffline ? 'bg-[var(--wait-border)]' : 'bg-[var(--border)]'
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  simulateOffline ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-3.5 py-3">
            <span className="text-sm font-semibold text-[var(--ink)]">
              Simulate &gt;3-day stale cache
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={simulateStaleCache}
              onClick={() => setSimulateStaleCache(!simulateStaleCache)}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                simulateStaleCache ? 'bg-[var(--avoid-border)]' : 'bg-[var(--border)]'
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  simulateStaleCache ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
