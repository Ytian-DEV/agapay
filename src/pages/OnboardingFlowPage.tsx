import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { BARANGAYS, CROPS, MAP_GRID_CELLS } from '../data/seedData';
import { useAppState } from '../context/AppStateContext';
import type { Crop } from '../types/database';

const TOTAL_STEPS = 6;

export function OnboardingFlowPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, consent, updateProfile, updateConsent, completeOnboarding } = useAppState();

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState(profile.phone_number || '0917 482 1930');
  const [otp, setOtp] = useState('482910');
  const [fullName, setFullName] = useState(profile.full_name || 'Mang Sauro');
  const [barangayId, setBarangayId] = useState(profile.barangay_id || 'brgy-gabas');

  // RA 10173 granular consent
  const [locConsent, setLocConsent] = useState(consent.location_consent);
  const [farmConsent, setFarmConsent] = useState(consent.farm_data_consent);
  const [remConsent, setRemConsent] = useState(consent.reminders_consent);
  const [agreed, setAgreed] = useState(true);

  // Field setup
  const [fieldName, setFieldName] = useState('Northern Field');
  const [cropSlug, setCropSlug] = useState<Crop['slug']>('corn');
  const [areaHa, setAreaHa] = useState('1.5');
  const [gridCell, setGridCell] = useState('B2');

  const selectedBarangay = BARANGAYS.find((b) => b.id === barangayId) ?? BARANGAYS[0];
  const selectedCrop = CROPS.find((c) => c.slug === cropSlug) ?? CROPS[2];
  const parsedArea = Math.max(0.1, Number.parseFloat(areaHa) || 1.0);
  const isOutlier = parsedArea > 25;

  const handleBack = () => {
    if (step === 1) {
      navigate('/');
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleFinish = () => {
    updateProfile({
      full_name: fullName.trim() || 'Farmer',
      phone_number: phone.trim(),
      barangay_id: barangayId,
      sms_alerts_enabled: remConsent,
    });
    updateConsent({
      location_consent: locConsent,
      farm_data_consent: farmConsent,
      reminders_consent: remConsent,
      privacy_policy_accepted: agreed,
      agreed_at: new Date().toISOString(),
    });
    completeOnboarding({
      field_name: fieldName.trim() || `${selectedBarangay.name} Field`,
      barangay_id: barangayId,
      crop_slug: cropSlug,
      area_ha: parsedArea,
      is_outlier_flagged: isOutlier,
      technician_verified: false,
      grid_cell: gridCell,
      lat: selectedBarangay.center_lat,
      lng: selectedBarangay.center_lng,
      drainage_note: `${selectedBarangay.soil_texture} · ${selectedBarangay.drainage_class.replace('_', ' ')}`,
    });
    navigate('/home');
  };

  return (
    <MobileShell showTabs={false}>
      {/* Top Progress Header */}
      <header className="flex items-center justify-between pb-3 pt-2">
        <button
          type="button"
          onClick={handleBack}
          aria-label={t('common.back')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-1.5" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
            <span
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx + 1 === step
                  ? 'w-7 bg-[var(--accent)]'
                  : idx + 1 < step
                  ? 'w-2.5 bg-[var(--accent-sage)]'
                  : 'w-2.5 bg-[var(--border)]'
              }`}
            />
          ))}
        </div>

        <LanguageSwitcher variant="pill" className="px-2.5 text-xs" />
      </header>

      <div className="mt-2 pb-8">
        {/* STEP 1: Mobile Registration */}
        {step === 1 && (
          <section className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                1 / {TOTAL_STEPS} · SMS & Account
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
                {t('onboarding.mobileTitle')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--sub)]">
                {t('onboarding.mobilePrompt')}
              </p>
            </div>

            <div className="ag-card p-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                Philippines (+63)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('onboarding.phonePlaceholder')}
                className="mt-2 min-h-[52px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 text-lg font-bold tracking-wide text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={phone.replace(/\D/g, '').length < 10}
              className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-[17px] font-semibold text-[var(--on-accent)] shadow-sm transition disabled:opacity-50"
            >
              {t('onboarding.sendCode')}
            </button>
          </section>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <section className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                2 / {TOTAL_STEPS} · Verification
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
                {t('onboarding.otpTitle')}
              </h1>
              <p className="mt-2 text-sm text-[var(--sub)]">
                {t('onboarding.otpPrompt')} <strong className="text-[var(--ink)]">{phone}</strong>
              </p>
            </div>

            <div className="ag-card p-5">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="min-h-[60px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-center font-mono text-3xl font-bold tracking-[0.4em] text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
              />
              <p className="mt-2.5 text-center text-xs text-[var(--sub)]">
                Demo code pre-filled so you can verify right away.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={otp.length < 6}
              className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-[17px] font-semibold text-[var(--on-accent)] shadow-sm transition disabled:opacity-50"
            >
              {t('onboarding.verify')}
            </button>
          </section>
        )}

        {/* STEP 3: Farmer Info */}
        {step === 3 && (
          <section className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                3 / {TOTAL_STEPS} · Profile
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
                {t('onboarding.farmerInfoTitle')}
              </h1>
            </div>

            <div className="ag-card space-y-4 p-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                  {t('onboarding.nameLabel')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5 min-h-[50px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 text-base font-semibold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                  {t('onboarding.barangayLabel')}
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {BARANGAYS.map((b) => {
                    const active = b.id === barangayId;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBarangayId(b.id)}
                        className={`flex min-h-[54px] flex-col justify-center rounded-2xl border px-3 py-2 text-left transition ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                            : 'border-[var(--border)] bg-[var(--bg)]'
                        }`}
                      >
                        <span className="text-sm font-bold text-[var(--ink)]">Brgy. {b.name}</span>
                        <span className="text-[11px] text-[var(--sub)]">
                          {b.elevation_m}m · {b.soil_texture}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(4)}
              className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-[17px] font-semibold text-[var(--on-accent)] shadow-sm"
            >
              {t('common.continue')}
            </button>
          </section>
        )}

        {/* STEP 4: RA 10173 Informed Consent (Figma 11 Consent) */}
        {step === 4 && (
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                4 / {TOTAL_STEPS} · RA 10173 Privacy
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
                {t('onboarding.consentTitle')}
              </h1>
            </div>

            <div className="ag-card divide-y divide-[var(--border)] overflow-hidden">
              {[
                {
                  icon: MapPin,
                  title: t('onboarding.locationConsent'),
                  sub: t('onboarding.locationConsentSub'),
                  value: locConsent,
                  toggle: () => setLocConsent((v) => !v),
                },
                {
                  icon: Sprout,
                  title: t('onboarding.farmDataConsent'),
                  sub: t('onboarding.farmDataConsentSub'),
                  value: farmConsent,
                  toggle: () => setFarmConsent((v) => !v),
                },
                {
                  icon: Bell,
                  title: t('onboarding.remindersConsent'),
                  sub: t('onboarding.remindersConsentSub'),
                  value: remConsent,
                  toggle: () => setRemConsent((v) => !v),
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex min-h-[68px] items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                        <Icon size={19} />
                      </span>
                      <div>
                        <p className="text-[15px] font-bold text-[var(--ink)]">{item.title}</p>
                        <p className="text-xs text-[var(--sub)]">{item.sub}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.value}
                      onClick={item.toggle}
                      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                        item.value ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                          item.value ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl bg-[var(--accent-soft)] p-3.5 text-xs leading-relaxed text-[var(--ink)]">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--accent)]" />
              <p>{t('onboarding.consentNote')}</p>
            </div>

            <label className="ag-card flex min-h-[60px] cursor-pointer items-center gap-3 p-4">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-6 w-6 rounded-md accent-[var(--accent)]"
              />
              <span className="text-sm font-semibold text-[var(--ink)]">
                {t('onboarding.consentAgree')}
              </span>
            </label>

            <button
              type="button"
              disabled={!agreed}
              onClick={() => setStep(5)}
              className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-[17px] font-semibold text-[var(--on-accent)] shadow-sm transition disabled:opacity-50"
            >
              {t('common.continue')}
            </button>
          </section>
        )}

        {/* STEP 5: Farm Setup & Manual Map Pin (Figma 12 Farm setup) */}
        {step === 5 && (
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                5 / {TOTAL_STEPS} · Brgy. {selectedBarangay.name}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
                {t('onboarding.fieldSetupTitle')}
              </h1>
            </div>

            <div className="ag-card space-y-4 p-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                  {t('onboarding.fieldNameLabel')}
                </label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="mt-1.5 min-h-[48px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 text-base font-semibold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                  {t('onboarding.cropLabel')}
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {CROPS.map((crop) => {
                    const active = crop.slug === cropSlug;
                    return (
                      <button
                        key={crop.id}
                        type="button"
                        onClick={() => setCropSlug(crop.slug)}
                        className={`min-h-[52px] rounded-2xl border px-3 py-2 text-left transition ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                            : 'border-[var(--border)] bg-[var(--bg)]'
                        }`}
                      >
                        <div className="text-sm font-bold text-[var(--ink)]">{crop.name}</div>
                        <div className="text-xs text-[var(--sub)]">{crop.local_name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                  {t('onboarding.areaLabel')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="500"
                  value={areaHa}
                  onChange={(e) => setAreaHa(e.target.value)}
                  className="mt-1.5 min-h-[48px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 text-base font-bold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                />
                {isOutlier && (
                  <div className="status-wait mt-2 flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-medium">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <span>{t('onboarding.outlierWarning')}</span>
                  </div>
                )}
              </div>

              {/* Manual Map Pin 3x3 Grid */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                  {t('onboarding.mapPinTitle')}
                </label>
                <p className="mt-0.5 text-xs text-[var(--sub)]">{t('onboarding.mapPinPrompt')}</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {MAP_GRID_CELLS.map((cell) => {
                    const active = cell.id === gridCell;
                    return (
                      <button
                        key={cell.id}
                        type="button"
                        onClick={() => setGridCell(cell.id)}
                        className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl border text-xs font-bold transition ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                            : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink)]'
                        }`}
                      >
                        <span>{cell.id}</span>
                        <span className={`text-[10px] font-normal ${active ? 'opacity-90' : 'text-[var(--sub)]'}`}>
                          {cell.barangay_name.replace('Brgy. ', '').split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(6)}
              className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-[17px] font-semibold text-[var(--on-accent)] shadow-sm"
            >
              {t('common.review')}
            </button>
          </section>
        )}

        {/* STEP 6: Review & Setup Complete */}
        {step === 6 && (
          <section className="space-y-5">
            <div className="flex flex-col items-center pt-2 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--go-bg)] text-[var(--go-text)]">
                <CheckCircle2 size={36} />
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--ink)]">
                {t('onboarding.completeTitle')}
              </h1>
              <p className="mt-1.5 max-w-xs text-sm text-[var(--sub)]">
                {t('onboarding.completeSub')}
              </p>
            </div>

            <div className="ag-card divide-y divide-[var(--border)] text-sm">
              {[
                { label: 'Farmer', value: fullName },
                { label: 'Mobile (SMS)', value: `${phone} · ${remConsent ? 'SMS On' : 'SMS Off'}` },
                { label: 'Field', value: `${fieldName} (Zone ${gridCell})` },
                { label: 'Location', value: `Brgy. ${selectedBarangay.name}, Baybay City` },
                { label: 'Primary crop', value: `${selectedCrop.name} (${selectedCrop.local_name})` },
                {
                  label: 'Area',
                  value: `${parsedArea} ${t('common.hectares')}${isOutlier ? ' · Flagged for check' : ''}`,
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[var(--sub)]">{row.label}</span>
                  <span className="font-bold text-[var(--ink)]">{row.value}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-[17px] font-semibold text-[var(--on-accent)] shadow-md"
            >
              <Check size={20} strokeWidth={2.5} />
              <span>{t('onboarding.goToHome')}</span>
            </button>
          </section>
        )}
      </div>
    </MobileShell>
  );
}
