'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Plus, BookPlus } from 'lucide-react'
import { BookSearch } from '@/components/book/book-search'
import { BookCard } from '@/components/book/book-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { KakaoBook } from '@/types/kakao'

export default function SearchPage() {
  const router = useRouter()
  const [selectedBooks, setSelectedBooks] = useState<KakaoBook[]>([])

  const handleBookSelect = (book: KakaoBook) => {
    // 선택된 도서를 목록에 추가 (중복 방지)
    setSelectedBooks(prev => {
      const exists = prev.find(b => b.isbn === book.isbn && book.isbn)
      if (exists) return prev
      return [...prev, book]
    })
  }

  const handleRemoveBook = (isbn: string) => {
    setSelectedBooks(prev => prev.filter(book => book.isbn !== isbn))
  }

  const handleBookDetail = (book: KakaoBook) => {
    // 도서 상세 페이지로 이동 (ISBN 또는 제목 기반)
    const bookId = book.isbn || encodeURIComponent(book.title)
    router.push(`/books/${bookId}`)
  }

  const handleWriteReview = (book: KakaoBook) => {
    // 독후감 작성 페이지로 이동 (선택된 도서 정보 전달)
    const params = new URLSearchParams({
      bookData: JSON.stringify(book)
    })
    router.push(`/write?${params.toString()}`)
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold">도서 검색</h1>
          </div>
          
          {/* 수동 등록 버튼 */}
          <Link href="/search/manual">
            <Button variant="outline" className="flex items-center gap-2">
              <BookPlus className="h-4 w-4" />
              도서 직접 등록
            </Button>
          </Link>
        </div>
        <p className="text-gray-600">
          독후감을 작성하거나 리뷰를 확인할 도서를 찾아보세요. 검색되지 않는 도서는 직접 등록할 수 있습니다.
        </p>
      </div>

      {/* 검색 컴포넌트 */}
      <div className="mb-8">
        <BookSearch
          onBookSelect={handleBookSelect}
          placeholder="도서명, 저자명, ISBN을 입력하세요"
          showHistory={true}
          showPopular={true}
          maxResults={20}
        />
      </div>

      {/* 선택된 도서 목록 */}
      {selectedBooks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            선택된 도서 ({selectedBooks.length}권)
          </h2>
          
          <div className="space-y-4">
            {selectedBooks.map((book) => (
              <Card key={book.isbn || book.title} className="p-4">
                <div className="flex gap-4">
                  {/* 도서 정보 */}
                  <div className="flex-1">
                    <BookCard
                      book={book}
                      showDetails={true}
                      onViewDetails={() => handleBookDetail(book)}
                    />
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-col gap-2 justify-center">
                    <Button
                      onClick={() => handleWriteReview(book)}
                      className="whitespace-nowrap"
                    >
                      독후감 작성
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleBookDetail(book)}
                      className="whitespace-nowrap"
                    >
                      리뷰 보기
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBook(book.isbn)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      제거
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 도움말 */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">검색 도움말</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 도서명, 저자명, ISBN으로 검색할 수 있습니다</li>
          <li>• 검색어는 부분 일치로 동작합니다</li>
          <li>• 최근 검색어와 인기 도서를 확인할 수 있습니다</li>
          <li>• 검색 결과에서 도서를 선택하면 독후감 작성이나 리뷰 확인이 가능합니다</li>
        </ul>
      </Card>
    </div>
  )
}