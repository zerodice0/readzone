import { createContext } from 'react';
import type { Theme } from '@/types';

export type ResolvedTheme = Extract<Theme, 'LIGHT' | 'DARK'>;

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);
