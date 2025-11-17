/**
 * Motion utilities for accessibility
 * Respects user's prefers-reduced-motion setting
 */

import { Variants, Transition, Target } from 'framer-motion';

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get transition with reduced motion support
 */
export const getTransition = (transition: Transition): Transition => {
  if (prefersReducedMotion()) {
    return { duration: 0.01 };
  }
  return transition;
};

/**
 * Get variants with reduced motion support
 */
export const getVariants = (variants: Variants): Variants => {
  if (prefersReducedMotion()) {
    // Return variants without animations
    const reducedVariants: Variants = {};
    Object.keys(variants).forEach((key) => {
      reducedVariants[key] = {
        transition: { duration: 0.01 },
      };
    });
    return reducedVariants;
  }
  return variants;
};

/**
 * Common animation variants with reduced motion support
 */
export const motionVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: getTransition({ duration: 0.3 }),
    },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: getTransition({ duration: 0.4 }),
    },
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: getTransition({ duration: 0.4 }),
    },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: getTransition({ duration: 0.3 }),
    },
  },
};

/**
 * Get animation props with reduced motion support
 */
export const getAnimationProps = (props: {
  initial?: boolean | Target;
  animate?: Target;
  exit?: Target;
  transition?: Transition;
  whileHover?: Target;
  whileTap?: Target;
}) => {
  if (prefersReducedMotion()) {
    return {
      initial: false,
      animate: props.animate ?? {},
      transition: { duration: 0.01 },
    };
  }
  return props;
};
