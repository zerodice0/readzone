import { useEffect, useCallback, useMemo } from 'react'
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
  // options를 메모이제이션하여 불필요한 재렌더링 방지
  const apiOptions = useMemo(() => ({
    initialLoading: true
  }), [])
  
  const { data: book, isLoading, error, call, reset } = useApiCall<BookDetail>(apiOptions)

  // bookId가 변경될 때만 새로 생성되도록 call 의존성 제거
  const fetchBookData = useCallback(() => {
    if (bookId) {
      call(`/api/books/${bookId}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]) // call 의존성 제거 (이제 call이 안정적이므로)

  useEffect(() => {
    fetchBookData()
  }, [fetchBookData])

  const refresh = useCallback(() => {
    if (bookId) {
      call(`/api/books/${bookId}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]) // fetchBookData 의존성 제거하고 직접 call 사용

  return {
    book,
    isLoading,
    error,
    refresh,
    reset
  }
}