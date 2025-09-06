import { useEffect, useRef } from 'react'

/**
 * Custom hook for debouncing function calls
 * @param cb - Callback function to debounce
 * @param delay - Delay in milliseconds (default: 2000)
 * @param deps - Dependencies array for the effect
 */
export function useDebounced(cb: () => void, delay = 2000, deps: unknown[] = []) {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => cb(), delay)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
