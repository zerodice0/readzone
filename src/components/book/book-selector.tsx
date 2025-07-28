'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  BookOpen, 
  Plus, 
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import toast from 'react-hot-toast'

interface Book {
  id: string
  title: string
  authors: string[]
  thumbnail?: string
  publisher?: string
  genre?: string
  isbn?: string
  isManualEntry?: boolean
}

interface BookSelectorProps {
  onSelect: (book: Book) => void
  className?: string
}

export function BookSelector({ onSelect, className = '' }: BookSelectorProps) {
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [recentBooks, setRecentBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  
  // 무한 스크롤 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  
  // 수동 입력 폼 상태
  const [manualBook, setManualBook] = useState({
    title: '',
    authors: '',
    publisher: '',
    genre: ''
  })

  const debouncedQuery = useDebounce(query, 500)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // 도서 검색 함수 (페이지네이션 지원)
  const searchBooks = useCallback(async (searchQuery: string, page: number = 1, isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const pageSize = 10
      let allBooks: Book[] = []
      let totalResults = 0
      let isLastPage = false

      // 1. DB 검색 (페이지네이션 지원)
      const dbResponse = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=${pageSize}`)
      const dbResult = await dbResponse.json()
      
      if (dbResult.success && dbResult.data) {
        const books = Array.isArray(dbResult.data) ? dbResult.data : dbResult.data.documents || []
        if (books.length > 0) {
          allBooks = books
          totalResults += dbResult.pagination?.totalCount || books.length
          isLastPage = dbResult.pagination?.isEnd || books.length < pageSize
        }
      }

      // 2. 카카오 API 검색 (첫 페이지이고 DB 결과가 부족한 경우)
      if (page === 1 && allBooks.length < 5) {
        try {
          const kakaoResponse = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}&source=kakao&page=${page}&limit=${pageSize}`)
          const kakaoResult = await kakaoResponse.json()
          
          if (kakaoResult.success && kakaoResult.data) {
            const books = Array.isArray(kakaoResult.data) ? kakaoResult.data : kakaoResult.data.documents || []
            if (books.length > 0) {
              // 중복 제거
              const existingKeys = new Set(allBooks.map(book => `${book.title}-${book.authors?.[0] || ''}`))
              const newBooks = books.filter((book: Book) => 
                !existingKeys.has(`${book.title}-${book.authors?.[0] || ''}`)
              )
              allBooks = [...allBooks, ...newBooks]
              totalResults += kakaoResult.pagination?.totalCount || 0
              
              // 카카오 API는 첫 페이지에서만 사용하므로 DB 페이지네이션 상태 우선
              if (dbResult.success) {
                isLastPage = dbResult.pagination?.isEnd || false
              }
            }
          }
        } catch (error) {
          console.error('카카오 API 검색 실패:', error)
        }
      }

      // 상태 업데이트
      if (isLoadMore) {
        setBooks(prev => [...prev, ...allBooks])
      } else {
        setBooks(allBooks)
      }
      
      setTotalCount(totalResults)
      setHasMore(!isLastPage && allBooks.length === pageSize)
      setCurrentPage(page)

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 검색 완료:', { 
          query: searchQuery, 
          page,
          newBooks: allBooks.length,
          totalBooks: isLoadMore ? books.length + allBooks.length : allBooks.length,
          hasMore: !isLastPage && allBooks.length === pageSize
        })
      }

    } catch (error) {
      console.error('도서 검색 실패:', error)
      toast.error('도서 검색 중 오류가 발생했습니다.')
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
    searchBooks(searchQuery, 1, false)
  }, [resetSearch, searchBooks])

  // 더 많은 결과 로드
  const loadMoreBooks = useCallback(() => {
    if (!isLoadingMore && hasMore && query.length >= 2) {
      searchBooks(query, currentPage + 1, true)
    }
  }, [isLoadingMore, hasMore, query, currentPage, searchBooks])

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

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // 최근 선택한 도서 로드
  useEffect(() => {
    const loadRecentBooks = async () => {
      try {
        const response = await fetch('/api/books/recent')
        if (response.ok) {
          const result = await response.json()
          setRecentBooks(result.data || [])
        }
      } catch (error) {
        console.error('최근 도서 로드 실패:', error)
      }
    }

    loadRecentBooks()
  }, [])

  // 도서 검색 (새 검색 시 초기화)
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      resetAndSearch(debouncedQuery)
    } else if (debouncedQuery.length === 0) {
      resetSearch()
    }
  }, [debouncedQuery, resetAndSearch, resetSearch])

  // 도서 선택 처리
  const handleBookSelect = useCallback(async (book: Book) => {
    try {
      // 선택한 도서를 DB에 저장 (카카오 API 결과인 경우)
      if (!book.id || book.id.startsWith('kakao-')) {
        const saveResponse = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: book.title,
            authors: book.authors,
            publisher: book.publisher,
            genre: book.genre,
            thumbnail: book.thumbnail,
            isbn: book.isbn
          })
        })

        if (saveResponse.ok) {
          const savedBook = await saveResponse.json()
          book.id = savedBook.data.id
        }
      }

      onSelect(book)
      
      // 최근 선택 목록에 추가
      const updatedRecent = [book, ...recentBooks.filter(b => b.id !== book.id)].slice(0, 5)
      setRecentBooks(updatedRecent)
      
      toast.success(`"${book.title}" 선택되었습니다.`)
    } catch (error) {
      console.error('도서 선택 실패:', error)
      toast.error('도서 선택 중 오류가 발생했습니다.')
    }
  }, [onSelect, recentBooks])

  // 수동 도서 입력
  const handleManualSubmit = useCallback(async () => {
    if (!manualBook.title.trim()) {
      toast.error('도서 제목을 입력해주세요.')
      return
    }

    if (!manualBook.authors.trim()) {
      toast.error('저자를 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/books/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualBook.title.trim(),
          authors: manualBook.authors.split(',').map(author => author.trim()),
          publisher: manualBook.publisher.trim() || undefined,
          genre: manualBook.genre.trim() || undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        const newBook: Book = {
          id: result.data.id,
          title: result.data.title,
          authors: result.data.authors,
          publisher: result.data.publisher,
          genre: result.data.genre,
          isManualEntry: true
        }

        onSelect(newBook)
        toast.success('도서가 등록되었습니다.')
      } else {
        throw new Error(result.error?.message || '도서 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('수동 도서 등록 실패:', error)
      toast.error(error instanceof Error ? error.message : '도서 등록에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [manualBook, onSelect])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 검색 입력 */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <Input
            type="text"
            placeholder="도서 제목이나 저자명을 검색하세요"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            aria-label="도서 검색"
            aria-describedby="search-status"
            autoComplete="off"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <p id="search-status" className="text-sm text-gray-500" aria-live="polite" aria-atomic="true">
            {isLoading && '검색 중...'}
            {!isLoading && searchPerformed && books.length === 0 && query && '검색 결과가 없습니다.'}
            {!isLoading && books.length > 0 && (
              <span>
                {books.length}개의 결과{totalCount > books.length && ` (총 ${totalCount}개 중)`}
              </span>
            )}
          </p>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="flex items-center gap-1"
            aria-expanded={showManualEntry}
            aria-controls="manual-entry-form"
            aria-label={showManualEntry ? "수동 입력 폼 닫기" : "수동 입력 폼 열기"}
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            직접 입력
          </Button>
        </div>
      </div>

      {/* 수동 입력 폼 */}
      {showManualEntry && (
        <Card id="manual-entry-form" className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" role="form" aria-labelledby="manual-entry-heading">
          <h3 id="manual-entry-heading" className="font-medium mb-3 text-blue-900 dark:text-blue-100">
            도서 직접 입력
          </h3>
          <div className="space-y-3">
            <div>
              <Input
                placeholder="도서 제목 *"
                value={manualBook.title}
                onChange={(e) => setManualBook(prev => ({ ...prev, title: e.target.value }))}
                aria-label="도서 제목 (필수)"
                aria-required="true"
                autoComplete="off"
              />
            </div>
            <div>
              <Input
                placeholder="저자 * (여러 명인 경우 쉼표로 구분)"
                value={manualBook.authors}
                onChange={(e) => setManualBook(prev => ({ ...prev, authors: e.target.value }))}
                aria-label="저자 (필수, 여러 명인 경우 쉼표로 구분)"
                aria-required="true"
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="출판사"
                value={manualBook.publisher}
                onChange={(e) => setManualBook(prev => ({ ...prev, publisher: e.target.value }))}
                aria-label="출판사 (선택사항)"
                autoComplete="off"
              />
              <Input
                placeholder="장르"
                value={manualBook.genre}
                onChange={(e) => setManualBook(prev => ({ ...prev, genre: e.target.value }))}
                aria-label="장르 (선택사항)"
                autoComplete="off"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowManualEntry(false)
                  setManualBook({ title: '', authors: '', publisher: '', genre: '' })
                }}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleManualSubmit}
                disabled={isLoading || !manualBook.title.trim() || !manualBook.authors.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
                등록
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 로딩 상태 */}
      {isLoading && query.length >= 2 && (
        <Card className="p-8 text-center" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-gray-500">도서를 검색하고 있습니다...</p>
        </Card>
      )}

      {/* 검색 결과 */}
      {!isLoading && books.length > 0 && (
        <div className="space-y-3">
          <h3 id="search-results-heading" className="font-medium text-sm text-gray-700 dark:text-gray-300">
            검색 결과
          </h3>
          
          {/* 스크롤 가능한 검색 결과 영역 */}
          <div 
            className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50"
            role="region"
            aria-labelledby="search-results-heading"
            aria-live="polite"
            tabIndex={0}
          >
            <div className="p-3 space-y-2">
              {books.map((book, index) => {
                const isLast = index === books.length - 1
                return (
                  <div
                    key={book.id || `book-${index}`}
                    ref={isLast ? lastBookElementRef : null}
                  >
                    <BookItem 
                      book={book} 
                      onSelect={handleBookSelect}
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
                    aria-label="더 많은 검색 결과 불러오기"
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
          <h3 className="font-medium mb-2">검색 결과가 없습니다</h3>
          <p className="text-sm text-gray-500 mb-4">
            &ldquo;{query}&rdquo;에 대한 검색 결과를 찾을 수 없습니다.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManualEntry(true)}
            aria-label="검색 결과가 없어 직접 입력 폼 열기"
          >
            <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
            직접 입력하기
          </Button>
        </Card>
      )}

      {/* 최근 선택한 도서 */}
      {recentBooks.length > 0 && !searchPerformed && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
              최근 선택한 도서
            </h3>
          </div>
          {recentBooks.map((book) => (
            <BookItem 
              key={book.id} 
              book={book} 
              onSelect={handleBookSelect}
              isRecent={true}
            />
          ))}
        </div>
      )}

      {/* 초기 안내 */}
      {!searchPerformed && recentBooks.length === 0 && (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-medium mb-2">독후감을 작성할 도서를 선택하세요</h2>
          <p className="text-sm text-gray-500 mb-4">
            도서 제목이나 저자명으로 검색하거나 직접 입력할 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="추천 검색어">
            <Badge variant="secondary" aria-hidden="true">추천 검색어</Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500" 
              onClick={() => setQuery('해리포터')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setQuery('해리포터')
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="해리포터 검색하기"
            >
              해리포터
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500" 
              onClick={() => setQuery('미움받을 용기')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setQuery('미움받을 용기')
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="미움받을 용기 검색하기"
            >
              미움받을 용기
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500" 
              onClick={() => setQuery('데미안')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setQuery('데미안')
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="데미안 검색하기"
            >
              데미안
            </Badge>
          </div>
        </Card>
      )}
    </div>
  )
}

// 도서 아이템 컴포넌트
interface BookItemProps {
  book: Book
  onSelect: (book: Book) => void
  isRecent?: boolean
}

const BookItem = memo(function BookItem({ book, onSelect, isRecent = false }: BookItemProps) {
  const handleClick = useCallback(() => {
    onSelect(book)
  }, [book, onSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(book)
    }
  }, [book, onSelect])

  return (
    <Card 
      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${book.title} 도서 선택, 저자: ${book.authors.join(', ')}${book.publisher ? `, 출판사: ${book.publisher}` : ''}${isRecent ? ' (최근 선택)' : ''}`}
    >
      <div className="flex items-start gap-3">
        {book.thumbnail ? (
          <Image 
            src={book.thumbnail} 
            alt={book.title}
            width={48}
            height={64}
            className="w-12 h-16 object-cover rounded flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-6 w-6 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2 mb-1">
            {book.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {book.authors.join(', ')}
            {book.publisher && ` | ${book.publisher}`}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            {book.genre && (
              <Badge variant="secondary" className="text-xs">
                {book.genre}
              </Badge>
            )}
            {book.isManualEntry && (
              <Badge variant="outline" className="text-xs">
                직접 입력
              </Badge>
            )}
            {isRecent && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Clock className="h-2 w-2" />
                최근
              </Badge>
            )}
          </div>
        </div>
        
        <Button variant="ghost" size="sm" className="flex-shrink-0">
          선택
        </Button>
      </div>
    </Card>
  )
})