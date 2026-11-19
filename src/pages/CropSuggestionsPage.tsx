import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  BookOpen,
  Calendar,
  CalendarOff,
  CheckCircle2,
  CloudOff,
  Info,
  Lock,
  Sprout,
  TrendingUp,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { OfflineBanner } from '../components/OfflineBanner';
import { StatusPill } from '../components/StatusPill';
import { StaggerGroup, StaggerItem } from '../components/MotionPrimitives';
import { CropListSkeleton } from '../components/AgapaySkeletons';
import { TACTILE_TAP } from '../lib/motion';
import { useAppState } from '../context/AppStateContext';
import { CROWDING_BY_BARANGAY } from '../data/seedData';
import {
  formatMonthRange,
  MONTH_SHORT_NAMES,
  rankCropsForSeasonAndCrowding,
} from '../lib/cropSeason';
import type { CropCategory, CrowdingLevel } from '../types/database';

type CategoryFilter = 'all' | 'grains' | 'root_crop' | 'vegetable' | 'legume' | 'tree_fiber';

export function CropSuggestionsPage() {
  const { t } = useTranslation();
  const { authLoading, barangays, crops, activeParcel, isOnline, lastSyncedAt, profile } =
    useAppState();

  const currentMonth = new Date().getMonth() + 1; // 1..12
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedBarangayId, setSelectedBarangayId] = useState<string>(
    activeParcel.barangay_id || barangays[0]?.id || ''
  );

  const barangay =
    barangays.find((b) => b.id === selectedBarangayId) ?? barangays[0];
  const hasEnoughFarmers = barangay.reporting_farmers >= 5;

  const filteredCrops = useMemo(() => {
    if (categoryFilter === 'all') return crops;
    const allowed: Record<CategoryFilter, CropCategory[]> = {
      all: [],
      grains: ['rice', 'corn'],
      root_crop: ['root_crop'],
      vegetable: ['vegetable'],
      legume: ['legume'],
      tree_fiber: ['fruit', 'tree_crop', 'fiber'],
    };
    return crops.filter((c) => allowed[categoryFilter].includes(c.category));
  }, [crops, categoryFilter]);

  const { recommendedNow, inSeasonOther, outOfSeason } = useMemo(
    () =>
      rankCropsForSeasonAndCrowding({
        crops: filteredCrops,
        month1to12: selectedMonth,
        barangayId: barangay.id,
        barangayName: barangay.name,
        reportingFarmers: barangay.reporting_farmers,
        crowdingRows: CROWDING_BY_BARANGAY,
      }),
    [filteredCrops, selectedMonth, barangay]
  );

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

  const monthLabel = MONTH_SHORT_NAMES[selectedMonth - 1];

  return (
    <MobileShell>
      <header className="pb-3 pt-1">
        <p className="text-xs font-semibold text-[var(--sub)]">
          Brgy. {barangay.name} · {monthLabel} · {t('common.updated')} {updatedLabel}
        </p>
        <h1 className="mt-0.5 text-[32px] font-bold leading-tight tracking-tight text-[var(--ink)]">
          {t('crops.title')}
        </h1>
        <p className="mt-1 text-xs text-[var(--sub)]">{t('crops.topThreeHint')}</p>
      </header>

      <OfflineBanner />

      {!isOnline && (
        <div className="status-info mb-3 flex items-start gap-2.5 rounded-2xl px-4 py-3 text-xs font-semibold">
          <CloudOff size={16} className="mt-0.5 shrink-0" />
          <span>{t('crops.onlineRequired')}</span>
        </div>
      )}

      {/* Barangay switcher */}
      <div className="mb-2.5 flex items-center gap-2 overflow-x-auto pb-1">
        {barangays
          .filter((b) =>
            ['Gabas', 'Hilapnitan', 'Pangasugan', 'Guadalupe'].includes(b.name)
          )
          .map((b) => {
            const active = b.id === barangay.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBarangayId(b.id)}
                className={`min-h-[38px] shrink-0 rounded-full border px-3 text-xs font-bold transition ${
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

      {/* Planting Month Selector (strict seasonal check!) */}
      <div className="ag-card mb-3 p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-bold text-[var(--ink)]">
            <Calendar size={14} className="text-[var(--accent)]" />
            {t('crops.plantingMonth')}
          </span>
          <span className="font-semibold text-[var(--sub)]">
            {selectedMonth === currentMonth ? t('crops.thisMonth') : monthLabel}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {MONTH_SHORT_NAMES.map((m, i) => {
            const monthNum = i + 1;
            const active = monthNum === selectedMonth;
            return (
              <motion.button
                key={m}
                type="button"
                whileTap={TACTILE_TAP}
                onClick={() => setSelectedMonth(monthNum)}
                className={`min-h-[36px] rounded-xl text-xs font-bold transition ${
                  active
                    ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                    : 'bg-[var(--bg)] text-[var(--sub)] hover:text-[var(--ink)]'
                }`}
              >
                {m}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1">
        {(
          [
            ['all', t('crops.catAll')],
            ['grains', t('crops.catGrains')],
            ['root_crop', t('crops.catRoots')],
            ['vegetable', t('crops.catVegetables')],
            ['legume', t('crops.catLegumes')],
            ['tree_fiber', t('crops.catFruitsFiber')],
          ] as const
        ).map(([cat, label]) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`min-h-[38px] shrink-0 rounded-full border px-3 text-xs font-bold transition ${
              categoryFilter === cat
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--sub)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {profile.subscription_tier === 'free' && (
        <div className="ag-card mb-3.5 flex items-center justify-between gap-3 border-[var(--wait-border)] bg-[var(--wait-bg)] p-3.5 text-xs">
          <div className="flex items-center gap-2.5 text-[var(--wait-text)]">
            <Lock size={16} className="shrink-0" />
            <span className="font-bold">{t('crops.proBanner')}</span>
          </div>
          <Link
            to="/plans"
            className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--on-accent)]"
          >
            {t('common.upgrade')}
          </Link>
        </div>
      )}

      {/* TOP 3 RECOMMENDED NOW (Strictly In-Season + Anti-Crowding!) */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--accent)]">
          {t('crops.recommendedForMonth', { month: monthLabel })}
        </h2>
        <span className="text-[11px] font-semibold text-[var(--sub)]">
          {recommendedNow.length + inSeasonOther.length} {t('crops.inSeasonLabel')}
        </span>
      </div>

      {authLoading ? (
        <CropListSkeleton />
      ) : (
      <StaggerGroup>
      <StaggerItem>
      <section className="ag-card divide-y divide-[var(--border)] overflow-hidden">
        {recommendedNow.length === 0 ? (
          <div className="p-4 text-center text-sm text-[var(--sub)]">
            {t('crops.noInSeasonCategory', { month: monthLabel })}
          </div>
        ) : (
          recommendedNow.map((item, idx) => (
            <div key={item.crop.id} className="space-y-1.5 px-4 py-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      idx === 0
                        ? 'bg-[var(--go-bg)] text-[var(--go-text)]'
                        : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    }`}
                  >
                    <Sprout size={19} />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-[var(--ink)]">
                      {item.crop.name}{' '}
                      <span className="text-xs font-medium text-[var(--sub)]">
                        ({item.crop.local_name})
                      </span>
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[var(--sub)]">
                      <span className="inline-flex items-center gap-0.5 text-[var(--go-text)]">
                        <CheckCircle2 size={12} /> {t('crops.inSeasonBadge')}
                      </span>
                      <span>· {item.crop.duration_days} {t('common.days')}</span>
                      {hasEnoughFarmers && item.nearbyHectares > 0 && (
                        <span>· {item.nearbyHectares.toFixed(0)} ha</span>
                      )}
                    </div>
                  </div>
                </div>
                <StatusPill
                  variant={item.crowdingLevel}
                  label={getCrowdingLabel(item.crowdingLevel)}
                />
              </div>
              <p className="pl-[52px] text-xs leading-snug text-[var(--sub)]">
                {item.crop.season_note}
              </p>
            </div>
          ))
        )}
      </section>

      {/* More In-Season Crops (including crowded ones with warning!) */}
      {inSeasonOther.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--sub)]">
            {t('crops.otherInSeason', { month: monthLabel })} ({inSeasonOther.length})
          </h2>
          <div className="ag-card divide-y divide-[var(--border)] overflow-hidden">
            {inSeasonOther.map((item) => (
              <div
                key={item.crop.id}
                className="flex items-center justify-between gap-2 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--ink)]">
                    {item.crop.name}{' '}
                    <span className="text-xs font-normal text-[var(--sub)]">
                      ({item.crop.local_name})
                    </span>
                  </p>
                  <p className="text-[11px] text-[var(--sub)]">
                    {item.crop.duration_days} {t('common.days')} ·{' '}
                    {formatMonthRange(item.crop.best_planting_months)}
                  </p>
                </div>
                <StatusPill
                  variant={item.crowdingLevel}
                  label={getCrowdingLabel(item.crowdingLevel)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Out-of-Season Crops (NEVER recommended for selected month!) */}
      {outOfSeason.length > 0 && (
        <section className="mt-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--avoid-text)]">
            <CalendarOff size={14} />
            <span>
              {t('crops.outOfSeasonHeading', { month: monthLabel })} ({outOfSeason.length})
            </span>
          </div>
          <div className="ag-card divide-y divide-[var(--border)] overflow-hidden opacity-90">
            {outOfSeason.map((item) => (
              <div
                key={item.crop.id}
                className="flex items-center justify-between gap-2 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--ink)]">
                    {item.crop.name}{' '}
                    <span className="text-xs font-normal text-[var(--sub)]">
                      ({item.crop.local_name})
                    </span>
                  </p>
                  <p className="text-[11px] text-[var(--sub)]">
                    {t('crops.bestMonthsLabel')}:{' '}
                    <strong className="text-[var(--ink)]">
                      {formatMonthRange(item.crop.best_planting_months)}
                    </strong>
                  </p>
                </div>
                <StatusPill variant="avoid" label={t('crops.outOfSeasonBadge')} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contextual Advice Callout */}
      <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl bg-[var(--accent-soft)] p-3.5 text-xs leading-relaxed text-[var(--ink)]">
        <Info size={17} className="mt-0.5 shrink-0 text-[var(--accent)]" />
        <p className="font-semibold">
          {hasEnoughFarmers
            ? t('crops.crowdingAdvice', { barangay: barangay.name })
            : `${t('common.notEnoughData')} · Brgy. ${barangay.name} (${barangay.reporting_farmers})`}
        </p>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
        {t('crops.crowdingNote')}
      </p>

      {/* Action Links */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          to="/crop-compare"
          className="ag-card flex min-h-[56px] items-center justify-center gap-2 px-3 py-3 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--accent)]"
        >
          <ArrowLeftRight size={17} className="text-[var(--accent)]" />
          <span>{t('crops.compareCrops')}</span>
        </Link>

        <Link
          to="/yield"
          className="ag-card flex min-h-[56px] items-center justify-center gap-2 px-3 py-3 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--accent)]"
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
        <span>{t('crops.guidesTitle')}</span>
      </Link>
      </StaggerItem>
      </StaggerGroup>
      )}
    </MobileShell>
  );
}
