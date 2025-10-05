import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './theme-context';

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme 훅은 ThemeProvider 내에서만 사용해야 합니다.');
  }

  return context;
}
