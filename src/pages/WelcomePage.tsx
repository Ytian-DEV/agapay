import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Building2, MessageSquareText, Moon, Sun } from 'lucide-react';
import { AgapayLogo } from '../components/AgapayLogo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppStateContext';

export function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resolved, toggle } = useTheme();
  const { hasCompletedOnboarding } = useAppState();

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
        <section className="my-auto flex flex-col items-center py-8 text-center">
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
        </section>

        {/* Bottom Primary & Secondary Actions */}
        <footer className="space-y-2.5 pb-3">
          <button
            type="button"
            onClick={() => navigate(hasCompletedOnboarding ? '/home' : '/onboarding')}
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[17px] font-semibold text-[var(--on-accent)] shadow-md transition active:scale-[0.99] hover:bg-[var(--accent-deep)]"
          >
            <span>{t('welcome.getStarted')}</span>
            <ArrowRight size={20} />
          </button>

          {!hasCompletedOnboarding && (
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="flex min-h-[48px] w-full items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-5 text-[15px] font-semibold text-[var(--ink)] backdrop-blur-xs transition hover:border-[var(--accent)]"
            >
              Preview Baybay City Farmer Home
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/sms-preview')}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-[var(--earth)] transition hover:bg-[var(--surface-muted)]"
          >
            <MessageSquareText size={18} />
            <span>{t('welcome.useSms')}</span>
          </button>

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => navigate('/lgu')}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[var(--sub)] transition hover:text-[var(--accent)]"
            >
              <Building2 size={15} />
              <span>{t('welcome.lguAccess')}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
