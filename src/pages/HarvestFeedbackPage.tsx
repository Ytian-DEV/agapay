import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, CloudOff, Minus, Plus, X } from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { useAppState } from '../context/AppStateContext';
import type { Crop } from '../types/database';

export function HarvestFeedbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { crops, activeParcel, submitHarvestReport, harvestReports, isOnline } =
    useAppState();

  const [cropSlug, setCropSlug] = useState<Crop['slug']>(activeParcel.crop_slug);
  const activeCrop = crops.find((c) => c.slug === cropSlug) ?? crops[0];

  const [sacks, setSacks] = useState<number>(54);
  const [variety, setVariety] = useState<string>(activeCrop.varieties[0] ?? 'Local certified');
  const [harvestDate, setHarvestDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [submitted, setSubmitted] = useState(false);

  const handleCropChange = (slug: Crop['slug']) => {
    setCropSlug(slug);
    const next = crops.find((c) => c.slug === slug);
    if (next) {
      setVariety(next.varieties[0] ?? 'Local certified');
      setSacks(Math.round((next.typical_yield_min_sacks + next.typical_yield_max_sacks) / 2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitHarvestReport({
      parcel_id: activeParcel.id,
      crop_slug: cropSlug,
      variety,
      yield_sacks_per_ha: sacks,
      harvest_date: harvestDate,
    });
    setSubmitted(true);
  };

  return (
    <MobileShell showTabs={false}>
      <header className="flex items-start justify-between pb-4 pt-2">
        <div>
          <p className="text-xs font-semibold text-[var(--sub)]">
            {activeParcel.field_name} · {t('crops.harvestPrompt')}
          </p>
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-[var(--ink)]">
            {t('crops.harvestTitle')}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common.close')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
        >
          <X size={20} />
        </button>
      </header>

      {submitted ? (
        <section className="flex flex-col items-center py-10 text-center">
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              isOnline
                ? 'bg-[var(--go-bg)] text-[var(--go-text)]'
                : 'bg-[var(--wait-bg)] text-[var(--wait-text)]'
            }`}
          >
            {isOnline ? <CheckCircle2 size={36} /> : <CloudOff size={34} />}
          </span>
          <h2 className="mt-4 text-2xl font-bold text-[var(--ink)]">Harvest report saved!</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--sub)]">
            {isOnline
              ? `Logged ${sacks} sacks/ha (${activeCrop.name} · ${variety}). Your report recalibrates next season's predictions.`
              : t('rain.savedOffline')}
          </p>
          <div className="mt-6 flex w-full gap-3">
            <button
              type="button"
              onClick={() => navigate('/accuracy')}
              className="min-h-[52px] flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-bold text-[var(--ink)]"
            >
              View accuracy
            </button>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="min-h-[52px] flex-1 rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--on-accent)]"
            >
              {t('onboarding.goToHome')}
            </button>
          </div>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pb-6">
          {/* Big Sacks-Per-Hectare Stepper (Figma 15 Harvest feedback) */}
          <section className="ag-card flex flex-col items-center p-6">
            <div className="flex w-full items-center justify-between gap-4">
              <button
                type="button"
                aria-label="Decrease sacks"
                onClick={() => setSacks((v) => Math.max(0, v - 2))}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] active:scale-95"
              >
                <Minus size={24} />
              </button>

              <div className="text-center">
                <input
                  type="number"
                  min={0}
                  max={400}
                  value={sacks}
                  onChange={(e) => setSacks(Math.max(0, Number(e.target.value) || 0))}
                  aria-label="Sacks per hectare"
                  className="w-28 bg-transparent text-center text-5xl font-extrabold tracking-tight text-[var(--ink)] focus:outline-none"
                />
                <p className="mt-1 text-sm font-semibold text-[var(--sub)]">
                  {t('common.sacksPerHa')}
                </p>
              </div>

              <button
                type="button"
                aria-label="Increase sacks"
                onClick={() => setSacks((v) => Math.min(400, v + 2))}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] active:scale-95"
              >
                <Plus size={24} />
              </button>
            </div>
          </section>

          {/* Clean Crop, Variety & Date Selectors */}
          <section className="ag-card divide-y divide-[var(--border)] text-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <label htmlFor="harvest-crop" className="font-semibold text-[var(--sub)]">
                Crop
              </label>
              <select
                id="harvest-crop"
                value={cropSlug}
                onChange={(e) => handleCropChange(e.target.value as Crop['slug'])}
                className="min-h-[44px] rounded-xl bg-[var(--bg)] px-3 text-right font-bold text-[var(--ink)] focus:outline-none"
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <label htmlFor="harvest-variety" className="font-semibold text-[var(--sub)]">
                Variety
              </label>
              <select
                id="harvest-variety"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className="min-h-[44px] rounded-xl bg-[var(--bg)] px-3 text-right font-bold text-[var(--ink)] focus:outline-none"
              >
                {activeCrop.varieties.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <label htmlFor="harvest-date" className="font-semibold text-[var(--sub)]">
                Harvest date
              </label>
              <input
                id="harvest-date"
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="min-h-[44px] rounded-xl bg-[var(--bg)] px-3 font-bold text-[var(--ink)] focus:outline-none"
              />
            </div>
          </section>

          <p className="text-xs leading-relaxed text-[var(--sub)]">
            {isOnline
              ? 'Submitted reports calibrate Baybay City yield models for next season.'
              : 'Offline: your report will be saved safely on this phone and synced automatically when signal returns.'}
          </p>

          <button
            type="submit"
            className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-[17px] font-bold text-[var(--on-accent)] shadow-md"
          >
            {t('common.submit')}
          </button>

          {harvestReports.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--sub)]">
                Previous harvest logs ({harvestReports.length})
              </p>
              <div className="space-y-2">
                {harvestReports.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="ag-card flex items-center justify-between px-4 py-3 text-xs"
                  >
                    <div>
                      <span className="font-bold capitalize text-[var(--ink)]">
                        {r.crop_slug} · {r.variety}
                      </span>
                      <p className="text-[var(--sub)]">{r.harvest_date}</p>
                    </div>
                    <span className="text-sm font-extrabold text-[var(--accent)]">
                      {r.yield_sacks_per_ha} sacks/ha
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}
    </MobileShell>
  );
}
