import { Variants, Transition, Target } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const getTransition = (transition: Transition): Transition => {
  if (prefersReducedMotion()) {
    return { duration: 0.01 };
  }
  return transition;
};

export const getVariants = (variants: Variants): Variants => {
  if (prefersReducedMotion()) {
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

export function useMotionTransition(transition: Transition): Transition {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? { duration: 0.01 } : transition;
}

export function useMotionVariants(variants: Variants): Variants {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    const reducedVariants: Variants = {};
    Object.keys(variants).forEach((key) => {
      reducedVariants[key] = { transition: { duration: 0.01 } };
    });
    return reducedVariants;
  }

  return variants;
}

export function useAnimationProps(props: {
  initial?: boolean | Target;
  animate?: Target;
  exit?: Target;
  transition?: Transition;
  whileHover?: Target;
  whileTap?: Target;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return {
      initial: false,
      animate: props.animate ?? {},
      transition: { duration: 0.01 },
    };
  }

  return props;
}

export function useMotionPresets() {
  const reducedMotion = useReducedMotion();

  const instantTransition = { duration: 0.01 };

  if (reducedMotion) {
    return {
      fadeIn: {
        hidden: { opacity: 1 },
        visible: { opacity: 1, transition: instantTransition },
      },
      slideUp: {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0, transition: instantTransition },
      },
      slideDown: {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0, transition: instantTransition },
      },
      scaleIn: {
        hidden: { opacity: 1, scale: 1 },
        visible: { opacity: 1, scale: 1, transition: instantTransition },
      },
    };
  }

  return {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } },
    },
    slideUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    },
    slideDown: {
      hidden: { opacity: 0, y: -20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    },
  };
}

export { useReducedMotion } from '../hooks/useReducedMotion';
