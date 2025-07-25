'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Book } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BookCard } from './book-card'
import { SearchHistory } from './search-history'
import { PopularBooks } from './popular-books'
import { useDebounce } from '@/hooks/use-debounce'
import { searchBooks } from '@/lib/api-client'
import type { KakaoBook } from '@/types/kakao'

interface BookSearchProps {
  onBookSelect?: (book: KakaoBook) => void
  placeholder?: string
  showHistory?: boolean
  showPopular?: boolean
  maxResults?: number
}

interface SearchState {
  query: string
  results: KakaoBook[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  page: number
  totalCount: number
}

export function BookSearch({
  onBookSelect,
  placeholder = '도서명, 저자명, ISBN을 입력하세요',
  showHistory = true,
  showPopular = true,
  maxResults = 20
}: BookSearchProps) {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    isLoading: false,
    error: null,
    hasMore: false,
    page: 1,
    totalCount: 0
  })

  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debouncedQuery = useDebounce(searchState.query, 300)

  // 검색 실행
  const performSearch = useCallback(async (query: string, page: number = 1, append: boolean = false) => {
    if (!query.trim()) {
      setSearchState(prev => ({
        ...prev,
        results: [],
        error: null,
        hasMore: false,
        totalCount: 0
      }))
      return
    }

    setSearchState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log('🔵 Calling searchBooks with:', { query: query.trim(), page, maxResults })
      const response = await searchBooks(query.trim(), page, maxResults)
      console.log('🔵 searchBooks response:', response)
      console.log('🔵 response.success:', response.success)
      console.log('🔵 response.data:', response.data)

      if (response.success && response.data) {
        console.log('🟡 Parsing response data...')
        console.log('🟡 response.data structure:', Object.keys(response.data))
        console.log('🟡 response.data.data:', response.data.data)
        console.log('🟡 response.data.data?.documents:', response.data.data?.documents)
        
        const newResults = response.data?.data?.documents || []
        
        setSearchState(prev => ({
          ...prev,
          results: append ? [...prev.results, ...newResults] : newResults,
          isLoading: false,
          hasMore: !response.data?.pagination?.isEnd,
          totalCount: response.data?.pagination?.totalCount || 0,
          page
        }))

        // 검색 기록에 저장
        if (showHistory && !append) {
          saveSearchHistory(query.trim())
        }
      } else {
        setSearchState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error?.message || '검색 중 오류가 발생했습니다.',
          results: append ? prev.results : []
        }))
      }
    } catch (error) {
      console.error('🔴 BookSearch Error:', error)
      console.error('🔴 Error Type:', error?.constructor?.name)
      console.error('🔴 Error Message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('🔴 Error Stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        error: '네트워크 오류가 발생했습니다.',
        results: append ? prev.results : []
      }))
    }
  }, [maxResults, showHistory])

  // 디바운스된 검색 실행
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery)
      setShowResults(true)
    } else {
      setShowResults(false)
    }
  }, [debouncedQuery, performSearch])

  // 더 보기 (페이지네이션)
  const loadMore = useCallback(() => {
    if (searchState.hasMore && !searchState.isLoading) {
      performSearch(searchState.query, searchState.page + 1, true)
    }
  }, [performSearch, searchState.hasMore, searchState.isLoading, searchState.query, searchState.page])

  // 검색어 변경
  const handleQueryChange = (value: string) => {
    setSearchState(prev => ({ ...prev, query: value, page: 1 }))
    setSelectedIndex(-1)
  }

  // 검색어 지우기
  const clearSearch = () => {
    setSearchState(prev => ({ ...prev, query: '', results: [], error: null }))
    setShowResults(false)
    setSelectedIndex(-1)
  }

  // 도서 선택
  const handleBookSelect = (book: KakaoBook) => {
    onBookSelect?.(book)
    setShowResults(false)
  }

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchState.results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchState.results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < searchState.results.length) {
          handleBookSelect(searchState.results[selectedIndex])
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }

  // 검색 기록 저장
  const saveSearchHistory = (query: string) => {
    try {
      const history = JSON.parse(localStorage.getItem('book-search-history') || '[]')
      const newHistory = [query, ...history.filter((h: string) => h !== query)].slice(0, 10)
      localStorage.setItem('book-search-history', JSON.stringify(newHistory))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }

  // 검색 기록에서 선택
  const handleHistorySelect = (query: string) => {
    setSearchState(prev => ({ ...prev, query }))
    setShowResults(true)
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* 검색 입력 */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchState.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowResults(true)}
            placeholder={placeholder}
            className="pl-10 pr-10 py-3 text-base"
            disabled={searchState.isLoading}
          />
          {searchState.query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 로딩 인디케이터 */}
        {searchState.isLoading && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-hidden shadow-lg border z-50">
          {/* 에러 메시지 */}
          {searchState.error && (
            <div className="p-4 text-red-600 text-sm border-b">
              {searchState.error}
            </div>
          )}

          {/* 검색 결과 없음 */}
          {!searchState.isLoading && searchState.query && searchState.results.length === 0 && !searchState.error && (
            <div className="p-4 text-gray-500 text-center">
              <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>검색 결과가 없습니다.</p>
              <p className="text-xs mt-1">다른 키워드로 검색해보세요.</p>
            </div>
          )}

          {/* 검색 결과 목록 */}
          {searchState.results.length > 0 && (
            <div className="max-h-80 overflow-y-auto">
              {/* 결과 통계 */}
              <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-600">
                총 {searchState.totalCount.toLocaleString()}권의 도서
              </div>

              {/* 도서 목록 */}
              {searchState.results.map((book, index) => (
                <div
                  key={`${book.isbn}-${index}`}
                  className={`border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleBookSelect(book)}
                >
                  <BookCard book={book} compact />
                </div>
              ))}

              {/* 더 보기 버튼 */}
              {searchState.hasMore && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    onClick={loadMore}
                    disabled={searchState.isLoading}
                    className="w-full text-sm"
                  >
                    {searchState.isLoading ? '로딩 중...' : '더 보기'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 검색어가 없을 때 - 기록 및 인기 도서 */}
          {!searchState.query && (
            <div className="max-h-80 overflow-y-auto">
              {/* 검색 기록 */}
              {showHistory && (
                <SearchHistory onSelect={handleHistorySelect} />
              )}

              {/* 인기 도서 */}
              {showPopular && (
                <PopularBooks onSelect={handleBookSelect} />
              )}
            </div>
          )}
        </Card>
      )}

      {/* 배경 오버레이 (모바일) */}
      {showResults && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  )
}