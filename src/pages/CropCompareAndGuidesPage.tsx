import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, Droplets, Sprout } from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { StatusPill } from '../components/StatusPill';
import { CROPS } from '../data/seedData';

export function CropCompareAndGuidesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const initialTab = location.pathname.includes('guide') ? 'guides' : 'compare';
  const [tab, setTab] = useState<'compare' | 'guides'>(initialTab);
  const [selectedGuideSlug, setSelectedGuideSlug] = useState<string>('corn');

  const compareCrops = [
    CROPS.find((c) => c.slug === 'rice')!,
    CROPS.find((c) => c.slug === 'corn')!,
    CROPS.find((c) => c.slug === 'sweet-potato')!,
  ];

  const activeGuide =
    CROPS.find((c) => c.slug === selectedGuideSlug) ?? CROPS[2];

  const costBadge = (tier: 'low' | 'medium' | 'high') =>
    tier === 'high' ? '₱₱₱' : tier === 'medium' ? '₱₱' : '₱';

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
            Rice, Corn & Root Crops · Offline Ready
          </p>
          <h1 className="text-2xl font-bold text-[var(--ink)]">
            {tab === 'compare' ? t('crops.compareCrops') : t('crops.guidesTitle')}
          </h1>
        </div>
      </header>

      {/* Segmented Switch: Compare vs Offline Guides */}
      <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
        <button
          type="button"
          onClick={() => setTab('compare')}
          className={`min-h-[44px] rounded-full text-sm font-bold transition ${
            tab === 'compare'
              ? 'bg-[var(--accent)] text-[var(--on-accent)]'
              : 'text-[var(--sub)]'
          }`}
        >
          {t('crops.compareCrops')}
        </button>
        <button
          type="button"
          onClick={() => setTab('guides')}
          className={`min-h-[44px] rounded-full text-sm font-bold transition ${
            tab === 'guides'
              ? 'bg-[var(--accent)] text-[var(--on-accent)]'
              : 'text-[var(--sub)]'
          }`}
        >
          {t('home.cropGuides')}
        </button>
      </div>

      {tab === 'compare' ? (
        <section className="space-y-4 pb-6">
          {/* Side-by-Side Comparison Matrix (Figma 14 Crop comparison) */}
          <div className="ag-card overflow-hidden">
            <div className="grid grid-cols-4 items-center border-b border-[var(--border)] px-3 py-4 text-center">
              <div />
              {compareCrops.map((c) => (
                <div key={c.id} className="flex flex-col items-center gap-1">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Sprout size={18} />
                  </span>
                  <span className="text-xs font-bold text-[var(--ink)]">
                    {c.slug === 'sweet-potato' ? 'Root crops' : c.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>

            <div className="divide-y divide-[var(--border)] text-sm">
              <div className="grid grid-cols-4 items-center px-3 py-3.5 text-center">
                <span className="text-left text-xs font-semibold text-[var(--sub)]">Duration</span>
                {compareCrops.map((c) => (
                  <span key={c.id} className="font-bold text-[var(--ink)]">
                    {c.duration_days} d
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-4 items-center px-3 py-3.5 text-center">
                <span className="text-left text-xs font-semibold text-[var(--sub)]">
                  Water need
                </span>
                {compareCrops.map((c) => (
                  <span key={c.id} className="font-bold capitalize text-[var(--ink)]">
                    {c.water_need}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-4 items-center px-3 py-3.5 text-center">
                <span className="text-left text-xs font-semibold text-[var(--sub)]">
                  Input cost
                </span>
                {compareCrops.map((c) => (
                  <span key={c.id} className="font-bold text-[var(--ink)]">
                    {costBadge(c.cost_tier)}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-4 items-center px-3 py-3.5 text-center">
                <span className="text-left text-xs font-semibold text-[var(--sub)]">
                  Flood risk
                </span>
                {compareCrops.map((c) => (
                  <div key={c.id} className="flex justify-center">
                    <StatusPill variant={c.flood_risk} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 items-center px-3 py-3.5 text-center">
                <span className="text-left text-xs font-semibold text-[var(--sub)]">
                  Est. yield
                </span>
                {compareCrops.map((c) => (
                  <span key={c.id} className="text-xs font-bold text-[var(--ink)]">
                    {c.typical_yield_min_sacks}–{c.typical_yield_max_sacks}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--muted)]">
            Root crop figures represent Sweet Potato (Kamote), VSU-recommended for wet Baybay City
            cycles. Est. yield shown in sacks/ha.
          </p>

          <button
            type="button"
            onClick={() => setTab('guides')}
            className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--on-accent)]"
          >
            Read offline planting & drainage guides
          </button>
        </section>
      ) : (
        <section className="space-y-4 pb-6">
          {/* Crop selector pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CROPS.map((c) => {
              const active = c.slug === activeGuide.slug;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedGuideSlug(c.slug)}
                  className={`min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-bold transition ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--sub)]'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          {/* Guide Details Card (Available on Free Tier & Offline) */}
          <div className="ag-card space-y-4 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">
                  {activeGuide.name} ({activeGuide.local_name})
                </h2>
                <p className="text-xs font-semibold text-[var(--sub)]">
                  {activeGuide.duration_days} {t('common.days')} · Ideal soil moisture:{' '}
                  {activeGuide.best_soil_moisture}
                </p>
              </div>
              <StatusPill variant={activeGuide.flood_risk} label={`Flood: ${activeGuide.flood_risk}`} />
            </div>

            {/* Highlighted Wet-Season & Drainage Tip */}
            <div className="status-wait flex items-start gap-2.5 rounded-2xl p-3.5 text-sm">
              <Droplets size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider">
                  {t('crops.guideDrainageTip')}
                </p>
                <p className="mt-1 leading-relaxed">{activeGuide.drainage_tip}</p>
              </div>
            </div>

            {/* Step-by-step checklist */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--sub)]">
                Field planting steps
              </h3>
              <ul className="mt-2.5 space-y-2.5">
                {activeGuide.planting_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--ink)]">
                    <CheckCircle2
                      size={17}
                      className="mt-0.5 shrink-0 text-[var(--accent)]"
                    />
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Local recommended varieties */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--sub)]">
                Recommended local varieties
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeGuide.varieties.map((v) => (
                  <span
                    key={v}
                    className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </MobileShell>
  );
}
