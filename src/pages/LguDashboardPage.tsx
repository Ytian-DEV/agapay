import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Home,
  Map,
  Moon,
  Printer,
  Settings,
  ShieldCheck,
  Sprout,
  Sun,
} from 'lucide-react';
import { AgapayLogo } from '../components/AgapayLogo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { StatusPill } from '../components/StatusPill';
import { useTheme } from '../context/ThemeContext';
import { BARANGAYS } from '../data/seedData';
import type { CrowdingLevel } from '../types/database';

type LguSection = 'crowding' | 'overview' | 'planted' | 'reports' | 'settings';

interface LguBarangayRow {
  id: string;
  name: string;
  dominantCrop: string;
  hectares: number;
  reportingFarmers: number;
  crowding: CrowdingLevel;
  zone: string;
}

const LGU_BARANGAYS: LguBarangayRow[] = [
  {
    id: 'brgy-pangasugan',
    name: 'Pangasugan',
    dominantCrop: 'Coconut',
    hectares: 128.4,
    reportingFarmers: 44,
    crowding: 'low',
    zone: 'Foothill upland',
  },
  {
    id: 'brgy-gabas',
    name: 'Gabas',
    dominantCrop: 'Corn',
    hectares: 96.2,
    reportingFarmers: 38,
    crowding: 'high',
    zone: 'Alluvial plain',
  },
  {
    id: 'brgy-hilapnitan',
    name: 'Hilapnitan',
    dominantCrop: 'Rice',
    hectares: 84.6,
    reportingFarmers: 31,
    crowding: 'medium',
    zone: 'Alluvial plain',
  },
  {
    id: 'brgy-caridad',
    name: 'Caridad',
    dominantCrop: 'Corn',
    hectares: 72.8,
    reportingFarmers: 27,
    crowding: 'medium',
    zone: 'Coastal lowland',
  },
  {
    id: 'brgy-plaridel',
    name: 'Plaridel',
    dominantCrop: 'Rice',
    hectares: 63.5,
    reportingFarmers: 22,
    crowding: 'high',
    zone: 'Coastal lowland',
  },
  {
    id: 'brgy-bubon',
    name: 'Bubon',
    dominantCrop: 'Coconut',
    hectares: 54.1,
    reportingFarmers: 19,
    crowding: 'low',
    zone: 'Foothill upland',
  },
  {
    id: 'brgy-guadalupe',
    name: 'Guadalupe',
    dominantCrop: 'Corn',
    hectares: 14.2,
    reportingFarmers: 4, // Below 5-farmer threshold -> privacy protected
    crowding: 'insufficient_data',
    zone: 'Coastal lowland',
  },
];

export function LguDashboardPage() {
  const { t } = useTranslation();
  const { resolved, toggle } = useTheme();

  const [section, setSection] = useState<LguSection>('crowding');
  const [selectedBarangayId, setSelectedBarangayId] = useState<string>('brgy-gabas');
  const [cropFilter, setCropFilter] = useState<string>('All');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const reportingBarangays = LGU_BARANGAYS.filter((b) => b.reportingFarmers >= 5);
  const totalPlantedHa = useMemo(
    () => reportingBarangays.reduce((sum, b) => sum + b.hectares, 0),
    [reportingBarangays]
  );
  const totalReportingFarmers = useMemo(
    () => reportingBarangays.reduce((sum, b) => sum + b.reportingFarmers, 0),
    [reportingBarangays]
  );

  const filteredAreaRows = useMemo(() => {
    if (cropFilter === 'All') return LGU_BARANGAYS;
    return LGU_BARANGAYS.filter((b) => b.dominantCrop === cropFilter);
  }, [cropFilter]);

  const navItems: { id: LguSection; label: string; icon: typeof Home }[] = [
    { id: 'overview', label: t('lgu.overview'), icon: Home },
    { id: 'crowding', label: t('lgu.crowdingMap'), icon: Map },
    { id: 'planted', label: t('lgu.plantedArea'), icon: Sprout },
    { id: 'reports', label: t('lgu.reports'), icon: FileText },
    { id: 'settings', label: t('lgu.settings'), icon: Settings },
  ];

  const handleExportCsv = () => {
    const header = ['Barangay', 'Zone', 'Dominant Crop', 'Planted Hectares', 'Reporting Farmers', 'Crowding Level'];
    const rows = LGU_BARANGAYS.map((b) => [
      b.name,
      b.zone,
      b.dominantCrop,
      b.reportingFarmers >= 5 ? b.hectares.toFixed(1) : 'Suppressed (<5 farmers)',
      String(b.reportingFarmers),
      b.crowding,
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agapay-baybay-city-lgu-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess('CSV exported (barangay aggregates only, zero farmer PII).');
    setTimeout(() => setExportSuccess(null), 4000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const getMapTileTone = (level: CrowdingLevel) => {
    if (level === 'high') return 'status-avoid';
    if (level === 'medium') return 'status-wait';
    if (level === 'low') return 'status-go';
    return 'status-info';
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col lg:flex-row">
        {/* Desktop Sidebar (aligned with Figma 18 LGU Dashboard, unified under Agapay) */}
        <aside className="no-print border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:p-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <AgapayLogo size="sm" />
                <div>
                  <span className="font-brand text-xl font-bold text-[var(--accent)]">
                    {t('brand.name')}
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--sub)]">
                    Business · LGU
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggle}
                aria-label="Toggle theme"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)]"
              >
                {resolved === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>

            <div className="mt-3 rounded-2xl bg-[var(--bg)] px-3.5 py-2.5 text-xs">
              <p className="font-bold text-[var(--ink)]">Baybay City, Leyte</p>
              <p className="text-[var(--sub)]">City Agriculture Office Workspace</p>
            </div>

            {/* Navigation Tabs */}
            <nav className="mt-4 flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`flex min-h-[46px] shrink-0 items-center gap-2.5 rounded-full px-4 text-sm font-bold transition lg:w-full ${
                      active
                        ? 'bg-[var(--ink)] text-[var(--bg)] shadow-xs'
                        : 'text-[var(--sub)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-4 space-y-2.5 border-t border-[var(--border)] pt-4">
            <LanguageSwitcher variant="pill" className="w-full justify-between" />
            <Link
              to="/home"
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 text-xs font-bold text-[var(--ink)] transition hover:border-[var(--accent)]"
            >
              <ArrowLeft size={15} />
              <span>Switch to Farmer Mobile App</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-5 pb-safe sm:px-6 lg:px-8 lg:py-7">
          {/* Top Header with Export Actions */}
          <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--sub)]">
                LGU / Baybay City · {BARANGAYS.length} Barangays Monitored
              </p>
              <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-[var(--ink)]">
                {navItems.find((n) => n.id === section)?.label}
              </h1>
            </div>

            <div className="no-print flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePrintPdf}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--accent)]"
              >
                <Printer size={16} />
                <span>{t('lgu.exportPdf')}</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-bold text-[var(--on-accent)] shadow-xs transition hover:bg-[var(--accent-deep)]"
              >
                <Download size={16} />
                <span>{t('lgu.exportCsv')}</span>
              </button>
            </div>
          </header>

          {exportSuccess && (
            <div className="status-go mb-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold">
              <FileSpreadsheet size={16} />
              <span>{exportSuccess}</span>
            </div>
          )}

          {/* Privacy Guarantee Banner */}
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-xs font-semibold text-[var(--ink)]">
            <ShieldCheck size={17} className="shrink-0 text-[var(--accent)]" />
            <span>{t('lgu.privacyNote')}</span>
          </div>

          {/* SECTION 1: CROWDING MAP (Figma 18 LGU Dashboard) */}
          {section === 'crowding' && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              {/* Left Map Panel */}
              <section className="ag-card p-5 xl:col-span-7">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--ink)]">Baybay City</h2>
                    <p className="text-xs text-[var(--sub)]">
                      6 reporting barangays · Crowding by reported hectares
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[var(--sub)]">N ↑</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {reportingBarangays.map((b) => {
                    const active = b.id === selectedBarangayId;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBarangayId(b.id)}
                        className={`flex min-h-[104px] flex-col items-start justify-between rounded-2xl p-4 text-left transition ${getMapTileTone(
                          b.crowding
                        )} ${
                          active
                            ? 'ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--surface)]'
                            : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-base font-extrabold">{b.name}</span>
                          <span className="text-xs font-bold">{b.hectares.toFixed(1)} ha</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold capitalize">
                            {b.crowding} crowding · {b.dominantCrop}
                          </p>
                          <p className="text-[11px] opacity-85">
                            {b.reportingFarmers} reporting farmers
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Cold-start suppressed barangay note */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--sub)]">
                  <span>
                    <strong>Brgy. Guadalupe</strong>: suppressed (&lt;5 reporting farmers · RA
                    10173 privacy rule)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="status-go rounded-full px-2 py-0.5 font-bold">Low</span>
                    <span className="status-wait rounded-full px-2 py-0.5 font-bold">Medium</span>
                    <span className="status-avoid rounded-full px-2 py-0.5 font-bold">High</span>
                  </div>
                </div>
              </section>

              {/* Right Planted Hectares Table */}
              <section className="ag-card flex flex-col justify-between p-5 xl:col-span-5">
                <div>
                  <h2 className="text-lg font-bold text-[var(--ink)]">Planted hectares</h2>
                  <p className="text-xs text-[var(--sub)]">Current planting cycle</p>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-xs text-[var(--sub)]">
                          <th className="pb-2.5 font-semibold">Barangay</th>
                          <th className="pb-2.5 font-semibold">Crop</th>
                          <th className="pb-2.5 text-right font-semibold">Hectares</th>
                          <th className="pb-2.5 text-right font-semibold">Crowding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {reportingBarangays.map((b) => {
                          const active = b.id === selectedBarangayId;
                          return (
                            <tr
                              key={b.id}
                              onClick={() => setSelectedBarangayId(b.id)}
                              className={`cursor-pointer transition ${
                                active ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--surface-muted)]'
                              }`}
                            >
                              <td className="py-3 font-bold text-[var(--ink)]">{b.name}</td>
                              <td className="py-3 text-[var(--sub)]">{b.dominantCrop}</td>
                              <td className="py-3 text-right font-bold text-[var(--ink)]">
                                {b.hectares.toFixed(1)}
                              </td>
                              <td className="py-3 text-right">
                                <StatusPill variant={b.crowding} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between border-t border-[var(--border)] pt-4">
                  <div>
                    <p className="text-sm font-bold text-[var(--ink)]">{t('lgu.totalPlanted')}</p>
                    <p className="text-xs text-[var(--sub)]">
                      Across {reportingBarangays.length} reporting barangays
                    </p>
                  </div>
                  <p className="text-2xl font-extrabold text-[var(--accent)]">
                    {totalPlantedHa.toFixed(1)} ha
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* SECTION 2: OVERVIEW (Figma 19 LGU Overview) */}
          {section === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                {[
                  { label: t('lgu.totalPlanted'), value: `${totalPlantedHa.toFixed(1)} ha`, sub: '6 qualifying barangays' },
                  { label: t('lgu.activeFarmers'), value: String(totalReportingFarmers), sub: 'Pseudonymized IDs' },
                  { label: 'High-crowding alerts', value: '2', sub: 'Gabas (Corn), Plaridel (Rice)' },
                  { label: 'Forecast accuracy', value: '78%', sub: 'Cross-checked vs rain reports' },
                ].map((kpi) => (
                  <div key={kpi.label} className="ag-card p-4">
                    <p className="text-xs font-semibold text-[var(--sub)]">{kpi.label}</p>
                    <p className="mt-1.5 text-3xl font-extrabold text-[var(--ink)]">{kpi.value}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              <section className="ag-card p-5">
                <h2 className="text-lg font-bold text-[var(--ink)]">
                  Recommended City Agriculture Office Actions
                </h2>
                <ul className="mt-3 space-y-2.5 text-sm text-[var(--sub)]">
                  <li className="rounded-2xl bg-[var(--bg)] p-3.5">
                    <strong className="text-[var(--ink)]">Brgy. Gabas (96.2 ha Corn · High):</strong>{' '}
                    Share sweet potato ridge-planting advisory to ease corn oversupply and wet-soil
                    risk.
                  </li>
                  <li className="rounded-2xl bg-[var(--bg)] p-3.5">
                    <strong className="text-[var(--ink)]">Brgy. Plaridel &amp; Caridad:</strong>{' '}
                    Prioritize NSIC Rc 194 submergence-tolerant rice seeds ahead of Nov 18 rain.
                  </li>
                  <li className="rounded-2xl bg-[var(--bg)] p-3.5">
                    <strong className="text-[var(--ink)]">Brgy. Guadalupe (4 farmers):</strong>{' '}
                    Recruit 1+ additional farmer reporter to unlock barangay crowding visibility.
                  </li>
                </ul>
              </section>
            </div>
          )}

          {/* SECTION 3: PLANTED AREA (Figma 20 LGU Planted Area) */}
          {section === 'planted' && (
            <section className="ag-card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-[var(--ink)]">
                  {t('lgu.barangayBreakdown')}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Corn', 'Rice', 'Coconut'].map((crop) => (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => setCropFilter(crop)}
                      className={`min-h-[40px] rounded-full border px-3.5 text-xs font-bold ${
                        cropFilter === crop
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                          : 'border-[var(--border)] bg-[var(--bg)] text-[var(--sub)]'
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredAreaRows.map((row) => {
                  const pct = Math.min(100, (row.hectares / 140) * 100);
                  return (
                    <div key={row.id} className="rounded-2xl bg-[var(--bg)] p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div>
                          <span className="font-bold text-[var(--ink)]">Brgy. {row.name}</span>
                          <span className="ml-2 text-xs text-[var(--sub)]">
                            {row.dominantCrop} · {row.zone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[var(--ink)]">
                            {row.reportingFarmers >= 5
                              ? `${row.hectares.toFixed(1)} ha`
                              : 'Hidden (<5)'}
                          </span>
                          <StatusPill variant={row.crowding} />
                        </div>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)]"
                          style={{ width: `${row.reportingFarmers >= 5 ? pct : 8}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 4: REPORTS (Figma 21 LGU Reports) */}
          {section === 'reports' && (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                {
                  title: 'Baybay City Crowding & Planted Area Summary',
                  desc: 'Aggregated barangay hectares, dominant crops, and crowding levels for seed distribution planning.',
                  meta: 'Nov 2026 · 6 qualifying barangays · RA 10173 compliant',
                },
                {
                  title: 'Waterlogging & Heavy Rain Preparedness Brief',
                  desc: 'Sentinel-1 SAR saturated zones and coastal lowland advisories for Caridad, Plaridel, and Gabas.',
                  meta: 'Updated today · Reviewed by Baybay CAO technician',
                },
              ].map((rep) => (
                <article key={rep.title} className="ag-card flex flex-col justify-between p-5">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--ink)]">{rep.title}</h2>
                    <p className="mt-1.5 text-sm text-[var(--sub)]">{rep.desc}</p>
                    <p className="mt-3 text-xs font-semibold text-[var(--muted)]">{rep.meta}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="min-h-[44px] flex-1 rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--on-accent)]"
                    >
                      {t('lgu.exportCsv')}
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintPdf}
                      className="min-h-[44px] flex-1 rounded-full border border-[var(--border)] text-xs font-bold text-[var(--ink)]"
                    >
                      {t('lgu.exportPdf')}
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}

          {/* SECTION 5: SETTINGS (Figma 22 LGU Settings) */}
          {section === 'settings' && (
            <section className="ag-card divide-y divide-[var(--border)] text-sm">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-bold text-[var(--ink)]">Privacy Aggregation Threshold</p>
                  <p className="text-xs text-[var(--sub)]">
                    Suppresses crowding metrics for barangays with fewer than 5 reporting farmers
                  </p>
                </div>
                <span className="status-go rounded-full px-3 py-1 text-xs font-bold">
                  ≥ 5 farmers
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-bold text-[var(--ink)]">Technician High-Risk Review</p>
                  <p className="text-xs text-[var(--sub)]">
                    Requires Baybay CAO sign-off before dispatching severe flood SMS blasts
                  </p>
                </div>
                <span className="status-go rounded-full px-3 py-1 text-xs font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-bold text-[var(--ink)]">Outlier Hectare Spot-Checks</p>
                  <p className="text-xs text-[var(--sub)]">
                    Flags parcels above 25 ha for technician verification before adding to totals
                  </p>
                </div>
                <span className="status-info rounded-full px-3 py-1 text-xs font-bold">Active</span>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
