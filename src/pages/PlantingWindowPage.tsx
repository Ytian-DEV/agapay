import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flag,
  Satellite,
  ShieldCheck,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { StatusPill } from '../components/StatusPill';
import { useAppState } from '../context/AppStateContext';
import type { RecommendationDispute } from '../types/database';

const WINDOW_DAYS = Array.from({ length: 21 }, (_, idx) => ({
  dayIndex: idx,
  inWindow: idx >= 7 && idx <= 15,
}));

export function PlantingWindowPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { barangays, crops, advisories, activeParcel, submitDispute } = useAppState();

  const crop = crops.find((c) => c.slug === activeParcel.crop_slug) ?? crops[0];
  const barangay =
    barangays.find((b) => b.id === activeParcel.barangay_id) ?? barangays[0];
  const advisory = advisories[crop.slug] ?? advisories.corn ?? Object.values(advisories)[0];

  const [showWhy, setShowWhy] = useState(true);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] =
    useState<RecommendationDispute['reason']>('soil_drier');
  const [disputeNote, setDisputeNote] = useState('');
  const [disputeSent, setDisputeSent] = useState(false);

  const localizedHeadline =
    advisory.decision === 'go'
      ? t('advisory.goHeadline')
      : advisory.decision === 'avoid'
      ? t('advisory.avoidHeadline')
      : t('advisory.waitHeadline');

  const localizedExplanation =
    advisory.decision === 'go'
      ? t('advisory.goDesc', { pct: advisory.soil_moisture_pct })
      : advisory.decision === 'avoid'
      ? t('advisory.avoidDesc', { pct: advisory.soil_moisture_pct })
      : t('advisory.waitDesc', { pct: advisory.soil_moisture_pct });

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitDispute({
      advisory_id: advisory.id,
      barangay_id: barangay.id,
      reason: disputeReason,
      farmer_note: disputeNote.trim() || 'Reported field condition mismatch',
    });
    setDisputeSent(true);
    setDisputeOpen(false);
    setDisputeNote('');
  };

  return (
    <MobileShell showTabs={false}>
      <header className="flex items-center gap-3 pb-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-semibold text-[var(--sub)]">
            {crop.name} ({crop.local_name}) · {barangay.municipality}
          </p>
          <h1 className="text-2xl font-bold text-[var(--ink)]">{advisory.window_label}</h1>
        </div>
      </header>

      <p className="mb-3 text-sm text-[var(--sub)]">
        <strong className="text-[var(--ink)]">{activeParcel.field_name}</strong> · Brgy.{' '}
        {barangay.name}
      </p>

      <div className="space-y-3.5 pb-6">
        {/* 21-day visual planting window bar */}
        <section className="ag-card p-4">
          <div className="flex h-16 items-end justify-between gap-1">
            {WINDOW_DAYS.map((d) => (
              <div
                key={d.dayIndex}
                className={`h-full flex-1 rounded-full ${
                  d.inWindow ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`}
              />
            ))}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs font-semibold text-[var(--sub)]">
            <span>Nov 13</span>
            <span className="font-bold text-[var(--accent)]">{advisory.window_label}</span>
            <span>Dec 3</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <StatusPill
              variant={advisory.confidence === 'high' ? 'go' : 'wait'}
              label={
                advisory.confidence === 'high'
                  ? t('common.confidenceHigh')
                  : t('common.confidenceMedium')
              }
            />
            <span className="text-xs text-[var(--muted)]">{t('window.edgeUncertainty')}</span>
          </div>
        </section>

        {/* Localized Action Recommendation Card */}
        <section className="ag-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusPill variant={advisory.decision} size="md" />
            {advisory.technician_reviewed && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)]">
                <ShieldCheck size={14} />
                {advisory.technician_name}
              </span>
            )}
          </div>
          <h2 className="mt-3 text-xl font-bold text-[var(--ink)]">{localizedHeadline}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--sub)]">
            {localizedExplanation}
          </p>
        </section>

        {/* Localized Key Indicators Table */}
        <section className="ag-card divide-y divide-[var(--border)] text-sm">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-[var(--sub)]">{t('window.rainOutlook')}</span>
            <span className="font-bold text-[var(--ink)]">
              {advisory.rain_7d_mm} mm ({t('status.medium').toLowerCase()})
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-[var(--sub)]">{t('window.soilMoisture')}</span>
            <span className="font-bold text-[var(--ink)]">
              {advisory.soil_moisture_pct}% (Sentinel-1 SAR)
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-[var(--sub)]">{t('window.drainageBaseline')}</span>
            <span className="font-bold capitalize text-[var(--ink)]">
              {barangay.drainage_class.replace('_', ' ')} ({barangay.soil_texture})
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-[var(--sub)]">{t('window.dataType')}</span>
            <span className="font-bold text-[var(--ink)]">{t('common.modeled')}</span>
          </div>
        </section>

        {/* Localized Decision Explanation Section */}
        <section className="ag-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowWhy((v) => !v)}
            className="flex min-h-[56px] w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2 text-[15px] font-bold text-[var(--accent)]">
              <Satellite size={18} />
              {t('window.whyTitle')}
            </span>
            {showWhy ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showWhy && (
            <div className="space-y-2.5 border-t border-[var(--border)] px-4 py-3.5 text-sm leading-relaxed text-[var(--sub)]">
              <ul className="list-disc space-y-2 pl-4">
                <li>
                  <strong className="text-[var(--ink)]">{t('window.whyRadarTitle')}:</strong>{' '}
                  {t('window.whyRadarBody')}
                </li>
                <li>
                  <strong className="text-[var(--ink)]">{t('window.whyWeatherTitle')}:</strong>{' '}
                  {t('window.whyWeatherBody')}
                </li>
                <li>
                  <strong className="text-[var(--ink)]">{t('window.whyFarmerTitle')}:</strong>{' '}
                  {t('window.whyFarmerBody')}
                </li>
              </ul>
            </div>
          )}
        </section>

        {/* Localized Accountability Dispute Form */}
        {disputeSent ? (
          <div className="status-go flex items-center gap-2.5 rounded-2xl p-4 text-sm font-semibold">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{t('alerts.disputeSent')}</span>
          </div>
        ) : !disputeOpen ? (
          <button
            type="button"
            onClick={() => setDisputeOpen(true)}
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--sub)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]"
          >
            <Flag size={16} />
            <span>{t('alerts.disputeAdvisory')}</span>
          </button>
        ) : (
          <form onSubmit={handleDisputeSubmit} className="ag-card space-y-3 p-4">
            <h3 className="text-base font-bold text-[var(--ink)]">
              {t('alerts.disputeAdvisory')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['soil_drier', t('window.disputeSoilDrier')],
                  ['soil_wetter', t('window.disputeSoilWetter')],
                  ['rain_mismatch', t('window.disputeRainMismatch')],
                  ['crop_timing', t('window.disputeTiming')],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDisputeReason(value)}
                  className={`min-h-[44px] rounded-xl border px-3 text-xs font-bold ${
                    disputeReason === value
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={disputeNote}
              onChange={(e) => setDisputeNote(e.target.value)}
              placeholder={t('window.disputeNotePlaceholder')}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDisputeOpen(false)}
                className="min-h-[48px] flex-1 rounded-full border border-[var(--border)] text-sm font-bold text-[var(--sub)]"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="min-h-[48px] flex-1 rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--on-accent)]"
              >
                {t('common.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </MobileShell>
  );
}
