import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import {
  pageVariants,
  staggerContainerVariants,
  staggerItemVariants,
  TACTILE_TAP,
} from '../lib/motion';

/**
 * Wraps route views with our unified horizontal woven-slide + fade transition.
 * Animates only GPU-composited transform & opacity.
 */
export function PageTransition({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered list container (staggerChildren: 0.06) so dashboard cards emerge organically.
 */
export function StaggerGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual staggered item rising into place (transform + opacity only).
 */
export function StaggerItem({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * Tactile spring button for confident outdoor taps (whileTap scale: 0.97).
 */
export function TactileButton({
  children,
  className = '',
  ...rest
}: HTMLMotionProps<'button'>) {
  return (
    <motion.button
      whileTap={TACTILE_TAP}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
