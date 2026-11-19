import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, Database, ShieldAlert, ShieldCheck } from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { useAppState } from '../context/AppStateContext';
import { DATA_SOURCES } from '../data/seedData';

export function PrivacyAndSourcesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { consent, updateConsent, withdrawConsent } = useAppState();
  const [withdrawnBanner, setWithdrawnBanner] = useState(false);

  const handleWithdraw = () => {
    withdrawConsent();
    setWithdrawnBanner(true);
  };

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
          <p className="text-xs font-semibold text-[var(--sub)]">RA 10173 · Data Ethics</p>
          <h1 className="text-2xl font-bold text-[var(--ink)]">{t('profile.privacySupport')}</h1>
        </div>
      </header>

      <div className="space-y-4 pb-8">
        {/* Privacy-by-design statement */}
        <section className="ag-card p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <ShieldCheck size={20} />
            </span>
            <div className="text-sm leading-relaxed text-[var(--sub)]">
              <p className="font-bold text-[var(--ink)]">Protected under RA 10173</p>
              <p className="mt-1">
                Farm parcels use pseudonymized IDs. Crowding metrics only display for barangays
                with at least <strong>5 reporting farmers</strong>, and LGU dashboards only receive
                barangay-level totals—never individual farmer identities.
              </p>
            </div>
          </div>
        </section>

        {/* Granular Consent Controls */}
        <section className="ag-card divide-y divide-[var(--border)] overflow-hidden">
          {[
            {
              key: 'location_consent' as const,
              title: t('onboarding.locationConsent'),
              sub: t('onboarding.locationConsentSub'),
            },
            {
              key: 'farm_data_consent' as const,
              title: t('onboarding.farmDataConsent'),
              sub: t('onboarding.farmDataConsentSub'),
            },
            {
              key: 'reminders_consent' as const,
              title: t('onboarding.remindersConsent'),
              sub: t('onboarding.remindersConsentSub'),
            },
          ].map((item) => {
            const val = consent[item.key];
            return (
              <div
                key={item.key}
                className="flex min-h-[64px] items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-[var(--ink)]">{item.title}</p>
                  <p className="text-xs text-[var(--sub)]">{item.sub}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={val}
                  onClick={() => {
                    updateConsent({ [item.key]: !val });
                    setWithdrawnBanner(false);
                  }}
                  className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                    val ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                      val ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </section>

        {withdrawnBanner ? (
          <div className="status-go flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold">
            <CheckCircle2 size={16} />
            <span>All optional consents withdrawn. You can re-enable anytime above.</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleWithdraw}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[var(--avoid-border)] bg-[var(--avoid-bg)] text-sm font-bold text-[var(--avoid-text)]"
          >
            <ShieldAlert size={16} />
            <span>{t('profile.consentWithdraw')}</span>
          </button>
        )}

        {/* Satellite & Weather Data Sources Register (PDF Day 6 Rights Management) */}
        <section className="space-y-2.5 pt-2">
          <div className="flex items-center gap-2">
            <Database size={17} className="text-[var(--accent)]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--sub)]">
              {t('profile.dataSources')}
            </h2>
          </div>

          <div className="space-y-2.5">
            {DATA_SOURCES.map((src) => (
              <article key={src.id} className="ag-card p-4 text-xs leading-relaxed">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-[var(--ink)]">{src.dataset_name}</h3>
                  <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 font-bold text-[var(--accent)]">
                    {src.update_frequency}
                  </span>
                </div>
                <p className="mt-1 font-semibold text-[var(--sub)]">
                  {src.owner} · {src.license_note}
                </p>
                <p className="mt-1.5 text-[var(--muted)]">{src.limitation_note}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
