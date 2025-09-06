import { useMemo } from 'react'

/**
 * Custom hook to get URL query parameter
 * @param name - Parameter name
 * @returns Parameter value or undefined
 */
export function useQueryParam(name: string) {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)

    return params.get(name) ?? undefined
  }, [name])
}
