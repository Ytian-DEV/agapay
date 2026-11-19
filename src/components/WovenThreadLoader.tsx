import { motion } from 'framer-motion';
import { WOVEN_EASE } from '../lib/motion';

interface WovenThreadLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZE_PX = {
  sm: 20,
  md: 36,
  lg: 54,
};

/**
 * Lightweight 60fps inline loader echoing the Agapay woven hands & mountain ridge motif.
 * Uses pure SVG pathLength/pathOffset + GPU opacity — zero layout thrashing.
 */
export function WovenThreadLoader({
  size = 'md',
  label,
  className = '',
}: WovenThreadLoaderProps) {
  const px = SIZE_PX[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center justify-center gap-2.5 ${className}`}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Subtle base circle track */}
        <circle
          cx="24"
          cy="24"
          r="19"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeOpacity="0.16"
        />

        {/* Woven cradling hands arc + mountain ridge continuous thread */}
        <motion.path
          d="M9 28 C12 37, 20 41, 24 41 C28 41, 36 37, 39 28 C39 18, 32 9, 24 9 C16 9, 9 18, 9 28 Z"
          stroke="var(--accent)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0.25, pathOffset: 0 }}
          animate={{
            pathLength: [0.25, 0.72, 0.25],
            pathOffset: [0, 0.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: WOVEN_EASE,
          }}
        />

        {/* Inner mountain ridge thread */}
        <motion.path
          d="M13 28 L19.5 20.5 L24 24.5 L29.5 18.5 L35 28"
          stroke="var(--accent-sage)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.4 }}
          animate={{
            pathLength: [0, 1, 1, 0],
            opacity: [0.4, 1, 1, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: WOVEN_EASE,
          }}
        />
      </svg>

      {label && (
        <span className="text-xs font-semibold text-[var(--sub)]">{label}</span>
      )}
    </div>
  );
}
