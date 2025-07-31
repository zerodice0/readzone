import { useState, useCallback, useRef } from 'react'

export interface ApiError {
  errorType: string
  message: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

export interface UseApiCallOptions {
  onSuccess?: (data: any) => void
  onError?: (error: ApiError) => void
  initialLoading?: boolean
}

export interface UseApiCallReturn<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  call: (url: string, options?: RequestInit) => Promise<void>
  reset: () => void
}

/**
 * 표준화된 API 호출을 위한 커스텀 훅
 */
export function useApiCall<T = any>(options: UseApiCallOptions = {}): UseApiCallReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(options.initialLoading || false)
  const [error, setError] = useState<string | null>(null)
  
  // options를 ref로 저장하여 의존성 배열에서 제외
  const optionsRef = useRef(options)
  optionsRef.current = options

  const call = useCallback(async (url: string, requestOptions: RequestInit = {}) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...requestOptions.headers,
        },
        ...requestOptions,
      })

      const result: ApiResponse<T> = await response.json()

      if (result.success && result.data) {
        setData(result.data)
        optionsRef.current.onSuccess?.(result.data)
      } else {
        const errorMessage = result.error?.message || 'API 호출 중 오류가 발생했습니다.'
        setError(errorMessage)
        optionsRef.current.onError?.(result.error || { errorType: 'UNKNOWN', message: errorMessage })
      }
    } catch (err) {
      const errorMessage = '네트워크 오류가 발생했습니다.'
      setError(errorMessage)
      optionsRef.current.onError?.({ errorType: 'NETWORK_ERROR', message: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }, []) // options 의존성 제거

  const reset = useCallback(() => {
    setData(null)
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    data,
    isLoading,
    error,
    call,
    reset
  }
}