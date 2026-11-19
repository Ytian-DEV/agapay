import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronRight, ClipboardCheck } from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { StatusPill } from '../components/StatusPill';
import { useAppState } from '../context/AppStateContext';
import type { Crop } from '../types/database';

export function YieldEstimatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { barangays, crops, activeParcel, lastSyncedAt } = useAppState();

  const [selectedSlug, setSelectedSlug] = useState<Crop['slug']>(
    activeParcel.crop_slug === 'cassava' ? 'sweet-potato' : activeParcel.crop_slug
  );

  const crop = crops.find((c) => c.slug === selectedSlug) ?? crops[0];
  const barangay =
    barangays.find((b) => b.id === activeParcel.barangay_id) ?? barangays[0];

  const scaleMin = Math.max(5, Math.floor(crop.typical_yield_min_sacks * 0.6));
  const scaleMax = Math.ceil(crop.typical_yield_max_sacks * 1.35);
  const leftPct = Math.max(
    0,
    Math.min(100, ((crop.typical_yield_min_sacks - scaleMin) / (scaleMax - scaleMin)) * 100)
  );
  const widthPct = Math.max(
    8,
    ((crop.typical_yield_max_sacks - crop.typical_yield_min_sacks) / (scaleMax - scaleMin)) *
      100
  );

  const totalMin = Math.round(crop.typical_yield_min_sacks * activeParcel.area_ha);
  const totalMax = Math.round(crop.typical_yield_max_sacks * activeParcel.area_ha);

  const updatedLabel = new Date(lastSyncedAt).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <MobileShell>
      <header className="flex items-center gap-3 pb-3 pt-1">
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
            Brgy. {barangay.name} · {activeParcel.area_ha} {t('common.hectares')}
          </p>
          <h1 className="text-2xl font-bold text-[var(--ink)]">{t('crops.yieldTitle')}</h1>
        </div>
      </header>

      {/* Crop Segmented Tabs (Figma 07 Yield estimate) */}
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
        {(
          [
            ['corn', 'Corn'],
            ['rice', 'Rice'],
            ['sweet-potato', 'Root crops'],
          ] as const
        ).map(([slug, label]) => {
          const active = selectedSlug === slug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => setSelectedSlug(slug)}
              className={`min-h-[44px] rounded-full text-sm font-bold transition ${
                active
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs'
                  : 'text-[var(--sub)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Main Yield Range Card */}
      <section className="ag-card p-5">
        <p className="text-[44px] font-extrabold leading-none tracking-tight text-[var(--ink)]">
          {crop.typical_yield_min_sacks} – {crop.typical_yield_max_sacks}
        </p>
        <p className="mt-1.5 text-sm font-semibold text-[var(--sub)]">{t('common.sacksPerHa')}</p>

        {/* Range visual bar */}
        <div className="mt-5">
          <div className="relative h-2.5 w-full rounded-full bg-[var(--surface-muted)]">
            <div
              className="absolute top-0 h-full rounded-full bg-[var(--accent)]"
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            />
            <div
              className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--accent)] bg-[var(--surface)] shadow-xs"
              style={{ left: `${leftPct + widthPct / 2}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs font-semibold text-[var(--sub)]">
            <span>{scaleMin}</span>
            <span>{scaleMax}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3.5">
          <StatusPill variant="medium" label={t('common.confidenceMedium')} />
          <span className="text-xs text-[var(--muted)]">
            {t('common.updated')} {updatedLabel}
          </span>
        </div>

        <div className="mt-3 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm">
          <span className="text-[var(--sub)]">
            For <strong>{activeParcel.field_name}</strong> ({activeParcel.area_ha} ha):{' '}
          </span>
          <strong className="text-[var(--accent)]">
            ~{totalMin}–{totalMax} sacks total
          </strong>
        </div>
      </section>

      {/* Biophysical Drivers List */}
      <section className="ag-card mt-3.5 divide-y divide-[var(--border)] text-sm">
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-[var(--sub)]">Soil moisture (Sentinel-1)</span>
          <span className="font-bold text-[var(--go-text)]">● Good</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-[var(--sub)]">Seasonal rainfall (ERA5)</span>
          <span className="font-bold text-[var(--go-text)]">● Normal</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-[var(--sub)]">Canopy vigor (NDVI)</span>
          <span className="font-bold text-[var(--ink)]">0.68 · Healthy</span>
        </div>
        <Link
          to="/planting-window"
          className="flex min-h-[52px] items-center justify-between px-4 py-3 font-bold text-[var(--accent)] hover:bg-[var(--surface-muted)]"
        >
          <span>How this estimate works</span>
          <ChevronRight size={18} />
        </Link>
      </section>

      <p className="mt-2.5 text-xs text-[var(--muted)]">{t('crops.yieldDisclaimer')}</p>

      {/* Direct CTA to log observed harvest */}
      <Link
        to="/harvest-feedback"
        className="mt-4 flex min-h-[54px] items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-[var(--on-accent)] shadow-sm"
      >
        <ClipboardCheck size={18} />
        <span>{t('profile.harvestReport')}</span>
      </Link>
    </MobileShell>
  );
}
