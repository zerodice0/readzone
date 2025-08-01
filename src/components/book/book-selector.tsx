'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Clock, BookOpen, Loader2 } from 'lucide-react'
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
  
  // 중복 독후감 확인 상태
  isCheckingDuplicate: boolean
  duplicateCheckError: string | null
}

// 기존 독후감 응답 타입
interface ExistingReviewResponse {
  success: boolean
  data: {
    items: Array<{
      id: string
      title?: string
      createdAt: string
    }>
    pagination: {
      total: number
    }
  }
}

// UX 개선을 위한 메시지 상수
const UX_MESSAGES = {
  CHECKING: '도서 정보를 확인하는 중...',
  EXISTING_REVIEW_FOUND: (title: string) => `📖 ${title}에 대한 기존 독후감이 있습니다!`,
  REDIRECTING: '기존 독후감으로 이동 중...',
  BOOK_SELECTED: (title: string) => `✅ "${title}" 선택되었습니다`,
  SELECTION_ERROR: '도서 선택 중 문제가 발생했습니다. 다시 시도해 주세요.',
  INVALID_BOOK: '올바른 도서 정보가 아닙니다.',
  CHECKING_FAILED_FALLBACK: '도서를 선택했습니다. 계속 진행해 주세요.'
} as const


export function BookSelector({ onSelect, className = '' }: BookSelectorProps) {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [state, setState] = useState<BookSelectorState>({
    activeTab: 'community',
    recentBooks: [],
    isCheckingDuplicate: false,
    duplicateCheckError: null
  })

  // 기존 독후감 확인 함수
  const checkExistingReview = useCallback(async (bookId: string): Promise<{
    id: string
    title?: string
    createdAt: string
  } | null> => {
    // 로그인하지 않은 사용자는 확인 생략
    if (!session?.user?.id) {
      return null
    }

    try {
      const response = await fetch(
        `/api/reviews?userId=${session.user.id}&bookId=${bookId}&limit=1`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // 3초 타임아웃
          signal: AbortSignal.timeout(3000)
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: ExistingReviewResponse = await response.json()
      
      if (data.success && data.data.items.length > 0) {
        return data.data.items[0]
      }
      
      return null
    } catch (error) {
      // 에러 로그 기록 (사용자에게는 표시하지 않음)
      console.error('기존 독후감 확인 실패:', error)
      
      // Graceful degradation - null 반환으로 정상 플로우 진행
      return null
    }
  }, [session?.user?.id])

  // 탭 전환 처리
  const handleTabChange = useCallback((tabId: SearchTabId) => {
    setState(prev => ({
      ...prev,
      activeTab: tabId
    }))
  }, [])

  // 도서 선택 처리 (중복 독후감 방지 로직 포함)
  const handleBookSelect = useCallback(async (book: any) => {
    // 1. 기본 검증
    if (!book.id) {
      toast.error(UX_MESSAGES.INVALID_BOOK, {
        icon: '⚠️',
        ariaProps: {
          role: 'alert',
          'aria-live': 'assertive'
        }
      })
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

    // 2. 중복 독후감 확인 (로그인한 사용자만)
    if (session?.user?.id) {
      setState(prev => ({ ...prev, isCheckingDuplicate: true, duplicateCheckError: null }))
      
      // 향상된 로딩 토스트 표시
      const loadingToastId = toast.loading(UX_MESSAGES.CHECKING, {
        icon: '🔍',
        ariaProps: {
          role: 'status',
          'aria-live': 'polite'
        }
      })

      try {
        const existingReview = await checkExistingReview(book.id)
        
        // 로딩 토스트 해제
        toast.dismiss(loadingToastId)

        if (existingReview) {
          // 기존 독후감 발견 시 향상된 피드백
          const redirectToastId = toast.success(UX_MESSAGES.EXISTING_REVIEW_FOUND(selectedBook.title), {
            duration: 4000,
            icon: '📖',
            ariaProps: {
              role: 'alert',
              'aria-live': 'assertive'
            }
          })
          
          // 리다이렉션 진행 표시
          setTimeout(() => {
            toast.loading(UX_MESSAGES.REDIRECTING, {
              id: redirectToastId,
              icon: '🔄',
              duration: 1000
            })
          }, 1500)
          
          // 즉시 기존 독후감 상세 페이지로 이동
          router.push(`/review/${existingReview.id}`)
          return
        }

        // 3. 기존 독후감이 없는 경우 정상 플로우 진행
        onSelect(selectedBook)
        
        // 최근 선택 목록에 추가
        setState(prev => ({
          ...prev,
          recentBooks: [selectedBook, ...prev.recentBooks.filter(b => b.id !== selectedBook.id)].slice(0, 5),
          isCheckingDuplicate: false
        }))
        
        // 향상된 성공 메시지
        toast.success(UX_MESSAGES.BOOK_SELECTED(selectedBook.title), {
          icon: '✅',
          duration: 3000,
          ariaProps: {
            role: 'status',
            'aria-live': 'polite'
          }
        })

      } catch (error) {
        // 중복 확인 실패 시 향상된 Graceful Degradation
        toast.dismiss(loadingToastId)
        console.error('독후감 중복 확인 실패:', error)
        
        setState(prev => ({ 
          ...prev, 
          isCheckingDuplicate: false,
          duplicateCheckError: error instanceof Error ? error.message : '확인 실패'
        }))
        
        // 정상 플로우로 진행 (사용자 경험 보호)
        onSelect(selectedBook)
        
        setState(prev => ({
          ...prev,
          recentBooks: [selectedBook, ...prev.recentBooks.filter(b => b.id !== selectedBook.id)].slice(0, 5)
        }))
        
        // 부드러운 fallback 메시지 (에러를 숨기면서도 진행 상황 안내)
        toast.success(UX_MESSAGES.CHECKING_FAILED_FALLBACK, {
          icon: '📚',
          duration: 2500,
          ariaProps: {
            role: 'status',
            'aria-live': 'polite'
          }
        })
      }
    } else {
      // 4. 로그인하지 않은 사용자는 즉시 정상 플로우 진행
      try {
        onSelect(selectedBook)
        
        setState(prev => ({
          ...prev,
          recentBooks: [selectedBook, ...prev.recentBooks.filter(b => b.id !== selectedBook.id)].slice(0, 5)
        }))
        
        // 비로그인 사용자를 위한 친근한 메시지
        toast.success(UX_MESSAGES.BOOK_SELECTED(selectedBook.title), {
          icon: '✅',
          duration: 3000,
          ariaProps: {
            role: 'status',
            'aria-live': 'polite'
          }
        })
      } catch (error) {
        console.error('도서 선택 실패:', error)
        toast.error(UX_MESSAGES.SELECTION_ERROR, {
          icon: '⚠️',
          duration: 4000,
          ariaProps: {
            role: 'alert',
            'aria-live': 'assertive'
          }
        })
      }
    }
  }, [onSelect, session?.user?.id, checkExistingReview, router])

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
      {/* 중복 확인 중 상태 표시 */}
      {state.isCheckingDuplicate && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {UX_MESSAGES.CHECKING}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                기존 독후감이 있는지 확인하고 있습니다...
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 탭 네비게이션 */}
      <div className={state.isCheckingDuplicate ? 'opacity-75 pointer-events-none' : ''}>
        <TabNavigation 
          activeTab={state.activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* 탭 패널들 */}
      <div className={`min-h-[400px] ${state.isCheckingDuplicate ? 'opacity-75 pointer-events-none' : ''}`}>
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
                showReviewStatus={true}
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