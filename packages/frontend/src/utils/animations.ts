import { Variants } from 'framer-motion';

/**
 * ReadZone Animation System
 * Warm, elegant animations inspired by turning pages and reading lights
 * Respects user's prefers-reduced-motion setting
 */

/**
 * Check if user prefers reduced motion
 */
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Wrap variants to respect reduced motion preference
 */
const withReducedMotion = (variants: Variants): Variants => {
  if (prefersReducedMotion()) {
    // Return simplified variants with instant transitions
    const reducedVariants: Variants = {};
    Object.keys(variants).forEach((key) => {
      reducedVariants[key] = {
        ...(typeof variants[key] === 'object' ? variants[key] : {}),
        transition: { duration: 0.01 },
      };
    });
    return reducedVariants;
  }
  return variants;
};

// Page transition animations - like turning a page
const _pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1], // Custom easing for smooth feel
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};
export const pageVariants = withReducedMotion(_pageVariants);

// Staggered list animations - cards appearing one by one
const _containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Delay between each child
      delayChildren: 0.1,
    },
  },
};
export const containerVariants = withReducedMotion(_containerVariants);

const _cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};
export const cardVariants = withReducedMotion(_cardVariants);

// 3D hover effect for cards - like lifting a book
export const card3DHoverVariants: Variants = {
  rest: {
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    z: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  hover: {
    scale: 1.02,
    z: 50,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// Glow effect on hover - warm reading light
export const glowVariants: Variants = {
  rest: {
    boxShadow:
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  hover: {
    boxShadow: `
      0 20px 25px -5px rgba(245, 158, 11, 0.15),
      0 10px 10px -5px rgba(245, 158, 11, 0.1),
      0 0 20px rgba(245, 158, 11, 0.2)
    `,
  },
};

// Button press effect
export const buttonPressVariants: Variants = {
  rest: { scale: 1 },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

// Floating animation - for decorative elements
export const floatVariants: Variants = {
  float: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Fade in from bottom
export const fadeInUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Scale in animation
export const scaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Like button animation - heart beat
const _likeVariants: Variants = {
  rest: { scale: 1 },
  liked: {
    scale: [1, 1.3, 0.9, 1.1, 1],
    transition: {
      duration: 0.6,
      times: [0, 0.2, 0.4, 0.6, 1],
    },
  },
};
export const likeVariants = withReducedMotion(_likeVariants);

// Bookmark animation - gentle bounce
const _bookmarkVariants: Variants = {
  rest: { y: 0 },
  bookmarked: {
    y: [0, -8, 2, -4, 0],
    transition: {
      duration: 0.5,
      times: [0, 0.3, 0.5, 0.7, 1],
    },
  },
};
export const bookmarkVariants = withReducedMotion(_bookmarkVariants);

// Shimmer loading effect
export const shimmerVariants: Variants = {
  shimmer: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Modal/Dialog animations
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
    },
  },
};

// Backdrop animations
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Spring configuration presets
export const springConfigs = {
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 15,
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20,
  },
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  },
};
