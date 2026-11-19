import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CloudCog,
  LogIn,
  LogOut,
  MapPinned,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAppState } from '../context/AppStateContext';
import { useTheme } from '../context/ThemeContext';

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    authUser,
    isAuthenticated,
    barangays,
    crops,
    profile,
    activeParcel,
    pendingSyncCount,
    rainCheckins,
    resetSession,
  } = useAppState();
  const { resolved, toggle } = useTheme();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const barangay =
    barangays.find((b) => b.id === activeParcel.barangay_id) ?? barangays[0];
  const crop = crops.find((c) => c.slug === activeParcel.crop_slug) ?? crops[0];
  const accuracyPct = Math.min(94, 78 + Math.min(4, Math.max(0, rainCheckins.length - 1)));

  const planSubtitle =
    profile.subscription_tier === 'free'
      ? 'One crop, one location'
      : profile.subscription_tier === 'business'
      ? 'LGU & Cooperative multi-user suite'
      : 'All crops, parcels, crowding & yield';

  const handleLogout = async () => {
    await resetSession();
    setConfirmLogout(false);
    navigate('/');
  };

  return (
    <MobileShell>
      <header className="pb-3 pt-1">
        <p className="text-xs font-semibold text-[var(--sub)]">
          {profile.full_name} · Brgy. {barangay?.name ?? 'Gabas'}
        </p>
        <h1 className="mt-0.5 text-[34px] font-bold leading-tight tracking-tight text-[var(--ink)]">
          {t('profile.title')}
        </h1>
      </header>

      <div className="space-y-4">
        {/* Supabase Account Connection Status Banner */}
        {isAuthenticated && authUser ? (
          <div className="status-go flex items-center justify-between gap-2 rounded-2xl px-4 py-3 text-xs font-bold">
            <span className="flex items-center gap-2 truncate">
              <CheckCircle2 size={16} className="shrink-0" />
              <span className="truncate">Synced to Supabase · {authUser.email}</span>
            </span>
          </div>
        ) : (
          <div className="ag-card flex items-center justify-between gap-3 border-[var(--wait-border)] bg-[var(--wait-bg)] p-3.5 text-xs">
            <div className="text-[var(--wait-text)]">
              <p className="font-bold">Local preview mode (not signed in)</p>
              <p className="mt-0.5 opacity-90">
                Sign in or register so your account &amp; fields save to Supabase.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-full bg-[var(--accent)] px-3.5 text-xs font-bold text-[var(--on-accent)]"
            >
              <LogIn size={14} />
              <span>Sign in</span>
            </Link>
          </div>
        )}

        {/* Subscription Plan Card (Figma 17 Profile) */}
        <section className="ag-card flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-base font-bold capitalize text-[var(--ink)]">
              {profile.subscription_tier} plan
            </p>
            <p className="text-xs text-[var(--sub)]">{planSubtitle}</p>
          </div>
          <Link
            to="/plans"
            className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent)] px-4 text-sm font-bold text-[var(--on-accent)] shadow-xs"
          >
            {profile.subscription_tier === 'free' ? t('common.upgrade') : 'Plans'}
          </Link>
        </section>

        {/* Farm & Insights Group */}
        <section className="ag-card divide-y divide-[var(--border)] overflow-hidden">
          <Link
            to="/fields"
            className="flex min-h-[58px] items-center justify-between px-4 py-3 transition hover:bg-[var(--surface-muted)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <MapPinned size={18} />
              </span>
              <span className="text-[15px] font-semibold text-[var(--ink)]">
                {t('profile.manageFields')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-[var(--sub)]">
              <span>
                {crop?.name ?? 'Corn'} · {activeParcel.area_ha} {t('common.hectares')}
              </span>
              <ChevronRight size={17} />
            </div>
          </Link>

          <Link
            to="/harvest-feedback"
            className="flex min-h-[58px] items-center justify-between px-4 py-3 transition hover:bg-[var(--surface-muted)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <ClipboardCheck size={18} />
              </span>
              <span className="text-[15px] font-semibold text-[var(--ink)]">
                {t('profile.harvestReport')}
              </span>
            </div>
            <ChevronRight size={17} className="text-[var(--sub)]" />
          </Link>

          <Link
            to="/accuracy"
            className="flex min-h-[58px] items-center justify-between px-4 py-3 transition hover:bg-[var(--surface-muted)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <Activity size={18} />
              </span>
              <span className="text-[15px] font-semibold text-[var(--ink)]">
                {t('profile.forecastAccuracy')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--accent)]">
              <span>{accuracyPct}%</span>
              <ChevronRight size={17} className="text-[var(--sub)]" />
            </div>
          </Link>

          <Link
            to="/sync"
            className="flex min-h-[58px] items-center justify-between px-4 py-3 transition hover:bg-[var(--surface-muted)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <CloudCog size={18} />
              </span>
              <span className="text-[15px] font-semibold text-[var(--ink)]">
                {t('profile.syncStatus')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-[var(--sub)]">
              {pendingSyncCount > 0 && (
                <span className="status-wait rounded-full px-2 py-0.5 text-xs font-bold">
                  {pendingSyncCount} queued
                </span>
              )}
              <ChevronRight size={17} />
            </div>
          </Link>
        </section>

        {/* Language, Theme, Privacy & LGU Workspace */}
        <section className="ag-card divide-y divide-[var(--border)] overflow-hidden">
          <LanguageSwitcher variant="row" />

          <button
            type="button"
            onClick={toggle}
            className="flex min-h-[56px] w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[var(--surface-muted)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </span>
              <span className="text-[15px] font-semibold text-[var(--ink)]">
                {t('profile.darkMode')}
              </span>
            </div>
            <span className="text-sm font-semibold capitalize text-[var(--sub)]">
              {resolved} mode
            </span>
          </button>

          <Link
            to="/privacy"
            className="flex min-h-[58px] items-center justify-between px-4 py-3 transition hover:bg-[var(--surface-muted)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <ShieldCheck size={18} />
              </span>
              <span className="text-[15px] font-semibold text-[var(--ink)]">
                {t('profile.privacySupport')}
              </span>
            </div>
            <ChevronRight size={17} className="text-[var(--sub)]" />
          </Link>

          <Link
            to="/lgu"
            className="flex min-h-[58px] items-center justify-between px-4 py-3 transition hover:bg-[var(--surface-muted)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <Building2 size={18} />
              </span>
              <span className="text-[15px] font-semibold text-[var(--ink)]">
                {t('profile.lguWorkspace')}
              </span>
            </div>
            <ChevronRight size={17} className="text-[var(--sub)]" />
          </Link>
        </section>

        {/* Log Out Button */}
        <button
          type="button"
          onClick={() => setConfirmLogout(true)}
          className="ag-card flex min-h-[54px] w-full items-center justify-center gap-2 text-[15px] font-bold text-[var(--avoid-text)] transition hover:border-[var(--avoid-border)]"
        >
          <LogOut size={18} />
          <span>{t('profile.logout')}</span>
        </button>
      </div>

      {/* Log Out Confirmation Modal */}
      {confirmLogout && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="w-full max-w-md rounded-t-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl sm:rounded-[28px]"
            style={{ paddingBottom: 'max(20px, var(--safe-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[var(--ink)]">{t('profile.logoutConfirm')}</h2>
            <p className="mt-1.5 text-sm text-[var(--sub)]">
              You will be signed out of Agapay on this device. Your saved Supabase data remains
              safe.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="min-h-[50px] flex-1 rounded-full border border-[var(--border)] text-sm font-bold text-[var(--ink)]"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[50px] flex-1 rounded-full bg-[var(--avoid-border)] text-sm font-bold text-white"
              >
                {t('profile.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
