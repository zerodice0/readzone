import { useEffect, useCallback } from 'react'
import { useApiCall } from './use-api-call'
import type { BookDetail } from '@/types/book'

export interface UseBookDataReturn {
  book: BookDetail | null
  isLoading: boolean
  error: string | null
  refresh: () => void
  reset: () => void
}

/**
 * 도서 상세 정보를 관리하는 커스텀 훅
 */
export function useBookData(bookId: string): UseBookDataReturn {
  const { data: book, isLoading, error, call, reset } = useApiCall<BookDetail>({
    initialLoading: true
  })

  const fetchBookData = useCallback(() => {
    if (bookId) {
      call(`/api/books/${bookId}`)
    }
  }, [bookId, call])

  useEffect(() => {
    fetchBookData()
  }, [fetchBookData])

  const refresh = useCallback(() => {
    fetchBookData()
  }, [fetchBookData])

  return {
    book,
    isLoading,
    error,
    refresh,
    reset
  }
}