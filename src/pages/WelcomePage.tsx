import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  LogIn,
  MessageSquareText,
  Moon,
  Sun,
} from 'lucide-react';
import { AgapayLogo } from '../components/AgapayLogo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppStateContext';

export function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resolved, toggle } = useTheme();
  const { isAuthenticated, authUser } = useAppState();

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[var(--bg)] text-[var(--ink)]">
      {/* Subtle topographic field contour lines from Figma 01 Welcome */}
      <img
        src="/assets/logo/field-lines.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg select-none opacity-65 dark:opacity-20"
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-between px-5 pt-safe pb-safe">
        {/* Top bar: Language switcher + Dark/Light toggle */}
        <header className="flex items-center justify-between pt-2">
          <LanguageSwitcher variant="pill" />
          <button
            type="button"
            onClick={toggle}
            aria-label={t('profile.darkMode')}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] shadow-xs transition hover:border-[var(--accent)]"
          >
            {resolved === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </header>

        {/* Center Brand Hero */}
        <section className="my-auto flex flex-col items-center py-6 text-center">
          <AgapayLogo size="lg" />
          <h1 className="font-brand mt-3 text-[44px] font-semibold leading-tight tracking-[-0.02em] text-[var(--accent)]">
            {t('brand.name')}
          </h1>
          <p className="mt-1.5 text-lg font-medium text-[var(--earth)]">
            {t('brand.tagline')}
          </p>
          <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-[var(--sub)]">
            {t('brand.subtitle')}
          </p>

          {isAuthenticated && authUser?.email && (
            <div className="status-go mt-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold">
              <CheckCircle2 size={14} />
              <span>Signed in as {authUser.email}</span>
            </div>
          )}
        </section>

        {/* Bottom Primary & Secondary Actions */}
        <footer className="space-y-2.5 pb-3">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[17px] font-semibold text-[var(--on-accent)] shadow-md transition active:scale-[0.99] hover:bg-[var(--accent-deep)]"
            >
              <span>{t('onboarding.goToHome')}</span>
              <ArrowRight size={20} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/onboarding')}
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[17px] font-semibold text-[var(--on-accent)] shadow-md transition active:scale-[0.99] hover:bg-[var(--accent-deep)]"
              >
                <span>{t('welcome.getStarted')}</span>
                <ArrowRight size={20} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 px-5 text-[15px] font-bold text-[var(--ink)] backdrop-blur-xs transition hover:border-[var(--accent)]"
              >
                <LogIn size={17} className="text-[var(--accent)]" />
                <span>Sign in to existing account</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => navigate('/sms-preview')}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-[var(--earth)] transition hover:bg-[var(--surface-muted)]"
          >
            <MessageSquareText size={18} />
            <span>{t('welcome.useSms')}</span>
          </button>

          <div className="flex items-center justify-center gap-4 pt-0.5 text-center">
            <button
              type="button"
              onClick={() => navigate('/lgu')}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[var(--sub)] transition hover:text-[var(--accent)]"
            >
              <Building2 size={14} />
              <span>{t('welcome.lguAccess')}</span>
            </button>

            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="inline-flex min-h-[40px] items-center rounded-full px-3 text-xs font-semibold text-[var(--sub)] underline transition hover:text-[var(--ink)]"
              >
                Preview offline
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
