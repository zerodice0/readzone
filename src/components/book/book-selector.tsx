'use client'

import { useState, useEffect } from 'react'
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
  
  // 수동 입력 폼 상태
  const [manualBook, setManualBook] = useState({
    title: '',
    authors: '',
    publisher: '',
    genre: ''
  })

  const debouncedQuery = useDebounce(query, 500)

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

  // 도서 검색
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchBooks(debouncedQuery)
    } else if (debouncedQuery.length === 0) {
      setBooks([])
      setSearchPerformed(false)
    }
  }, [debouncedQuery])

  const searchBooks = async (searchQuery: string) => {
    setIsLoading(true)
    setSearchPerformed(true)

    try {
      // 1. 서버 DB 검색
      const dbResponse = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
      const dbResult = await dbResponse.json()
      
      let allBooks: Book[] = []
      
      if (dbResult.success && dbResult.data.length > 0) {
        allBooks = dbResult.data
      }

      // 2. 카카오 API 검색 (DB에서 충분한 결과가 없는 경우)
      if (allBooks.length < 5) {
        try {
          const kakaoResponse = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}&source=kakao&limit=10`)
          const kakaoResult = await kakaoResponse.json()
          
          if (kakaoResult.success && kakaoResult.data.length > 0) {
            // 중복 제거 (제목 + 첫 번째 저자 기준)
            const existingKeys = new Set(allBooks.map(book => `${book.title}-${book.authors[0]}`))
            const newBooks = kakaoResult.data.filter((book: Book) => 
              !existingKeys.has(`${book.title}-${book.authors[0]}`)
            )
            allBooks = [...allBooks, ...newBooks]
          }
        } catch (error) {
          console.error('카카오 API 검색 실패:', error)
        }
      }

      setBooks(allBooks)
    } catch (error) {
      console.error('도서 검색 실패:', error)
      toast.error('도서 검색 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 도서 선택 처리
  const handleBookSelect = async (book: Book) => {
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
  }

  // 수동 도서 입력
  const handleManualSubmit = async () => {
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
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 검색 입력 */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="도서 제목이나 저자명을 검색하세요"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {isLoading && '검색 중...'}
            {!isLoading && searchPerformed && books.length === 0 && query && '검색 결과가 없습니다.'}
            {!isLoading && books.length > 0 && `${books.length}개의 결과를 찾았습니다.`}
          </p>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            직접 입력
          </Button>
        </div>
      </div>

      {/* 수동 입력 폼 */}
      {showManualEntry && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="font-medium mb-3 text-blue-900 dark:text-blue-100">
            도서 직접 입력
          </h3>
          <div className="space-y-3">
            <div>
              <Input
                placeholder="도서 제목 *"
                value={manualBook.title}
                onChange={(e) => setManualBook(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Input
                placeholder="저자 * (여러 명인 경우 쉼표로 구분)"
                value={manualBook.authors}
                onChange={(e) => setManualBook(prev => ({ ...prev, authors: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="출판사"
                value={manualBook.publisher}
                onChange={(e) => setManualBook(prev => ({ ...prev, publisher: e.target.value }))}
              />
              <Input
                placeholder="장르"
                value={manualBook.genre}
                onChange={(e) => setManualBook(prev => ({ ...prev, genre: e.target.value }))}
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
        <Card className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">도서를 검색하고 있습니다...</p>
        </Card>
      )}

      {/* 검색 결과 */}
      {!isLoading && books.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
            검색 결과
          </h3>
          {books.map((book, index) => (
            <BookItem 
              key={`${book.id || index}-${book.title}`} 
              book={book} 
              onSelect={handleBookSelect}
            />
          ))}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {!isLoading && searchPerformed && books.length === 0 && query.length >= 2 && (
        <Card className="p-8 text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <h3 className="font-medium mb-2">검색 결과가 없습니다</h3>
          <p className="text-sm text-gray-500 mb-4">
            "{query}"에 대한 검색 결과를 찾을 수 없습니다.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManualEntry(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            직접 입력하기
          </Button>
        </Card>
      )}

      {/* 최근 선택한 도서 */}
      {recentBooks.length > 0 && !searchPerformed && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
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
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium mb-2">독후감을 작성할 도서를 선택하세요</h3>
          <p className="text-sm text-gray-500 mb-4">
            도서 제목이나 저자명으로 검색하거나 직접 입력할 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary">추천 검색어</Badge>
            <Badge variant="outline" className="cursor-pointer" onClick={() => setQuery('해리포터')}>
              해리포터
            </Badge>
            <Badge variant="outline" className="cursor-pointer" onClick={() => setQuery('미움받을 용기')}>
              미움받을 용기
            </Badge>
            <Badge variant="outline" className="cursor-pointer" onClick={() => setQuery('데미안')}>
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

function BookItem({ book, onSelect, isRecent = false }: BookItemProps) {
  return (
    <Card 
      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      onClick={() => onSelect(book)}
    >
      <div className="flex items-start gap-3">
        {book.thumbnail ? (
          <img 
            src={book.thumbnail} 
            alt={book.title}
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
}