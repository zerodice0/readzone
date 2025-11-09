/**
 * Safe localStorage utilities with type safety
 */

// Type assertion for localStorage to satisfy ESLint
const safeLocalStorage = localStorage as Storage;

export const storage = {
  getItem: (key: string): string | null => {
    try {
      return safeLocalStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      safeLocalStorage.setItem(key, value);
    } catch {
      // Silently fail if localStorage is not available
    }
  },

  removeItem: (key: string): void => {
    try {
      safeLocalStorage.removeItem(key);
    } catch {
      // Silently fail if localStorage is not available
    }
  },
};
