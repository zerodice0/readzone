import { useState, useEffect, useCallback } from 'react'
import { useApiCall } from './use-api-call'

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
  stats?: Record<string, any>
}

export interface UsePaginatedListOptions {
  initialPage?: number
  initialLimit?: number
  autoFetch?: boolean
}

export interface UsePaginatedListReturn<T> {
  data: PaginatedResponse<T> | null
  isLoading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  refresh: () => void
  reset: () => void
}

/**
 * 페이지네이션된 목록 데이터를 관리하는 커스텀 훅
 */
export function usePaginatedList<T>(
  baseUrl: string,
  options: UsePaginatedListOptions = {}
): UsePaginatedListReturn<T> {
  const {
    initialPage = 1,
    initialLimit = 20,
    autoFetch = true
  } = options

  const [currentPage, setCurrentPage] = useState(initialPage)
  const [limit] = useState(initialLimit)

  const { data, isLoading, error, call, reset: resetApi } = useApiCall<PaginatedResponse<T>>()

  const fetchData = useCallback(() => {
    const url = `${baseUrl}?page=${currentPage}&limit=${limit}`
    call(url)
  }, [baseUrl, currentPage, limit, call])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, autoFetch])

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && (!data || page <= data.pagination.totalPages)) {
      setCurrentPage(page)
    }
  }, [data])

  const nextPage = useCallback(() => {
    if (data && currentPage < data.pagination.totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }, [data, currentPage])

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }, [currentPage])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  const reset = useCallback(() => {
    setCurrentPage(initialPage)
    resetApi()
  }, [initialPage, resetApi])

  return {
    data,
    isLoading,
    error,
    currentPage,
    totalPages: data?.pagination.totalPages || 0,
    hasNextPage: data ? currentPage < data.pagination.totalPages : false,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    refresh,
    reset
  }
}