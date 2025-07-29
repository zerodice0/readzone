'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { Clock, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TabNavigation, type SearchTabId } from './tab-navigation'
import { CommunityBookTab } from './community-book-tab'
import { KakaoBookTab } from './kakao-book-tab'
import { ManualInputTab } from './manual-input-tab'
import { BookItem } from './book-item'
import type { SelectedBook } from '@/types/book-selector'
import toast from 'react-hot-toast'

interface BookSelectorProps {
  onSelect: (book: SelectedBook) => void
  className?: string
}

interface BookSelectorState {
  // 현재 활성 탭
  activeTab: SearchTabId
  
  // 공통 상태
  recentBooks: SelectedBook[]
}

export function BookSelector({ onSelect, className = '' }: BookSelectorProps) {
  const [state, setState] = useState<BookSelectorState>({
    activeTab: 'community',
    recentBooks: []
  })

  // 탭 전환 처리
  const handleTabChange = useCallback((tabId: SearchTabId) => {
    setState(prev => ({
      ...prev,
      activeTab: tabId
    }))
  }, [])

  // 도서 선택 처리
  const handleBookSelect = useCallback(async (book: any) => {
    // Ensure the book has an id before processing
    if (!book.id) {
      toast.error('도서 ID가 없습니다.')
      return
    }

    const selectedBook: SelectedBook = {
      id: book.id,
      title: book.title,
      authors: book.authors,
      thumbnail: book.thumbnail,
      publisher: book.publisher,
      genre: book.genre,
      isbn: book.isbn,
      isManualEntry: book.isManualEntry
    }
    try {
      onSelect(selectedBook)
      
      // 최근 선택 목록에 추가
      setState(prev => ({
        ...prev,
        recentBooks: [selectedBook, ...prev.recentBooks.filter(b => b.id !== selectedBook.id)].slice(0, 5)
      }))
      
      toast.success(`"${selectedBook.title}" 선택되었습니다.`)
    } catch (error) {
      console.error('도서 선택 실패:', error)
      toast.error('도서 선택 중 오류가 발생했습니다.')
    }
  }, [onSelect])

  // 최근 선택한 도서 로드
  useEffect(() => {
    const loadRecentBooks = async () => {
      try {
        const response = await fetch('/api/books/recent')
        if (response.ok) {
          const result = await response.json()
          setState(prev => ({
            ...prev,
            recentBooks: result.data || []
          }))
        }
      } catch (error) {
        console.error('최근 도서 로드 실패:', error)
      }
    }

    loadRecentBooks()
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 탭 네비게이션 */}
      <TabNavigation 
        activeTab={state.activeTab}
        onTabChange={handleTabChange}
      />

      {/* 탭 패널들 */}
      <div className="min-h-[400px]">
        <CommunityBookTab
          onSelect={handleBookSelect}
          isActive={state.activeTab === 'community'}
        />
        
        <KakaoBookTab
          onSelect={handleBookSelect}
          isActive={state.activeTab === 'kakao'}
        />
        
        <ManualInputTab
          onSelect={handleBookSelect}
          isActive={state.activeTab === 'manual'}
        />
      </div>

      {/* 최근 선택한 도서 (모든 탭에서 공통으로 표시) */}
      {state.recentBooks.length > 0 && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
              최근 선택한 도서
            </h3>
          </div>
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            {state.recentBooks.map((book) => (
              <BookItem 
                key={book.id} 
                book={book} 
                onSelect={handleBookSelect}
                variant="recent"
              />
            ))}
          </div>
        </div>
      )}

      {/* 초기 안내 (탭 내용이 없고 최근 도서도 없을 때) */}
      {state.recentBooks.length === 0 && state.activeTab === 'community' && (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-medium mb-2">독후감을 작성할 도서를 선택하세요</h2>
          <p className="text-sm text-gray-500 mb-4">
            커뮤니티 도서를 검색하거나, 새 도서를 찾거나, 직접 입력할 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="추천 검색어">
            <Badge variant="secondary" aria-hidden="true">추천 검색어</Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500" 
              onClick={() => {
                // 커뮤니티 탭에서 검색 실행하는 로직은 CommunityBookTab에서 처리
                // 여기서는 탭만 변경
                handleTabChange('community')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleTabChange('community')
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
              onClick={() => handleTabChange('community')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleTabChange('community')
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
              onClick={() => handleTabChange('community')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleTabChange('community')
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

// 메모이제이션된 버전도 내보내기
export const MemoizedBookSelector = memo(BookSelector)