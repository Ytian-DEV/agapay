import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftRight,
  BookOpen,
  CloudOff,
  Info,
  Lock,
  Sprout,
  TrendingUp,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { OfflineBanner } from '../components/OfflineBanner';
import { StatusPill } from '../components/StatusPill';
import { useAppState } from '../context/AppStateContext';
import { BARANGAYS, CROPS, CROWDING_BY_BARANGAY } from '../data/seedData';
import type { CrowdingLevel } from '../types/database';

export function CropSuggestionsPage() {
  const { t } = useTranslation();
  const { activeParcel, isOnline, lastSyncedAt, profile } = useAppState();

  const [selectedBarangayId, setSelectedBarangayId] = useState<string>(
    activeParcel.barangay_id || 'brgy-gabas'
  );

  const barangay =
    BARANGAYS.find((b) => b.id === selectedBarangayId) ?? BARANGAYS[0];
  const hasEnoughFarmers = barangay.reporting_farmers >= 5;

  const topThree = CROPS.slice(0, 3); // Sweet Potato, Rice, Corn (anti-herding: always Top 3)

  const getCrowdingForCrop = (slug: string): { level: CrowdingLevel; ha: number } => {
    if (!hasEnoughFarmers) {
      return { level: 'insufficient_data', ha: 0 };
    }
    const row = CROWDING_BY_BARANGAY.find(
      (r) => r.barangay_id === selectedBarangayId && r.crop_slug === slug
    );
    if (row) return { level: row.crowding_level, ha: row.total_hectares };
    if (slug === 'sweet-potato') return { level: 'low', ha: 18.5 };
    if (slug === 'rice') return { level: 'medium', ha: 58.2 };
    return { level: 'high', ha: 91.0 };
  };

  const getCrowdingLabel = (level: CrowdingLevel) => {
    switch (level) {
      case 'low':
        return t('crops.crowdingLow');
      case 'medium':
        return t('crops.crowdingMedium');
      case 'high':
        return t('crops.crowdingHigh');
      case 'insufficient_data':
      default:
        return t('crops.crowdingInsufficient');
    }
  };

  const updatedLabel = new Date(lastSyncedAt).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <MobileShell>
      <header className="pb-3 pt-1">
        <p className="text-xs font-semibold text-[var(--sub)]">
          Top 3 for Brgy. {barangay.name} · {t('common.updated')} {updatedLabel}
        </p>
        <h1 className="mt-0.5 text-[34px] font-bold leading-tight tracking-tight text-[var(--ink)]">
          {t('crops.title')}
        </h1>
      </header>

      <OfflineBanner />

      {!isOnline && (
        <div className="status-info mb-3 flex items-start gap-2.5 rounded-2xl px-4 py-3 text-xs font-semibold">
          <CloudOff size={16} className="mt-0.5 shrink-0" />
          <span>{t('crops.onlineRequired')}</span>
        </div>
      )}

      {/* Barangay switcher to inspect Gabas vs sparse Guadalupe (<5 farmers cold-start rule) */}
      <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
        {['brgy-gabas', 'brgy-hilapnitan', 'brgy-pangasugan', 'brgy-guadalupe'].map((id) => {
          const b = BARANGAYS.find((x) => x.id === id);
          if (!b) return null;
          const active = b.id === selectedBarangayId;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBarangayId(b.id)}
              className={`min-h-[40px] shrink-0 rounded-full border px-3.5 text-xs font-bold transition ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--sub)]'
              }`}
            >
              Brgy. {b.name} ({b.reporting_farmers})
            </button>
          );
        })}
      </div>

      {/* Free Plan Upgrade Hint (still allows viewing guides & previewing crowding) */}
      {profile.subscription_tier === 'free' && (
        <div className="ag-card mb-3.5 flex items-center justify-between gap-3 border-[var(--wait-border)] bg-[var(--wait-bg)] p-3.5 text-xs">
          <div className="flex items-center gap-2.5 text-[var(--wait-text)]">
            <Lock size={16} className="shrink-0" />
            <span className="font-bold">
              AI crop crowding alerts unlock fully on Agapay Pro (₱69/mo).
            </span>
          </div>
          <Link
            to="/plans"
            className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--on-accent)]"
          >
            {t('common.upgrade')}
          </Link>
        </div>
      )}

      {/* Top 3 Ranked Crops Card (Figma 06 Crop suggestions) */}
      <section className="ag-card divide-y divide-[var(--border)] overflow-hidden">
        {topThree.map((crop, idx) => {
          const crowding = getCrowdingForCrop(crop.slug);
          return (
            <div
              key={crop.id}
              className="flex min-h-[82px] items-center justify-between gap-3 px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    idx === 0
                      ? 'bg-[var(--go-bg)] text-[var(--go-text)]'
                      : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  }`}
                >
                  <Sprout size={20} />
                </span>
                <div>
                  <p className="text-[16px] font-bold text-[var(--ink)]">
                    {crop.name}{' '}
                    <span className="text-xs font-medium text-[var(--sub)]">
                      ({crop.local_name})
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--sub)]">
                    Suitability {crop.suitability_pct}% · {crop.duration_days} {t('common.days')}
                    {hasEnoughFarmers && crowding.ha > 0 ? ` · ${crowding.ha} ha nearby` : ''}
                  </p>
                </div>
              </div>
              <StatusPill
                variant={crowding.level}
                label={getCrowdingLabel(crowding.level)}
              />
            </div>
          );
        })}
      </section>

      {/* Contextual Advice Callout (respecting Cold-Start >=5 Farmers Rule!) */}
      <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl bg-[var(--accent-soft)] p-3.5 text-sm text-[var(--ink)]">
        <Info size={18} className="mt-0.5 shrink-0 text-[var(--accent)]" />
        <div>
          {hasEnoughFarmers ? (
            <p className="font-semibold">
              Corn is crowded nearby in Brgy. {barangay.name}. Sweet potato or rice may reduce
              oversupply risk this season.
            </p>
          ) : (
            <p className="font-semibold">
              {t('common.notEnoughData')} in Brgy. {barangay.name} ({barangay.reporting_farmers}{' '}
              reporting). Showing City Agriculture Office baseline until 5+ farmers report.
            </p>
          )}
        </div>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-[var(--muted)]">
        {t('crops.crowdingNote')}
      </p>

      {/* Action Links to Compare, Guides & Yield */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          to="/crop-compare"
          className="ag-card flex min-h-[60px] items-center justify-center gap-2 px-3 py-3 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--accent)]"
        >
          <ArrowLeftRight size={17} className="text-[var(--accent)]" />
          <span>{t('crops.compareCrops')}</span>
        </Link>

        <Link
          to="/yield"
          className="ag-card flex min-h-[60px] items-center justify-center gap-2 px-3 py-3 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--accent)]"
        >
          <TrendingUp size={17} className="text-[var(--accent)]" />
          <span>{t('crops.yieldTitle')}</span>
        </Link>
      </div>

      <Link
        to="/crop-guides"
        className="mt-3 flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--accent)] transition hover:border-[var(--accent)]"
      >
        <BookOpen size={17} />
        <span>{t('crops.guidesTitle')} (Offline Free)</span>
      </Link>
    </MobileShell>
  );
}
