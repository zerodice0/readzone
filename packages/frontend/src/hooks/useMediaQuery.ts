import { useState, useEffect } from 'react';

/**
 * Generic hook for detecting media query matches with real-time updates
 * @param query - CSS media query string (e.g., '(max-width: 640px)')
 * @returns true if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/**
 * Convenience hook for detecting mobile viewport (max-width: 640px)
 * Matches Tailwind's 'sm' breakpoint
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 640px)');
}

export default useMediaQuery;
