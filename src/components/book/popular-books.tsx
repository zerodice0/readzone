'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { TrendingUp, Book, Loader2 } from 'lucide-react'
import { getPopularBooks } from '@/lib/api-client'
import type { KakaoBook } from '@/types/kakao'

interface PopularBooksProps {
  onSelect: (book: KakaoBook) => void
}

interface PopularBooksData {
  fiction: KakaoBook[]
  nonFiction: KakaoBook[]
  recent: KakaoBook[]
}

export function PopularBooks({ onSelect }: PopularBooksProps) {
  const [data, setData] = useState<PopularBooksData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'fiction' | 'nonFiction' | 'recent'>('fiction')

  useEffect(() => {
    const fetchPopularBooks = async () => {
      try {
        const response = await getPopularBooks()
        if (response.success && response.data) {
          setData(response.data.data)
        } else {
          setError(response.error?.message || '인기 도서를 불러올 수 없습니다.')
        }
      } catch (error) {
        setError('네트워크 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPopularBooks()
  }, [])

  if (isLoading) {
    return (
      <div className="border-b">
        <div className="px-4 py-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">인기 도서</span>
          </div>
        </div>
        <div className="p-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="border-b">
        <div className="px-4 py-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">인기 도서</span>
          </div>
        </div>
        <div className="p-4 text-center text-sm text-gray-500">
          {error || '인기 도서를 불러올 수 없습니다.'}
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'fiction' as const, label: '소설', books: data.fiction },
    { key: 'nonFiction' as const, label: '자기계발', books: data.nonFiction },
    { key: 'recent' as const, label: '신간', books: data.recent }
  ]

  const activeBooks = data[activeTab] || []

  return (
    <div>
      <div className="px-4 py-3 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">인기 도서</span>
        </div>
        
        {/* 탭 메뉴 */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.books.length > 0 && (
                <span className="ml-1 text-xs opacity-70">
                  {tab.books.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 max-h-60 overflow-y-auto">
        {activeBooks.length > 0 ? (
          activeBooks.slice(0, 8).map((book, index) => (
            <div
              key={`${book.isbn}-${index}`}
              className="flex items-center gap-3 py-2 hover:bg-gray-50 -mx-2 px-2 rounded cursor-pointer group"
              onClick={() => onSelect(book)}
            >
              {/* 순위 */}
              <div className="flex-shrink-0 w-6 text-center">
                <span className={`text-sm font-medium ${
                  index < 3 ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {index + 1}
                </span>
              </div>

              {/* 도서 썸네일 */}
              <div className="flex-shrink-0">
                {book.thumbnail ? (
                  <Image
                    src={book.thumbnail}
                    alt={book.title}
                    width={32}
                    height={40}
                    className="w-8 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-8 h-10 bg-gray-200 rounded flex items-center justify-center">
                    <Book className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>

              {/* 도서 정보 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {book.title}
                </p>
                <p className="text-xs text-gray-600 line-clamp-1">
                  {book.authors.join(', ')}
                </p>
              </div>

              {/* 출판사 */}
              {book.publisher && (
                <div className="flex-shrink-0 text-xs text-gray-500">
                  {book.publisher}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-4 text-center text-sm text-gray-500">
            {activeTab === 'fiction' && '인기 소설이 없습니다.'}
            {activeTab === 'nonFiction' && '인기 자기계발서가 없습니다.'}
            {activeTab === 'recent' && '신간 도서가 없습니다.'}
          </div>
        )}
      </div>
    </div>
  )
}