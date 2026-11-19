import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WOVEN_EASE } from '../lib/motion';

const SPLASH_SESSION_KEY = 'agapay_splash_seen_v1';
const REPLAY_EVENT = 'agapay:replay-splash';

/**
 * Triggers a clean on-demand replay of the opening splash (e.g., from Profile).
 */
export function replayAgapaySplash() {
  try {
    sessionStorage.removeItem(SPLASH_SESSION_KEY);
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new CustomEvent(REPLAY_EVENT));
}

function shouldShowInitialSplash(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_SESSION_KEY) !== '1';
  } catch {
    return false;
  }
}

/**
 * Opening "Woven Threads of Agapay" splash screen.
 * Exact official SVG paths from Agapay_Logo_Grip:
 *  - 0.0s–1.2s: Supportive hands weave onto canvas, flowing seamlessly into the circle & mountain ridges
 *  - 1.2s–1.6s: Soft fills unify with a subtle scale settle & Agapay wordmark reveal
 *  - 1.6s–2.0s: Silky GPU exit (opacity + scale) into the staggered main screen
 */
export function SplashScreen() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState<boolean>(shouldShowInitialSplash);

  const dismiss = () => {
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  };

  useEffect(() => {
    const onReplay = () => setVisible(true);
    window.addEventListener(REPLAY_EVENT, onReplay);
    return () => window.removeEventListener(REPLAY_EVENT, onReplay);
  }, []);

  useEffect(() => {
    if (!visible) return;
    // Total choreography: 1.65s active + 0.35s exit = 2.0s (shorter for reduced-motion)
    const timer = window.setTimeout(
      () => {
        dismiss();
      },
      prefersReducedMotion ? 650 : 1680
    );
    return () => window.clearTimeout(timer);
  }, [visible, prefersReducedMotion]);

  const drawTransition = (delay: number, duration: number) =>
    prefersReducedMotion
      ? { duration: 0.01 }
      : {
          pathLength: { delay, duration, ease: WOVEN_EASE },
          opacity: { delay, duration: 0.12 },
        };

  const fillTransition = (delay: number) =>
    prefersReducedMotion
      ? { duration: 0.15 }
      : {
          delay,
          duration: 0.38,
          ease: WOVEN_EASE,
        };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="agapay-splash"
          role="dialog"
          aria-modal="true"
          aria-label="Agapay opening screen"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: prefersReducedMotion ? 1 : 1.03,
            transition: { duration: 0.34, ease: WOVEN_EASE },
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[var(--bg)] px-6 pt-safe pb-safe text-[var(--ink)]"
        >
          {/* Subtle woven contour field lines in background */}
          <motion.img
            src="/assets/logo/field-lines.svg"
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 0.55, y: 0 }}
            transition={{ duration: 0.9, ease: WOVEN_EASE }}
            className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg select-none dark:opacity-20"
          />

          {/* Top Skip button (accessible >=44px target) */}
          <div className="relative z-10 flex w-full max-w-md justify-end pt-2">
            <motion.button
              type="button"
              onClick={dismiss}
              whileTap={{ scale: 0.95 }}
              className="min-h-[44px] rounded-full border border-[var(--border)] bg-[var(--surface)]/85 px-4 text-xs font-bold text-[var(--sub)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]"
            >
              Skip
            </motion.button>
          </div>

          {/* Center Woven Emblem + Wordmark */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-center"
            initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.95, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.15, duration: 0.45, ease: WOVEN_EASE }}
          >
            <svg
              viewBox="0 0 280 245"
              className="h-[205px] w-[235px] sm:h-[225px] sm:w-[258px]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Agapay hands cradling mountains logo"
              role="img"
            >
              <defs>
                <clipPath id="agapay-splash-circle">
                  <circle cx="140" cy="121.33" r="70" />
                </clipPath>
              </defs>

              {/* LAYER 1: Mountain Circle Fills (fade in softly at 1.2s–1.55s) */}
              <g clipPath="url(#agapay-splash-circle)" transform="translate(59.29, 51.33)">
                <motion.path
                  d="M80.7083 140C119.368 140 150.708 108.66 150.708 70C150.708 31.3401 119.368 0 80.7083 0C42.0484 0 10.7083 31.3401 10.7083 70C10.7083 108.66 42.0484 140 80.7083 140Z"
                  fill="#F3ECD5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={fillTransition(1.12)}
                />
                <motion.path
                  d="M1.375 72.3333L34.0417 49L52.7083 59.5L83.0416 32.6667L118.042 59.5L136.708 52.5L160.042 70V149.333H1.375V72.3333Z"
                  fill="#527853"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={fillTransition(1.18)}
                />
                <motion.path
                  d="M3.70833 112L29.375 79.3333L57.375 100.333L41.0416 135.333H3.70833V112Z"
                  fill="#9EAE8B"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={fillTransition(1.22)}
                />
                <motion.path
                  d="M99.375 100.333L125.042 79.3333L155.375 105L146.042 140H99.375V100.333Z"
                  fill="#9EAE8B"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={fillTransition(1.22)}
                />
                <motion.path
                  d="M29.375 137.667L73.7084 67.6667L113.375 102.667L132.042 144.667H29.375V137.667Z"
                  fill="#9EAE8B"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={fillTransition(1.24)}
                />
                <motion.path
                  d="M8.375 126L25.875 98L69.0417 137.667L38.7083 151.667L8.375 140V126Z"
                  fill="#634B3E"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={fillTransition(1.26)}
                />
                <motion.path
                  d="M85.3751 121.333L125.042 105L148.375 133L111.042 151.667L85.3751 137.667V121.333Z"
                  fill="#634B3E"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={fillTransition(1.26)}
                />
                <motion.path
                  d="M38.7083 147L79.5417 101.5L120.375 147H38.7083Z"
                  fill="#A68164"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={fillTransition(1.28)}
                />

                {/* Woven Mountain Ridge Thread Strokes (0.48s–1.20s) */}
                <motion.path
                  d="M1.375 72.3333L34.0417 49L52.7083 59.5L83.0416 32.6667L118.042 59.5L136.708 52.5L160.042 70"
                  stroke="#2E4234"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.46, 0.56)}
                />
                <motion.path
                  d="M3.70833 112L29.375 79.3333L57.375 100.333"
                  stroke="#2E4234"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.58, 0.45)}
                />
                <motion.path
                  d="M99.375 100.333L125.042 79.3333L155.375 105"
                  stroke="#2E4234"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.62, 0.45)}
                />
                <motion.path
                  d="M29.375 137.667L73.7084 67.6667L113.375 102.667L132.042 144.667"
                  stroke="#2E4234"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.68, 0.48)}
                />
                <motion.path
                  d="M73.7083 67.6667L99.375 128.333"
                  stroke="#2E4234"
                  strokeWidth="2.42"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.76, 0.36)}
                />
                <motion.path
                  d="M8.375 126L25.875 98L69.0417 137.667M29.375 79.3333L17.7083 130.667"
                  stroke="#2E4234"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.8, 0.38)}
                />
                <motion.path
                  d="M85.3751 121.333L125.042 105L148.375 133M125.042 79.3333L105.208 124.833"
                  stroke="#2E4234"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.84, 0.36)}
                />
                <motion.path
                  d="M38.7083 147L79.5417 101.5L120.375 147"
                  stroke="#2E4234"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.88, 0.32)}
                />
              </g>

              {/* LAYER 2: Outer Circle Ring (weaves smoothly from hand tips 0.36s–1.05s) */}
              <g transform="translate(68.42, 49.75)">
                <motion.path
                  d="M141.58 71.58C141.58 110.24 110.24 141.58 71.58 141.58C32.9201 141.58 1.58 110.24 1.58 71.58C1.58 32.9201 32.9201 1.58 71.58 1.58C110.24 1.58 141.58 32.9201 141.58 71.58Z"
                  stroke="#2E4234"
                  strokeWidth="3.16"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.36, 0.68)}
                />
              </g>

              {/* LAYER 3: Supportive Hands (weave FIRST 0.00s–0.72s, then warm fill at 1.15s) */}
              <g transform="translate(45.4, 90.8) scale(0.97)">
                <motion.path
                  d="M25.7909 1.375C32.7909 1.375 35.1242 15.375 31.6243 31.7083C29.2909 42.2084 26.9576 49.2084 28.7076 55.0417C32.0044 63.6247 36.9599 71.4742 43.2909 78.1417C46.7909 72.5417 54.9576 74.875 55.5409 82.4584C59.6242 78.375 67.7909 80.7084 68.3742 88.875C72.4575 85.375 80.6242 87.7084 81.2075 95.875C86.4575 97.0417 87.6242 106.375 79.4575 111.042C63.1242 118.042 37.4576 114.542 17.6243 99.375C1.29096 85.375 -2.20904 63.2084 4.79096 36.375C9.45762 17.7083 17.6243 1.375 25.7909 1.375Z"
                  fill="#E5D8BF"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={fillTransition(1.16)}
                />
                <motion.path
                  d="M25.7909 1.375C32.7909 1.375 35.1242 15.375 31.6243 31.7083C29.2909 42.2084 26.9576 49.2084 28.7076 55.0417C32.0044 63.6247 36.9599 71.4742 43.2909 78.1417C46.7909 72.5417 54.9576 74.875 55.5409 82.4584C59.6242 78.375 67.7909 80.7084 68.3742 88.875C72.4575 85.375 80.6242 87.7084 81.2075 95.875C86.4575 97.0417 87.6242 106.375 79.4575 111.042C63.1242 118.042 37.4576 114.542 17.6243 99.375C1.29096 85.375 -2.20904 63.2084 4.79096 36.375C9.45762 17.7083 17.6243 1.375 25.7909 1.375Z"
                  stroke="#2E4234"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.0, 0.68)}
                />
                <motion.path
                  d="M28.7076 55.0418C21.1243 64.3751 19.9576 76.0418 26.9576 86.5418M55.541 82.4584C51.4577 90.0417 47.9577 97.0417 42.1243 101.708M68.3743 88.8751C65.4576 95.8751 61.9576 101.708 57.2909 106.375"
                  stroke="#2E4234"
                  strokeWidth="1.82"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.36, 0.42)}
                />
              </g>

              <g transform="translate(150.5, 90.8) scale(0.97)">
                <motion.path
                  d="M60.9501 1.375C53.9501 1.375 51.6168 15.375 55.1168 31.7083C57.4501 42.2084 59.7835 49.2084 58.0335 55.0417C54.7366 63.6247 49.7812 71.4742 43.4502 78.1417C39.9502 72.5417 31.7835 74.875 31.2002 82.4584C27.1168 78.375 18.9502 80.7084 18.3669 88.875C14.2835 85.375 6.11687 87.7084 5.53354 95.875C0.283547 97.0417 -0.883119 106.375 7.28354 111.042C23.6169 118.042 49.2835 114.542 69.1168 99.375C85.4501 85.375 88.9501 63.2084 81.9501 36.375C77.2834 17.7083 69.1168 1.375 60.9501 1.375Z"
                  fill="#E5D8BF"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={fillTransition(1.16)}
                />
                <motion.path
                  d="M60.9501 1.375C53.9501 1.375 51.6168 15.375 55.1168 31.7083C57.4501 42.2084 59.7835 49.2084 58.0335 55.0417C54.7366 63.6247 49.7812 71.4742 43.4502 78.1417C39.9502 72.5417 31.7835 74.875 31.2002 82.4584C27.1168 78.375 18.9502 80.7084 18.3669 88.875C14.2835 85.375 6.11687 87.7084 5.53354 95.875C0.283547 97.0417 -0.883119 106.375 7.28354 111.042C23.6169 118.042 49.2835 114.542 69.1168 99.375C85.4501 85.375 88.9501 63.2084 81.9501 36.375C77.2834 17.7083 69.1168 1.375 60.9501 1.375Z"
                  stroke="#2E4234"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.06, 0.68)}
                />
                <motion.path
                  d="M58.0336 55.0416C65.6169 64.375 66.7836 76.0416 59.7836 86.5417M31.2002 82.4584C35.2836 90.0417 38.7836 97.0417 44.6169 101.708M18.3669 88.8751C21.2836 95.8751 24.7836 101.708 29.4502 106.375"
                  stroke="#2E4234"
                  strokeWidth="1.82"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawTransition(0.4, 0.42)}
                />
              </g>
            </svg>

            {/* Wordmark & Tagline reveal (1.18s–1.58s) */}
            <motion.h1
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.16, duration: 0.4, ease: WOVEN_EASE }}
              className="font-brand mt-1 text-[42px] font-semibold leading-tight tracking-[-0.02em] text-[var(--accent)]"
            >
              {t('brand.name')}
            </motion.h1>

            <motion.p
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.28, duration: 0.36, ease: WOVEN_EASE }}
              className="mt-1 text-base font-medium text-[var(--earth)]"
            >
              {t('brand.tagline')}
            </motion.p>
          </motion.div>

          {/* Bottom spacer for optical balance */}
          <div className="h-10" aria-hidden="true" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
