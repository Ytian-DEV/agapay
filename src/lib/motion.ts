import type { Transition, Variants } from 'framer-motion';

/**
 * Unified "Woven Threads / Organic Growth" easing curve shared across the
 * opening splash animation, page transitions, card staggers, and loaders.
 */
export const WOVEN_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const WOVEN_TRANSITION: Transition = {
  duration: 0.42,
  ease: WOVEN_EASE,
};

/**
 * Crisp, immediate tactile spring for outdoor mobile presses (GPU transform only).
 */
export const TACTILE_TAP = {
  scale: 0.97,
  transition: {
    type: 'spring' as const,
    stiffness: 520,
    damping: 30,
    mass: 0.6,
  },
};

/**
 * Horizontal woven-flow page transition (transform + opacity only -> 60fps).
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 14,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.34,
      ease: WOVEN_EASE,
    },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.2,
      ease: WOVEN_EASE,
    },
  },
};

/**
 * Staggered emergence container ("crops emerging from soil" -> staggerChildren: 0.06).
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      ease: WOVEN_EASE,
    },
  },
};
