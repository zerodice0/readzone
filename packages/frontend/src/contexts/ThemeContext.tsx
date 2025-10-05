import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Theme } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';
import * as themeContextModule from './theme-context';

const { ThemeContext } = themeContextModule;

type ThemeContextValue = themeContextModule.ThemeContextValue;
type ResolvedTheme = themeContextModule.ResolvedTheme;

const STORAGE_KEY = 'readzone:theme';
const THEME_ATTRIBUTE = 'data-theme';

const isBrowser = typeof window !== 'undefined';

const readStoredTheme = (): Theme | null => {
  if (!isBrowser) {
    return null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return null;
  }

  const normalized = stored.toUpperCase();

  return normalized === 'LIGHT' ||
    normalized === 'DARK' ||
    normalized === 'AUTO'
    ? (normalized as Theme)
    : null;
};

const getSystemTheme = (): ResolvedTheme => {
  if (!isBrowser) {
    return 'LIGHT';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'DARK'
    : 'LIGHT';
};

const applyResolvedTheme = (resolved: ResolvedTheme) => {
  if (!isBrowser) {
    return;
  }

  const root = document.documentElement;
  const body = document.body;

  root.classList.toggle('dark', resolved === 'DARK');
  if (body) {
    body.classList.toggle('dark', resolved === 'DARK');
  }

  root.setAttribute(THEME_ATTRIBUTE, resolved.toLowerCase());
  root.style.colorScheme = resolved === 'DARK' ? 'dark' : 'light';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const storeTheme = useSettingsStore(
    (state) => state.settings?.preferences.theme ?? null
  );

  const [theme, setThemeState] = useState<Theme>(() => {
    return storeTheme ?? readStoredTheme() ?? 'AUTO';
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    theme === 'AUTO' ? getSystemTheme() : theme
  );

  const handleSystemChange = useCallback((event?: MediaQueryListEvent) => {
    const isDark = event ? event.matches : getSystemTheme() === 'DARK';
    const next: ResolvedTheme = isDark ? 'DARK' : 'LIGHT';

    setResolvedTheme(next);
    applyResolvedTheme(next);
  }, []);

  const applyThemePreference = useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);

      if (!isBrowser) {
        return;
      }

      window.localStorage.setItem(STORAGE_KEY, nextTheme);

      if (nextTheme === 'AUTO') {
        handleSystemChange();
      } else {
        setResolvedTheme(nextTheme);
        applyResolvedTheme(nextTheme);
      }
    },
    [handleSystemChange]
  );

  // Update when zustand store theme changes
  useEffect(() => {
    if (!storeTheme) {
      return;
    }

    setThemeState((prev) => {
      if (prev === storeTheme) {
        return prev;
      }

      if (isBrowser) {
        window.localStorage.setItem(STORAGE_KEY, storeTheme);
      }

      if (storeTheme === 'AUTO') {
        handleSystemChange();
      } else {
        setResolvedTheme(storeTheme);
        applyResolvedTheme(storeTheme);
      }

      return storeTheme;
    });
  }, [storeTheme, handleSystemChange]);

  // Listen to system preference when AUTO
  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    if (theme !== 'AUTO') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const listener = (event: MediaQueryListEvent) => {
      const next = event.matches ? 'DARK' : 'LIGHT';

      setResolvedTheme(next);
      applyResolvedTheme(next);
    };

    setResolvedTheme(mediaQuery.matches ? 'DARK' : 'LIGHT');
    applyResolvedTheme(mediaQuery.matches ? 'DARK' : 'LIGHT');

    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Apply theme on mount for non-AUTO settings
  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    if (theme === 'AUTO') {
      handleSystemChange();
    } else {
      setResolvedTheme(theme);
      applyResolvedTheme(theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: applyThemePreference,
    }),
    [theme, resolvedTheme, applyThemePreference]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
