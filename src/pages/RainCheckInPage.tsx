import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Check,
  CheckCircle2,
  CloudDrizzle,
  CloudLightning,
  CloudOff,
  CloudRain,
  Sun,
  X,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { useAppState } from '../context/AppStateContext';
import type { RainIntensity } from '../types/database';

export function RainCheckInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { barangays, activeParcel, submitRainCheckIn, isOnline } = useAppState();

  const barangay =
    barangays.find((b) => b.id === activeParcel.barangay_id) ?? barangays[0];

  const [selected, setSelected] = useState<RainIntensity>('light');
  const [stage, setStage] = useState<'pick' | 'review' | 'done'>('pick');

  const options: {
    id: RainIntensity;
    label: string;
    hint: string;
    icon: typeof Sun;
  }[] = [
    { id: 'none', label: t('rain.none'), hint: 'Dry / clear', icon: Sun },
    { id: 'light', label: t('rain.light'), hint: 'Drizzle / ambon', icon: CloudDrizzle },
    { id: 'moderate', label: t('rain.moderate'), hint: 'Steady rain', icon: CloudRain },
    { id: 'heavy', label: t('rain.heavy'), hint: 'Downpour / pooling', icon: CloudLightning },
  ];

  const chosenOption = options.find((o) => o.id === selected) ?? options[1];

  const handleConfirm = async () => {
    await submitRainCheckIn(selected, activeParcel.id);
    setStage('done');
  };

  return (
    <MobileShell showTabs={false}>
      <header className="flex items-start justify-between pb-4 pt-2">
        <div>
          <p className="text-xs font-semibold text-[var(--sub)]">
            Brgy. {barangay.name} · Now
          </p>
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-[var(--ink)]">
            {t('rain.title')}
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

      {stage === 'pick' && (
        <section className="space-y-5">
          <p className="text-sm text-[var(--sub)]">{t('rain.subtitle')}</p>

          <div className="grid grid-cols-2 gap-3.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const active = opt.id === selected;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelected(opt.id)}
                  className={`relative flex min-h-[144px] flex-col justify-between rounded-[24px] border-2 p-4 text-left transition ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--surface)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        active
                          ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                          : 'bg-[var(--surface-muted)] text-[var(--ink)]'
                      }`}
                    >
                      <Icon size={25} />
                    </span>
                    {active && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)]">
                        <Check size={16} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[var(--ink)]">{opt.label}</p>
                    <p className="text-xs text-[var(--sub)]">{opt.hint}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="ag-card px-4 py-3 text-xs leading-relaxed text-[var(--sub)]">
            <strong className="text-[var(--ink)]">{activeParcel.field_name}</strong> · Cross-checked
            against nearby farmer reports and Sentinel-1 radar so one check-in never overrides
            verified data.
          </div>

          <button
            type="button"
            onClick={() => setStage('review')}
            className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-[17px] font-semibold text-[var(--on-accent)] shadow-md"
          >
            {t('rain.reviewReport')}
          </button>
        </section>
      )}

      {stage === 'review' && (
        <section className="space-y-5 pt-2">
          <div className="ag-card divide-y divide-[var(--border)] text-sm">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-[var(--sub)]">Rain condition</span>
              <span className="text-base font-bold text-[var(--ink)]">{chosenOption.label}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-[var(--sub)]">Field</span>
              <span className="font-bold text-[var(--ink)]">{activeParcel.field_name}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-[var(--sub)]">Barangay</span>
              <span className="font-bold text-[var(--ink)]">Brgy. {barangay.name}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-[var(--sub)]">Connection</span>
              <span className="font-bold text-[var(--ink)]">
                {isOnline ? 'Online · Instant sync' : 'Offline · Queue on phone'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStage('pick')}
              className="min-h-[54px] flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[15px] font-bold text-[var(--ink)]"
            >
              {t('common.back')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="min-h-[54px] flex-[1.5] rounded-full bg-[var(--accent)] text-[16px] font-bold text-[var(--on-accent)] shadow-md"
            >
              {t('rain.sendReport')}
            </button>
          </div>
        </section>
      )}

      {stage === 'done' && (
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
          <h2 className="mt-4 text-2xl font-bold text-[var(--ink)]">{t('rain.thankYou')}</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--sub)]">
            {isOnline
              ? `Recorded "${chosenOption.label}" for Brgy. ${barangay.name}. This helps calibrate local forecasts.`
              : t('rain.savedOffline')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="mt-8 flex min-h-[54px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-[16px] font-bold text-[var(--on-accent)]"
          >
            {t('onboarding.goToHome')}
          </button>
        </section>
      )}
    </MobileShell>
  );
}
