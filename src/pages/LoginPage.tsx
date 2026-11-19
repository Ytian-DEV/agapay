import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, LogIn } from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { AgapayLogo } from '../components/AgapayLogo';
import { WovenThreadLoader } from '../components/WovenThreadLoader';
import { TACTILE_TAP } from '../lib/motion';
import { useAppState } from '../context/AppStateContext';
import { isSupabaseConfigured } from '../lib/supabase';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn } = useAppState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Sign in failed. Please check your email and password.');
      return;
    }
    navigate('/home');
  };

  return (
    <MobileShell showTabs={false}>
      <header className="flex items-center gap-3 pb-4 pt-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label={t('common.back')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-semibold text-[var(--sub)]">{t('auth.accountSub')}</p>
          <h1 className="text-2xl font-bold text-[var(--ink)]">{t('auth.signIn')}</h1>
        </div>
      </header>

      <div className="flex flex-col items-center pb-5 pt-2 text-center">
        <AgapayLogo size="auth" />
        <p className="font-brand mt-2 text-3xl font-semibold tracking-wide text-[var(--accent)]">
          AGAPAY
        </p>
        <p className="mt-0.5 text-xs font-medium text-[var(--earth)]">
          {t('brand.tagline')}
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="status-wait mb-4 flex items-start gap-2.5 rounded-2xl p-3.5 text-xs font-semibold">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Supabase env vars (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`) are not set in this
            build.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ag-card space-y-4 p-5">
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-bold uppercase tracking-wider text-[var(--sub)]"
          >
            {t('auth.emailLabel')}
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="farmer@example.com"
            className="mt-1.5 min-h-[50px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 text-base font-semibold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-bold uppercase tracking-wider text-[var(--sub)]"
          >
            {t('auth.passwordLabel')}
          </label>
          <input
            id="login-password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1.5 min-h-[50px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 text-base font-semibold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {errorMsg && (
          <div className="status-avoid flex items-start gap-2 rounded-xl p-3 text-xs font-bold">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <motion.button
          type="submit"
          whileTap={TACTILE_TAP}
          disabled={loading || !email || password.length < 6}
          className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-base font-bold text-[var(--on-accent)] shadow-sm transition disabled:opacity-50"
        >
          {loading ? <WovenThreadLoader size="sm" /> : <LogIn size={19} />}
          <span>{loading ? t('auth.signingIn') : t('auth.signIn')}</span>
        </motion.button>
      </form>

      <p className="mt-5 text-center text-sm text-[var(--sub)]">
        {t('auth.newToAgapay')}{' '}
        <Link to="/onboarding" className="font-bold text-[var(--accent)] underline">
          {t('auth.createAccount')}
        </Link>
      </p>
    </MobileShell>
  );
}
