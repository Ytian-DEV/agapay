import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { WOVEN_EASE } from '../lib/motion';

const SPLASH_SESSION_KEY = 'agapay_splash_seen_v3';
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

function getPrefersReducedMotionSync(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Plays once on every fresh app launch or explicit page reload, and NEVER interrupts
 * in-app tab/route navigation or browser tab switching.
 */
export function shouldShowInitialSplash(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const navEntries = performance.getEntriesByType?.('navigation') as
      | PerformanceNavigationTiming[]
      | undefined;
    const navType = navEntries?.[0]?.type;
    // Always play on fresh open or explicit browser reload so opening/reloading shows the logo weave
    if (navType === 'reload' || navType === 'navigate') {
      return true;
    }
    return sessionStorage.getItem(SPLASH_SESSION_KEY) !== '1';
  } catch {
    return true;
  }
}

interface SplashScreenProps {
  /** Fired right as the splash starts parting/fading out so dashboard cards stagger in seamlessly. */
  onExitStart?: () => void;
}

/**
 * Opening "Woven Threads of Agapay" Splash Screen (60fps GPU-composited + SVG pathLength):
 *  - 0.00s – 1.20s (Thread Weaving): High-contrast organic abaca/rice threads glide onto the
 *    canvas, weaving first into the supportive cradling hands, then seamlessly ascending into
 *    the circular ring and layered mountain peaks/ridges.
 *  - 1.20s – 1.60s (Unification): Completed hands and mountains settle together with a subtle
 *    scale-in and warm brand fill bloom, revealing the Agapay wordmark and tagline.
 *  - 1.60s – 2.00s (Seamless Exit): Smooth GPU-only parting fade reveals staggered app cards.
 */
export function SplashScreen({ onExitStart }: SplashScreenProps) {
  const { t } = useTranslation();
  const { resolved } = useTheme();

  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    getPrefersReducedMotionSync
  );
  const [visible, setVisible] = useState<boolean>(shouldShowInitialSplash);
  const [playKey, setPlayKey] = useState<number>(1);
  const [started, setStarted] = useState<boolean>(false);
  const [forceFullMotion, setForceFullMotion] = useState<boolean>(false);

  const onExitStartRef = useRef(onExitStart);
  onExitStartRef.current = onExitStart;

  const isReduced = prefersReducedMotion && !forceFullMotion;
  const isDark = resolved === 'dark';

  // High-contrast woven thread palette so every stroke reads sharply on both Light & Dark canvases
  const handThreadStroke = isDark ? '#F0E3CA' : '#2E4234';
  const ringThreadStroke = isDark ? '#7CE0AA' : '#3A5A40';
  const mountainThreadStroke = isDark ? '#9AE8BD' : '#527853';
  const earthThreadStroke = isDark ? '#DFB491' : '#6C584C';

  // Listen for live OS reduced-motion preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    } catch {
      // ignore storage errors
    }
    onExitStartRef.current?.();
    setVisible(false);
    setStarted(false);
    setForceFullMotion(false);
  }, []);

  // If splash is skipped on mount, notify parent immediately so content renders right away
  useEffect(() => {
    if (!visible) {
      onExitStartRef.current?.();
    }
  }, [visible]);

  useEffect(() => {
    const onReplay = () => {
      setForceFullMotion(true);
      setStarted(false);
      setPlayKey((k) => k + 1);
      setVisible(true);
    };
    window.addEventListener(REPLAY_EVENT, onReplay);
    return () => window.removeEventListener(REPLAY_EVENT, onReplay);
  }, []);

  // Wait for two animation frames after mount so cold-boot hydration/paint never eats the start of the weave
  useEffect(() => {
    if (!visible) return;
    setStarted(false);
    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setStarted(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [visible, playKey]);

  // Start the choreography dismiss clock ONLY after first paint (`started === true`)
  useEffect(() => {
    if (!visible || !started) return;
    // 1.66s weave + unify, then 0.36s seamless parting exit ≈ 2.02s visible on screen
    const timer = window.setTimeout(
      () => {
        dismiss();
      },
      isReduced ? 850 : 1660
    );
    return () => window.clearTimeout(timer);
  }, [visible, started, playKey, isReduced, dismiss]);

  const drawThread = (delay: number, duration: number) =>
    isReduced
      ? { duration: 0.01 }
      : {
          pathLength: { delay, duration, ease: WOVEN_EASE },
          opacity: { delay, duration: 0.08 },
        };

  const bloomFill = (delay: number) =>
    isReduced
      ? { duration: 0.22 }
      : {
          delay,
          duration: 0.38,
          ease: WOVEN_EASE,
        };

  // Animation states: while `!started` (first ~32ms before paint), hold cleanly at start state
  const threadInitial = isReduced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 };
  const threadAnimate =
    isReduced || started ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 };

  const fillInitial = isReduced ? { opacity: 1 } : { opacity: 0 };
  const fillAnimate = isReduced || started ? { opacity: 1 } : { opacity: 0 };

  return (
    <MotionConfig reducedMotion={forceFullMotion ? 'never' : 'user'}>
      <AnimatePresence>
        {visible && (
          <motion.div
            key={`agapay-splash-${playKey}`}
            role="dialog"
            aria-modal="true"
            aria-label="Agapay opening animation"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.36, ease: WOVEN_EASE },
            }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[var(--bg)] px-6 pt-safe pb-safe text-[var(--ink)]"
          >
            {/* Subtle parting upper & lower atmospheric veils on exit (GPU transform + opacity only) */}
            {!isReduced && (
              <>
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[var(--bg)]"
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: 0, opacity: 0 }}
                  exit={{
                    y: '-18%',
                    opacity: 0.7,
                    transition: { duration: 0.36, ease: WOVEN_EASE },
                  }}
                />
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[var(--bg)]"
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: 0, opacity: 0 }}
                  exit={{
                    y: '18%',
                    opacity: 0.7,
                    transition: { duration: 0.36, ease: WOVEN_EASE },
                  }}
                />
              </>
            )}

            {/* Subtle woven field contour lines at bottom */}
            <motion.img
              src="/assets/logo/field-lines.svg"
              alt=""
              aria-hidden="true"
              initial={{ opacity: 0, y: 14 }}
              animate={started ? { opacity: isDark ? 0.24 : 0.6, y: 0 } : { opacity: 0, y: 14 }}
              exit={{ opacity: 0, y: 12, transition: { duration: 0.3, ease: WOVEN_EASE } }}
              transition={{ duration: 0.9, ease: WOVEN_EASE }}
              className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg select-none"
            />

            {/* Top Skip Control (>=44px accessible touch target) */}
            <div className="relative z-10 flex w-full max-w-md justify-end pt-2">
              <motion.button
                type="button"
                onClick={dismiss}
                whileTap={{ scale: 0.96 }}
                className="min-h-[44px] rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-4 text-xs font-bold text-[var(--sub)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]"
              >
                Skip
              </motion.button>
            </div>

            {/* Center Woven Threads -> Official Agapay Emblem */}
            <motion.div
              className="relative z-10 flex flex-col items-center text-center"
              initial={isReduced ? { opacity: 0 } : { scale: 0.94, opacity: 1 }}
              animate={
                isReduced
                  ? { opacity: 1 }
                  : started
                    ? { scale: 1, opacity: 1 }
                    : { scale: 0.94, opacity: 1 }
              }
              exit={
                isReduced
                  ? { opacity: 0 }
                  : {
                      scale: 1.04,
                      opacity: 0,
                      y: -8,
                      transition: { duration: 0.36, ease: WOVEN_EASE },
                    }
              }
              transition={{
                delay: isReduced ? 0 : 1.16,
                duration: isReduced ? 0.28 : 0.42,
                ease: WOVEN_EASE,
              }}
            >
              <svg
                viewBox="-24 0 328 245"
                className="h-[224px] w-[300px] sm:h-[250px] sm:w-[334px]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Agapay woven threads logo animation"
                role="img"
              >
                <defs>
                  {/* Exact circle clip in root SVG space matching Circle_Outer_Ring center (140, 121.33) */}
                  <clipPath id={`agapay-splash-circle-${playKey}`}>
                    <circle cx="140" cy="121.33" r="70" />
                  </clipPath>
                </defs>

                {/* PHASE 0 (0.00s – 0.42s): Incoming organic abaca/rice threads gliding from edges into the hands */}
                {!isReduced && (
                  <g>
                    <motion.path
                      d="M-22 192 C 8 190, 26 174, 49 144"
                      stroke={handThreadStroke}
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={
                        started
                          ? { pathLength: 1, opacity: [0.95, 0.95, 0] }
                          : { pathLength: 0, opacity: 0 }
                      }
                      transition={{
                        pathLength: { delay: 0.0, duration: 0.4, ease: WOVEN_EASE },
                        opacity: { delay: 0.0, duration: 0.88, times: [0, 0.56, 1] },
                      }}
                    />
                    <motion.path
                      d="M-16 206 C 18 202, 42 194, 68 188"
                      stroke={earthThreadStroke}
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={
                        started
                          ? { pathLength: 1, opacity: [0.85, 0.85, 0] }
                          : { pathLength: 0, opacity: 0 }
                      }
                      transition={{
                        pathLength: { delay: 0.05, duration: 0.42, ease: WOVEN_EASE },
                        opacity: { delay: 0.05, duration: 0.86, times: [0, 0.56, 1] },
                      }}
                    />
                    <motion.path
                      d="M302 192 C 272 190, 254 174, 231 144"
                      stroke={handThreadStroke}
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={
                        started
                          ? { pathLength: 1, opacity: [0.95, 0.95, 0] }
                          : { pathLength: 0, opacity: 0 }
                      }
                      transition={{
                        pathLength: { delay: 0.02, duration: 0.4, ease: WOVEN_EASE },
                        opacity: { delay: 0.02, duration: 0.88, times: [0, 0.56, 1] },
                      }}
                    />
                    <motion.path
                      d="M296 206 C 262 202, 238 194, 212 188"
                      stroke={earthThreadStroke}
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={
                        started
                          ? { pathLength: 1, opacity: [0.85, 0.85, 0] }
                          : { pathLength: 0, opacity: 0 }
                      }
                      transition={{
                        pathLength: { delay: 0.07, duration: 0.42, ease: WOVEN_EASE },
                        opacity: { delay: 0.07, duration: 0.86, times: [0, 0.56, 1] },
                      }}
                    />
                    {/* Seamless rising threads bridging hands -> mountain ridges (0.30s – 0.66s) */}
                    <motion.path
                      d="M71 96 C 78 78, 92 64, 114 57"
                      stroke={ringThreadStroke}
                      strokeWidth="2"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={
                        started
                          ? { pathLength: 1, opacity: [0.9, 0.9, 0] }
                          : { pathLength: 0, opacity: 0 }
                      }
                      transition={{
                        pathLength: { delay: 0.3, duration: 0.34, ease: WOVEN_EASE },
                        opacity: { delay: 0.3, duration: 0.72, times: [0, 0.52, 1] },
                      }}
                    />
                    <motion.path
                      d="M209 96 C 202 78, 188 64, 166 57"
                      stroke={ringThreadStroke}
                      strokeWidth="2"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={
                        started
                          ? { pathLength: 1, opacity: [0.9, 0.9, 0] }
                          : { pathLength: 0, opacity: 0 }
                      }
                      transition={{
                        pathLength: { delay: 0.32, duration: 0.34, ease: WOVEN_EASE },
                        opacity: { delay: 0.32, duration: 0.72, times: [0, 0.52, 1] },
                      }}
                    />
                  </g>
                )}

                {/* LAYER 1: Mountain Circle (clipped in root SVG space, then translated into position) */}
                <g clipPath={`url(#agapay-splash-circle-${playKey})`}>
                  <g transform="translate(59.29, 51.33)">
                    {/* Brand Fills (bloom during unification phase 1.16s – 1.56s) */}
                    <motion.path
                      d="M80.7083 140C119.368 140 150.708 108.66 150.708 70C150.708 31.3401 119.368 0 80.7083 0C42.0484 0 10.7083 31.3401 10.7083 70C10.7083 108.66 42.0484 140 80.7083 140Z"
                      fill="#F3ECD5"
                      initial={fillInitial}
                      animate={fillAnimate}
                      transition={bloomFill(1.16)}
                    />
                    <motion.path
                      d="M1.375 72.3333L34.0417 49L52.7083 59.5L83.0416 32.6667L118.042 59.5L136.708 52.5L160.042 70V149.333H1.375V72.3333Z"
                      fill="#527853"
                      initial={fillInitial}
                      animate={fillAnimate}
                      transition={bloomFill(1.2)}
                    />
                    <motion.path
                      d="M3.70833 112L29.375 79.3333L57.375 100.333L41.0416 135.333H3.70833V112Z"
                      fill="#9EAE8B"
                      initial={fillInitial}
                      animate={fillAnimate}
                      transition={bloomFill(1.23)}
                    />
                    <motion.path
                      d="M99.375 100.333L125.042 79.3333L155.375 105L146.042 140H99.375V100.333Z"
                      fill="#9EAE8B"
                      initial={fillInitial}
                      animate={fillAnimate}
                      transition={bloomFill(1.23)}
                    />
                    <motion.path
                      d="M29.375 137.667L73.7084 67.6667L113.375 102.667L132.042 144.667H29.375V137.667Z"
                      fill="#9EAE8B"
                      initial={fillInitial}
                      animate={fillAnimate}
                      transition={bloomFill(1.25)}
                    />
                    <motion.path
                      d="M8.375 126L25.875 98L69.0417 137.667L38.7083 151.667L8.375 140V126Z"
                      fill="#634B3E"
                      initial={fillInitial}
                      animate={fillAnimate}
                      transition={bloomFill(1.27)}
                    />
                    <motion.path
                      d="M85.3751 121.333L125.042 105L148.375 133L111.042 151.667L85.3751 137.667V121.333Z"
                      fill="#634B3E"
                      initial={fillInitial}
                      animate={fillAnimate}
                      transition={bloomFill(1.27)}
                    />
                    <motion.path
                      d="M38.7083 147L79.5417 101.5L120.375 147H38.7083Z"
                      fill="#A68164"
                      initial={fillInitial}
                      animate={fillAnimate}
                      transition={bloomFill(1.29)}
                    />

                    {/* High-contrast Woven Mountain Ridge Threads (draw seamlessly 0.42s – 1.18s) */}
                    {!isReduced && (
                      <>
                        <motion.path
                          d="M1.375 72.3333L34.0417 49L52.7083 59.5L83.0416 32.6667L118.042 59.5L136.708 52.5L160.042 70"
                          stroke={mountainThreadStroke}
                          strokeWidth="3.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={threadInitial}
                          animate={threadAnimate}
                          transition={drawThread(0.42, 0.56)}
                        />
                        <motion.path
                          d="M3.70833 112L29.375 79.3333L57.375 100.333"
                          stroke={mountainThreadStroke}
                          strokeWidth="2.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={threadInitial}
                          animate={threadAnimate}
                          transition={drawThread(0.54, 0.44)}
                        />
                        <motion.path
                          d="M99.375 100.333L125.042 79.3333L155.375 105"
                          stroke={mountainThreadStroke}
                          strokeWidth="2.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={threadInitial}
                          animate={threadAnimate}
                          transition={drawThread(0.58, 0.44)}
                        />
                        <motion.path
                          d="M29.375 137.667L73.7084 67.6667L113.375 102.667L132.042 144.667"
                          stroke={ringThreadStroke}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={threadInitial}
                          animate={threadAnimate}
                          transition={drawThread(0.64, 0.48)}
                        />
                        <motion.path
                          d="M73.7083 67.6667L99.375 128.333"
                          stroke={earthThreadStroke}
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          initial={threadInitial}
                          animate={threadAnimate}
                          transition={drawThread(0.74, 0.36)}
                        />
                        <motion.path
                          d="M29.375 79.3333L17.7083 130.667"
                          stroke={earthThreadStroke}
                          strokeWidth="2.3"
                          strokeLinecap="round"
                          initial={threadInitial}
                          animate={threadAnimate}
                          transition={drawThread(0.76, 0.34)}
                        />
                        <motion.path
                          d="M125.042 79.3333L105.208 124.833"
                          stroke={earthThreadStroke}
                          strokeWidth="2.3"
                          strokeLinecap="round"
                          initial={threadInitial}
                          animate={threadAnimate}
                          transition={drawThread(0.78, 0.34)}
                        />
                        <motion.path
                          d="M8.375 126L25.875 98L69.0417 137.667"
                          stroke={earthThreadStroke}
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={threadInitial}
                          animate={threadAnimate}
                          transition={drawThread(0.8, 0.34)}
                        />
                        <motion.path
                          d="M85.3751 121.333L125.042 105L148.375 133"
                          stroke={earthThreadStroke}
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={threadInitial}
                          animate={threadAnimate}
                          transition={drawThread(0.82, 0.34)}
                        />
                        <motion.path
                          d="M38.7083 147L79.5417 101.5L120.375 147"
                          stroke={earthThreadStroke}
                          strokeWidth="2.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={threadInitial}
                          animate={threadAnimate}
                          transition={drawThread(0.86, 0.32)}
                        />
                      </>
                    )}

                    {/* Final crisp brand outlines lock over the mountain fills at 1.2s */}
                    <motion.g
                      initial={fillInitial}
                      animate={fillAnimate}
                      transition={bloomFill(1.22)}
                    >
                      <path
                        d="M1.375 72.3333L34.0417 49L52.7083 59.5L83.0416 32.6667L118.042 59.5L136.708 52.5L160.042 70M3.70833 112L29.375 79.3333L57.375 100.333M99.375 100.333L125.042 79.3333L155.375 105M29.375 137.667L73.7084 67.6667L113.375 102.667L132.042 144.667M73.7083 67.6667L99.375 128.333M8.375 126L25.875 98L69.0417 137.667M29.375 79.3333L17.7083 130.667M85.3751 121.333L125.042 105L148.375 133M125.042 79.3333L105.208 124.833M38.7083 147L79.5417 101.5L120.375 147"
                        stroke="#2E4234"
                        strokeWidth="2.65"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.g>
                  </g>
                </g>

                {/* LAYER 2: Outer Circle Ring (weaves seamlessly from hand fingertips 0.34s – 1.00s) */}
                <g transform="translate(68.42, 49.75)">
                  {!isReduced && (
                    <motion.path
                      d="M141.58 71.58C141.58 110.24 110.24 141.58 71.58 141.58C32.9201 141.58 1.58 110.24 1.58 71.58C1.58 32.9201 32.9201 1.58 71.58 1.58C110.24 1.58 141.58 32.9201 141.58 71.58Z"
                      stroke={ringThreadStroke}
                      strokeWidth="3.3"
                      strokeLinecap="round"
                      initial={threadInitial}
                      animate={threadAnimate}
                      transition={drawThread(0.34, 0.66)}
                    />
                  )}
                  <motion.path
                    d="M141.58 71.58C141.58 110.24 110.24 141.58 71.58 141.58C32.9201 141.58 1.58 110.24 1.58 71.58C1.58 32.9201 32.9201 1.58 71.58 1.58C110.24 1.58 141.58 32.9201 141.58 71.58Z"
                    stroke="#2E4234"
                    strokeWidth="3.16"
                    initial={fillInitial}
                    animate={fillAnimate}
                    transition={bloomFill(1.22)}
                  />
                </g>

                {/* LAYER 3: Supportive Hands (weave FIRST 0.04s – 0.68s in luminous high-contrast threads) */}
                <g transform="translate(45.4, 90.8) scale(0.97)">
                  <motion.path
                    d="M25.7909 1.375C32.7909 1.375 35.1242 15.375 31.6243 31.7083C29.2909 42.2084 26.9576 49.2084 28.7076 55.0417C32.0044 63.6247 36.9599 71.4742 43.2909 78.1417C46.7909 72.5417 54.9576 74.875 55.5409 82.4584C59.6242 78.375 67.7909 80.7084 68.3742 88.875C72.4575 85.375 80.6242 87.7084 81.2075 95.875C86.4575 97.0417 87.6242 106.375 79.4575 111.042C63.1242 118.042 37.4576 114.542 17.6243 99.375C1.29096 85.375 -2.20904 63.2084 4.79096 36.375C9.45762 17.7083 17.6243 1.375 25.7909 1.375Z"
                    fill="#E5D8BF"
                    initial={fillInitial}
                    animate={fillAnimate}
                    transition={bloomFill(1.18)}
                  />
                  {!isReduced && (
                    <>
                      <motion.path
                        d="M25.7909 1.375C32.7909 1.375 35.1242 15.375 31.6243 31.7083C29.2909 42.2084 26.9576 49.2084 28.7076 55.0417C32.0044 63.6247 36.9599 71.4742 43.2909 78.1417C46.7909 72.5417 54.9576 74.875 55.5409 82.4584C59.6242 78.375 67.7909 80.7084 68.3742 88.875C72.4575 85.375 80.6242 87.7084 81.2075 95.875C86.4575 97.0417 87.6242 106.375 79.4575 111.042C63.1242 118.042 37.4576 114.542 17.6243 99.375C1.29096 85.375 -2.20904 63.2084 4.79096 36.375C9.45762 17.7083 17.6243 1.375 25.7909 1.375Z"
                        stroke={handThreadStroke}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={threadInitial}
                        animate={threadAnimate}
                        transition={drawThread(0.04, 0.64)}
                      />
                      <motion.path
                        d="M28.7076 55.0418C21.1243 64.3751 19.9576 76.0418 26.9576 86.5418"
                        stroke={handThreadStroke}
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        initial={threadInitial}
                        animate={threadAnimate}
                        transition={drawThread(0.3, 0.34)}
                      />
                      <motion.path
                        d="M55.541 82.4584C51.4577 90.0417 47.9577 97.0417 42.1243 101.708"
                        stroke={handThreadStroke}
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={threadInitial}
                        animate={threadAnimate}
                        transition={drawThread(0.38, 0.3)}
                      />
                      <motion.path
                        d="M68.3743 88.8751C65.4576 95.8751 61.9576 101.708 57.2909 106.375"
                        stroke={handThreadStroke}
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={threadInitial}
                        animate={threadAnimate}
                        transition={drawThread(0.44, 0.28)}
                      />
                    </>
                  )}
                  <motion.path
                    d="M25.7909 1.375C32.7909 1.375 35.1242 15.375 31.6243 31.7083C29.2909 42.2084 26.9576 49.2084 28.7076 55.0417C32.0044 63.6247 36.9599 71.4742 43.2909 78.1417C46.7909 72.5417 54.9576 74.875 55.5409 82.4584C59.6242 78.375 67.7909 80.7084 68.3742 88.875C72.4575 85.375 80.6242 87.7084 81.2075 95.875C86.4575 97.0417 87.6242 106.375 79.4575 111.042C63.1242 118.042 37.4576 114.542 17.6243 99.375C1.29096 85.375 -2.20904 63.2084 4.79096 36.375C9.45762 17.7083 17.6243 1.375 25.7909 1.375ZM28.7076 55.0418C21.1243 64.3751 19.9576 76.0418 26.9576 86.5418M55.541 82.4584C51.4577 90.0417 47.9577 97.0417 42.1243 101.708M68.3743 88.8751C65.4576 95.8751 61.9576 101.708 57.2909 106.375"
                    stroke="#2E4234"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={fillInitial}
                    animate={fillAnimate}
                    transition={bloomFill(1.22)}
                  />
                </g>

                <g transform="translate(150.5, 90.8) scale(0.97)">
                  <motion.path
                    d="M60.9501 1.375C53.9501 1.375 51.6168 15.375 55.1168 31.7083C57.4501 42.2084 59.7835 49.2084 58.0335 55.0417C54.7366 63.6247 49.7812 71.4742 43.4502 78.1417C39.9502 72.5417 31.7835 74.875 31.2002 82.4584C27.1168 78.375 18.9502 80.7084 18.3669 88.875C14.2835 85.375 6.11687 87.7084 5.53354 95.875C0.283547 97.0417 -0.883119 106.375 7.28354 111.042C23.6169 118.042 49.2835 114.542 69.1168 99.375C85.4501 85.375 88.9501 63.2084 81.9501 36.375C77.2834 17.7083 69.1168 1.375 60.9501 1.375Z"
                    fill="#E5D8BF"
                    initial={fillInitial}
                    animate={fillAnimate}
                    transition={bloomFill(1.18)}
                  />
                  {!isReduced && (
                    <>
                      <motion.path
                        d="M60.9501 1.375C53.9501 1.375 51.6168 15.375 55.1168 31.7083C57.4501 42.2084 59.7835 49.2084 58.0335 55.0417C54.7366 63.6247 49.7812 71.4742 43.4502 78.1417C39.9502 72.5417 31.7835 74.875 31.2002 82.4584C27.1168 78.375 18.9502 80.7084 18.3669 88.875C14.2835 85.375 6.11687 87.7084 5.53354 95.875C0.283547 97.0417 -0.883119 106.375 7.28354 111.042C23.6169 118.042 49.2835 114.542 69.1168 99.375C85.4501 85.375 88.9501 63.2084 81.9501 36.375C77.2834 17.7083 69.1168 1.375 60.9501 1.375Z"
                        stroke={handThreadStroke}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={threadInitial}
                        animate={threadAnimate}
                        transition={drawThread(0.08, 0.64)}
                      />
                      <motion.path
                        d="M58.0336 55.0416C65.6169 64.375 66.7836 76.0416 59.7836 86.5417"
                        stroke={handThreadStroke}
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        initial={threadInitial}
                        animate={threadAnimate}
                        transition={drawThread(0.34, 0.34)}
                      />
                      <motion.path
                        d="M31.2002 82.4584C35.2836 90.0417 38.7836 97.0417 44.6169 101.708"
                        stroke={handThreadStroke}
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={threadInitial}
                        animate={threadAnimate}
                        transition={drawThread(0.42, 0.3)}
                      />
                      <motion.path
                        d="M18.3669 88.8751C21.2836 95.8751 24.7836 101.708 29.4502 106.375"
                        stroke={handThreadStroke}
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={threadInitial}
                        animate={threadAnimate}
                        transition={drawThread(0.48, 0.28)}
                      />
                    </>
                  )}
                  <motion.path
                    d="M60.9501 1.375C53.9501 1.375 51.6168 15.375 55.1168 31.7083C57.4501 42.2084 59.7835 49.2084 58.0335 55.0417C54.7366 63.6247 49.7812 71.4742 43.4502 78.1417C39.9502 72.5417 31.7835 74.875 31.2002 82.4584C27.1168 78.375 18.9502 80.7084 18.3669 88.875C14.2835 85.375 6.11687 87.7084 5.53354 95.875C0.283547 97.0417 -0.883119 106.375 7.28354 111.042C23.6169 118.042 49.2835 114.542 69.1168 99.375C85.4501 85.375 88.9501 63.2084 81.9501 36.375C77.2834 17.7083 69.1168 1.375 60.9501 1.375ZM58.0336 55.0416C65.6169 64.375 66.7836 76.0416 59.7836 86.5417M31.2002 82.4584C35.2836 90.0417 38.7836 97.0417 44.6169 101.708M18.3669 88.8751C21.2836 95.8751 24.7836 101.708 29.4502 106.375"
                    stroke="#2E4234"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={fillInitial}
                    animate={fillAnimate}
                    transition={bloomFill(1.22)}
                  />
                </g>
              </svg>

              {/* Wordmark & Tagline reveal (1.18s – 1.58s) */}
              <motion.h1
                initial={isReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={isReduced || started ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: isReduced ? 0 : 1.18, duration: 0.4, ease: WOVEN_EASE }}
                className="font-brand mt-1 text-[44px] font-semibold leading-tight tracking-[-0.02em] text-[var(--accent)]"
              >
                {t('brand.name')}
              </motion.h1>

              <motion.p
                initial={isReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={isReduced || started ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ delay: isReduced ? 0 : 1.28, duration: 0.34, ease: WOVEN_EASE }}
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
    </MotionConfig>
  );
}
