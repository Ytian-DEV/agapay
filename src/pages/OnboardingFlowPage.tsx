import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  Loader2,
  MailCheck,
  MapPin,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { MAP_GRID_CELLS } from '../data/seedData';
import { useAppState } from '../context/AppStateContext';
import { isSupabaseConfigured } from '../lib/supabase';
import type { Crop } from '../types/database';

const TOTAL_STEPS = 5;

export function OnboardingFlowPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    barangays,
    crops,
    profile,
    consent,
    isAuthenticated,
    signUp,
    completeOnboarding,
  } = useAppState();

  const [step, setStep] = useState(isAuthenticated ? 2 : 1);

  // Step 1: Real Supabase Account creation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(
    profile.full_name === 'Mang Sauro' ? '' : profile.full_name
  );
  const [phone, setPhone] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);

  // Step 2: Barangay selection (live Supabase barangays!)
  const [barangayId, setBarangayId] = useState(
    barangays.find((b) => b.name === 'Gabas')?.id ?? barangays[0]?.id ?? ''
  );

  // Step 3: RA 10173 granular consent
  const [locConsent, setLocConsent] = useState(consent.location_consent);
  const [farmConsent, setFarmConsent] = useState(consent.farm_data_consent);
  const [remConsent, setRemConsent] = useState(consent.reminders_consent);
  const [agreed, setAgreed] = useState(true);

  // Step 4: Field setup
  const [fieldName, setFieldName] = useState('Northern Field');
  const [cropSlug, setCropSlug] = useState<Crop['slug']>('corn');
  const [areaHa, setAreaHa] = useState('1.5');
  const [gridCell, setGridCell] = useState('B2');
  const [savingFarm, setSavingFarm] = useState(false);

  const selectedBarangay =
    barangays.find((b) => b.id === barangayId) ?? barangays[0];
  const selectedCrop = crops.find((c) => c.slug === cropSlug) ?? crops[0];
  const parsedArea = Math.max(0.1, Number.parseFloat(areaHa) || 1.0);
  const isOutlier = parsedArea > 25;

  const handleBack = () => {
    if (step === 1 || (step === 2 && isAuthenticated)) {
      navigate('/');
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!isSupabaseConfigured) {
      // Allow local offline flow if Supabase is not configured
      setStep(2);
      return;
    }

    setAuthBusy(true);
    const res = await signUp({
      email,
      password,
      fullName: fullName.trim() || 'Farmer',
      phoneNumber: phone.trim() || undefined,
      preferredLanguage: i18n.language,
    });
    setAuthBusy(false);

    if (!res.ok) {
      setAuthError(res.error ?? 'Could not create account.');
      return;
    }

    if (res.needsEmailConfirmation) {
      setAwaitingEmailConfirm(true);
      return;
    }

    setStep(2);
  };

  const handleFinish = async () => {
    setSavingFarm(true);
    await completeOnboarding(
      {
        field_name: fieldName.trim() || `${selectedBarangay.name} Field`,
        barangay_id: selectedBarangay.id,
        crop_slug: cropSlug,
        area_ha: parsedArea,
        is_outlier_flagged: isOutlier,
        technician_verified: false,
        grid_cell: gridCell,
        lat: selectedBarangay.center_lat,
        lng: selectedBarangay.center_lng,
        drainage_note: `${selectedBarangay.soil_texture} · ${selectedBarangay.drainage_class.replace('_', ' ')}`,
      },
      {
        full_name: fullName.trim() || profile.full_name || 'Farmer',
        phone_number: phone.trim() || profile.phone_number,
        barangay_id: selectedBarangay.id,
        sms_alerts_enabled: remConsent,
        preferred_language: i18n.language as typeof profile.preferred_language,
      },
      {
        location_consent: locConsent,
        farm_data_consent: farmConsent,
        reminders_consent: remConsent,
        privacy_policy_accepted: agreed,
      }
    );
    setSavingFarm(false);
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
        {/* STEP 1: Real Supabase Account Sign-Up */}
        {step === 1 && !awaitingEmailConfirm && (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                1 / {TOTAL_STEPS} · Agapay Account
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
                Create your account
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--sub)]">
                Saves your fields, planting advisories, and harvest reports securely across devices.
              </p>
            </div>

            <div className="ag-card space-y-3.5 p-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sub)]">
                  {t('onboarding.nameLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Juan Dela Cruz"
                  className="mt-1.5 min-h-[48px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 text-base font-semibold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sub)]">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 min-h-[48px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 text-base font-semibold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sub)]">
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="mt-1.5 min-h-[48px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 text-base font-semibold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--sub)]">
                  Mobile number (optional · for SMS alerts)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('onboarding.phonePlaceholder')}
                  className="mt-1.5 min-h-[48px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 text-base font-semibold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            {authError && (
              <div className="status-avoid flex items-start gap-2 rounded-2xl p-3.5 text-xs font-bold">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authBusy || !email || password.length < 6 || !fullName.trim()}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-[17px] font-semibold text-[var(--on-accent)] shadow-sm transition disabled:opacity-50"
            >
              {authBusy && <Loader2 size={19} className="animate-spin" />}
              <span>{authBusy ? 'Creating account...' : t('common.continue')}</span>
            </button>

            <p className="text-center text-sm text-[var(--sub)]">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[var(--accent)] underline">
                Sign in
              </Link>
            </p>
          </form>
        )}

        {/* Email Confirmation Pending Screen (when Supabase Auth Confirm Email is ON) */}
        {step === 1 && awaitingEmailConfirm && (
          <section className="ag-card space-y-4 p-6 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--go-bg)] text-[var(--go-text)]">
              <MailCheck size={34} />
            </span>
            <h1 className="text-2xl font-bold text-[var(--ink)]">Account created!</h1>
            <p className="text-sm leading-relaxed text-[var(--sub)]">
              We sent a confirmation link to <strong className="text-[var(--ink)]">{email}</strong>.
              Confirm your email, then sign in to finish setting up your farm.
            </p>
            <p className="rounded-xl bg-[var(--bg)] p-3 text-xs text-[var(--sub)]">
              Tip for testing: in Supabase Dashboard → <strong>Authentication → Providers → Email</strong>,
              you can turn off <em>Confirm email</em> for instant one-step sign-up.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-base font-bold text-[var(--on-accent)]"
            >
              Go to Sign in
            </button>
          </section>
        )}

        {/* STEP 2: Barangay Selection */}
        {step === 2 && (
          <section className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                2 / {TOTAL_STEPS} · Location
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
                {t('onboarding.barangayLabel')}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {barangays.map((b) => {
                const active = b.id === barangayId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBarangayId(b.id)}
                    className={`flex min-h-[60px] flex-col justify-center rounded-2xl border px-3.5 py-2.5 text-left transition ${
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border)] bg-[var(--surface)]'
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

            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-[17px] font-semibold text-[var(--on-accent)] shadow-sm"
            >
              {t('common.continue')}
            </button>
          </section>
        )}

        {/* STEP 3: RA 10173 Informed Consent (Figma 11 Consent) */}
        {step === 3 && (
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                3 / {TOTAL_STEPS} · RA 10173 Privacy
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
              onClick={() => setStep(4)}
              className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-[17px] font-semibold text-[var(--on-accent)] shadow-sm transition disabled:opacity-50"
            >
              {t('common.continue')}
            </button>
          </section>
        )}

        {/* STEP 4: Farm Setup & Manual Map Pin */}
        {step === 4 && (
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
                4 / {TOTAL_STEPS} · Brgy. {selectedBarangay.name}
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
                  {crops.map((crop) => {
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
                        <span
                          className={`text-[10px] font-normal ${
                            active ? 'opacity-90' : 'text-[var(--sub)]'
                          }`}
                        >
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
              onClick={() => setStep(5)}
              className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[var(--accent)] text-[17px] font-semibold text-[var(--on-accent)] shadow-sm"
            >
              {t('common.review')}
            </button>
          </section>
        )}

        {/* STEP 5: Review & Save to Supabase */}
        {step === 5 && (
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
                { label: 'Farmer', value: fullName || profile.full_name },
                { label: 'Field', value: `${fieldName} (Zone ${gridCell})` },
                { label: 'Location', value: `Brgy. ${selectedBarangay.name}, Baybay City` },
                { label: 'Primary crop', value: `${selectedCrop.name} (${selectedCrop.local_name})` },
                {
                  label: 'Area',
                  value: `${parsedArea} ${t('common.hectares')}${isOutlier ? ' · Flagged' : ''}`,
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
              disabled={savingFarm}
              onClick={handleFinish}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-[17px] font-semibold text-[var(--on-accent)] shadow-md disabled:opacity-60"
            >
              {savingFarm ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Check size={20} strokeWidth={2.5} />
              )}
              <span>{savingFarm ? 'Saving to Supabase...' : t('onboarding.goToHome')}</span>
            </button>
          </section>
        )}
      </div>
    </MobileShell>
  );
}
