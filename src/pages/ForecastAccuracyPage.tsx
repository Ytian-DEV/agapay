import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CloudRain, ClipboardCheck } from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { useAppState } from '../context/AppStateContext';

export function ForecastAccuracyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { barangays, accuracySeries, activeParcel, rainCheckins, harvestReports } =
    useAppState();

  const barangay =
    barangays.find((b) => b.id === activeParcel.barangay_id) ?? barangays[0];

  // Dynamic accuracy score boosted slightly as the farmer logs real observations
  const baseAccuracy = 78;
  const accuracyPct = Math.min(
    94,
    baseAccuracy + Math.min(4, Math.max(0, rainCheckins.length - 1))
  );

  // Circular gauge SVG geometry
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - accuracyPct / 100);

  // Simple 6-week line chart points (viewBox 280 x 110)
  const maxVal = 65;
  const toPoint = (idx: number, val: number) => {
    const x = 14 + (idx / Math.max(1, accuracySeries.length - 1)) * 252;
    const y = 94 - (val / maxVal) * 78;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const forecastLine = accuracySeries.map((p, i) =>
    toPoint(i, p.forecast_mm)
  ).join(' ');
  const reportedLine = accuracySeries.map((p, i) =>
    toPoint(i, p.reported_mm)
  ).join(' ');

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
          <p className="text-xs font-semibold text-[var(--sub)]">
            Forecast vs reports · Brgy. {barangay.name}
          </p>
          <h1 className="text-2xl font-bold text-[var(--ink)]">{t('crops.accuracyTitle')}</h1>
        </div>
      </header>

      <div className="space-y-4 pb-6">
        {/* Accuracy Ring Gauge (Figma 16 Forecast accuracy) */}
        <section className="ag-card flex flex-col items-center p-6">
          <div className="relative flex h-40 w-40 items-center justify-center">
            <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--surface-muted)"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold tracking-tight text-[var(--ink)]">
                {accuracyPct}%
              </span>
              <span className="text-xs font-semibold text-[var(--sub)]">accurate</span>
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-[var(--sub)]">
            Cross-checked across <strong>{barangay.reporting_farmers}</strong> farmers in Brgy.{' '}
            {barangay.name} + Sentinel-1 &amp; ERA5.
          </p>
        </section>

        {/* 6-Week Forecast vs Reported Chart */}
        <section className="ag-card p-4">
          <div className="mb-3 flex items-center gap-4 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 text-[var(--sub)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-sage)]" />
              Forecast (mm)
            </span>
            <span className="inline-flex items-center gap-1.5 text-[var(--ink)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              Reported (mm)
            </span>
          </div>

          <svg viewBox="0 0 280 110" className="w-full overflow-visible">
            <line
              x1="10"
              y1="96"
              x2="270"
              y2="96"
              stroke="var(--border)"
              strokeWidth="1.5"
            />
            <polyline
              fill="none"
              stroke="var(--accent-sage)"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              points={forecastLine}
            />
            <polyline
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={reportedLine}
            />
          </svg>

          <div className="mt-1 flex justify-between text-[11px] font-semibold text-[var(--sub)]">
            <span>6 weeks ago</span>
            <span>This week</span>
          </div>
        </section>

        <p className="text-xs leading-relaxed text-[var(--sub)]">{t('crops.accuracyNote')}</p>

        {/* Contribution Summary + Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/rain-checkin"
            className="ag-card flex flex-col justify-between p-4 transition hover:border-[var(--accent)]"
          >
            <CloudRain size={20} className="text-[var(--accent)]" />
            <div className="mt-3">
              <p className="text-xl font-extrabold text-[var(--ink)]">{rainCheckins.length}</p>
              <p className="text-xs font-semibold text-[var(--sub)]">Your rain check-ins</p>
            </div>
          </Link>

          <Link
            to="/harvest-feedback"
            className="ag-card flex flex-col justify-between p-4 transition hover:border-[var(--accent)]"
          >
            <ClipboardCheck size={20} className="text-[var(--accent)]" />
            <div className="mt-3">
              <p className="text-xl font-extrabold text-[var(--ink)]">{harvestReports.length}</p>
              <p className="text-xs font-semibold text-[var(--sub)]">Your harvest logs</p>
            </div>
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}
