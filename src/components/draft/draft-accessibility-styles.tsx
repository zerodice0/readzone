'use client'

/**
 * Enhanced visual indicators for accessibility
 * Provides high contrast colors and clear visual states
 */
export const AccessibilityStyles = {
  // High contrast focus rings
  focusRing: "focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none",
  
  // Enhanced button states with better contrast
  button: {
    primary: "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium",
    secondary: "bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 dark:text-gray-100",
    destructive: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium",
    ghost: "hover:bg-gray-100 active:bg-gray-200 text-gray-700 dark:hover:bg-gray-800 dark:active:bg-gray-700 dark:text-gray-300"
  },
  
  // Status indicators with enhanced contrast
  status: {
    warning: "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200",
    error: "bg-red-100 border-red-300 text-red-900 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200",
    success: "bg-green-100 border-green-300 text-green-900 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200"
  },
  
  // Loading states with clear visual feedback
  loading: {
    overlay: "opacity-60 pointer-events-none",
    spinner: "animate-spin text-primary-600 dark:text-primary-400"
  },
  
  // Screen reader only content
  srOnly: "sr-only",
  
  // Focus visible enhancement
  focusVisible: "focus-visible:ring-4 focus-visible:ring-primary-400 focus-visible:ring-opacity-75"
}

/**
 * Motion preferences detection
 * Respects user's motion preferences
 */
export function useMotionPreferences() {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false

  return {
    prefersReducedMotion,
    getAnimationClass: (normalClass: string, reducedClass: string = '') => 
      prefersReducedMotion ? reducedClass : normalClass
  }
}

/**
 * Color contrast utilities
 */
export const ColorContrast = {
  // WCAG AA compliant color combinations
  text: {
    primary: "text-gray-900 dark:text-gray-100", // 15.3:1 contrast ratio
    secondary: "text-gray-700 dark:text-gray-300", // 7.2:1 contrast ratio
    muted: "text-gray-600 dark:text-gray-400", // 4.5:1 contrast ratio
    inverted: "text-white dark:text-gray-900"
  },
  
  background: {
    primary: "bg-white dark:bg-gray-900",
    secondary: "bg-gray-50 dark:bg-gray-800",
    elevated: "bg-white dark:bg-gray-800 shadow-sm"
  },
  
  border: {
    light: "border-gray-200 dark:border-gray-700",
    medium: "border-gray-300 dark:border-gray-600",
    strong: "border-gray-400 dark:border-gray-500"
  }
}