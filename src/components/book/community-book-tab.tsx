'use client'

import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { Search, Loader2, AlertCircle, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'
import toast from 'react-hot-toast'
import { BookItem } from './book-item'
import type { CommunityBook } from '@/types/book-selector'

interface CommunityBookTabProps {
  onSelect: (book: CommunityBook) => void
  isActive: boolean
}

export const CommunityBookTab = memo(function CommunityBookTab({ 
  onSelect, 
  isActive 
}: CommunityBookTabProps) {
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState<CommunityBook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  
  // 무한 스크롤 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  
  const debouncedQuery = useDebounce(query, 500)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // 커뮤니티 도서 검색 함수
  const searchCommunityBooks = useCallback(async (searchQuery: string, page: number = 1, isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const limit = 10
      const response = await fetch(`/api/books/community/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        const newBooks = result.data
        
        // 상태 업데이트
        if (isLoadMore) {
          setBooks(prev => [...prev, ...newBooks])
        } else {
          setBooks(newBooks)
        }
        
        setTotalCount(result.pagination?.totalCount || 0)
        setHasMore(!result.pagination?.isEnd && newBooks.length === limit)
        setCurrentPage(page)
      } else {
        throw new Error(result.error?.message || '검색 실패')
      }

    } catch (error) {
      console.error('커뮤니티 도서 검색 실패:', error)
      toast.error('커뮤니티 도서 검색 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // 검색 초기화
  const resetSearch = useCallback(() => {
    setBooks([])
    setSearchPerformed(false)
    setCurrentPage(1)
    setHasMore(true)
    setTotalCount(0)
  }, [])

  // 새 검색 시작
  const resetAndSearch = useCallback((searchQuery: string) => {
    resetSearch()
    setSearchPerformed(true)
    searchCommunityBooks(searchQuery, 1, false)
  }, [resetSearch, searchCommunityBooks])

  // 더 많은 결과 로드
  const loadMoreBooks = useCallback(() => {
    if (!isLoadingMore && hasMore && query.length >= 2) {
      searchCommunityBooks(query, currentPage + 1, true)
    }
  }, [isLoadingMore, hasMore, query, currentPage, searchCommunityBooks])

  // Intersection Observer for infinite scroll
  const lastBookElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        loadMoreBooks()
      }
    }, {
      threshold: 0.1,
      rootMargin: '20px'
    })
    
    if (node && observerRef.current) {
      observerRef.current.observe(node)
    }
  }, [isLoadingMore, hasMore, loadMoreBooks])

  // Clean up observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // 검색 실행
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      resetAndSearch(debouncedQuery)
    } else if (debouncedQuery.length === 0) {
      resetSearch()
    }
  }, [debouncedQuery, resetSearch, resetAndSearch])

  // 탭이 비활성화되면 검색 초기화
  useEffect(() => {
    if (!isActive) {
      setQuery('')
      resetSearch()
    }
  }, [isActive, resetSearch])

  if (!isActive) {
    return null
  }

  return (
    <div 
      role="tabpanel" 
      id="community-panel" 
      aria-labelledby="community-tab"
      className="space-y-4"
    >
      {/* 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
        <Input
          type="text"
          placeholder="커뮤니티에 등록된 도서를 검색하세요"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          aria-label="커뮤니티 도서 검색"
          aria-describedby="community-search-status"
          autoComplete="off"
        />
      </div>

      {/* 검색 상태 */}
      <div className="flex items-center justify-between">
        <p id="community-search-status" className="text-sm text-gray-500" aria-live="polite" aria-atomic="true">
          {isLoading && '검색 중...'}
          {!isLoading && searchPerformed && books.length === 0 && query && '검색 결과가 없습니다.'}
          {!isLoading && books.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {books.length}개의 커뮤니티 도서{totalCount > books.length && ` (총 ${totalCount}개 중)`}
            </span>
          )}
        </p>
      </div>

      {/* 로딩 상태 */}
      {isLoading && query.length >= 2 && (
        <Card className="p-8 text-center" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-gray-500">커뮤니티 도서를 검색하고 있습니다...</p>
        </Card>
      )}

      {/* 검색 결과 */}
      {!isLoading && books.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Users className="h-4 w-4" />
            커뮤니티 도서
          </h3>
          
          {/* 스크롤 가능한 검색 결과 영역 */}
          <div 
            className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50"
            role="region"
            aria-labelledby="community-results-heading"
            aria-live="polite"
            tabIndex={0}
          >
            <div className="p-3 space-y-2">
              {books.map((book, index) => {
                const isLast = index === books.length - 1
                return (
                  <div
                    key={book.id}
                    ref={isLast ? lastBookElementRef : null}
                  >
                    <BookItem 
                      book={book} 
                      onSelect={(selectedBook) => onSelect(selectedBook as CommunityBook)}
                      variant="community"
                      showReviewStatus={true}
                    />
                  </div>
                )
              })}
              
              {/* 더 많은 결과 로딩 */}
              {isLoadingMore && (
                <div className="p-4 text-center" role="status" aria-live="polite">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" aria-hidden="true" />
                  <p className="text-xs text-gray-500">더 많은 결과를 불러오는 중...</p>
                </div>
              )}
              
              {/* 모든 결과 로드 완료 */}
              {!hasMore && books.length > 10 && (
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-500">모든 검색 결과를 불러왔습니다.</p>
                </div>
              )}
              
              {/* 수동으로 더보기 버튼 (fallback) */}
              {hasMore && !isLoadingMore && books.length >= 10 && (
                <div className="p-3 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreBooks}
                    className="text-xs"
                    aria-label="더 많은 커뮤니티 도서 불러오기"
                  >
                    더 많은 결과 보기
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {!isLoading && searchPerformed && books.length === 0 && query.length >= 2 && (
        <Card className="p-8 text-center" role="status">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" aria-hidden="true" />
          <h3 className="font-medium mb-2">커뮤니티에서 찾을 수 없습니다</h3>
          <p className="text-sm text-gray-500 mb-4">
            &ldquo;{query}&rdquo;에 대한 커뮤니티 도서를 찾을 수 없습니다.
          </p>
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="text-xs">
              다른 탭에서 검색해보세요
            </Badge>
          </div>
        </Card>
      )}

      {/* 검색 안내 */}
      {!searchPerformed && query.length < 2 && (
        <Card className="p-6 text-center bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <Users className="h-8 w-8 text-blue-500 mx-auto mb-3" aria-hidden="true" />
          <h3 className="font-medium mb-2 text-blue-900 dark:text-blue-100">커뮤니티 도서</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            다른 사용자들이 이미 선택한 도서들을 검색할 수 있습니다.
          </p>
          <Badge variant="secondary" className="text-xs">
            최소 2글자 이상 입력하세요
          </Badge>
        </Card>
      )}
    </div>
  )
})