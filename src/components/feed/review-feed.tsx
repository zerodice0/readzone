'use client'

import { useEffect, useRef, useCallback } from 'react'
// import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ReviewCard } from './review-card'
import { FeedLoading } from './feed-loading'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/store/auth-store'
import { useReviews } from '@/hooks/use-reviews'
import { AlertCircle } from 'lucide-react'

export function ReviewFeed(): JSX.Element {
  // const { data: session } = useSession()
  const { isAuthenticated, isHydrated } = useAuthStore()
  const router = useRouter()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // API로부터 독후감 데이터 가져오기
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useReviews()

  // 무한 스크롤을 위한 Intersection Observer
  useEffect(() => {
    const currentElement = loadMoreRef.current
    if (!currentElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(currentElement)

    return () => {
      observer.unobserve(currentElement)
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleLoginPrompt = useCallback((): void => {
    router.push('/login')
  }, [router])

  // const handleLikeToggle = useCallback((reviewId: string) => {
  //   if (!isAuthenticated) {
  //     handleLoginPrompt()
  //     return
  //   }
  //   // 좋아요 토글 로직은 ReviewCard 내부에서 처리
  // }, [isAuthenticated, handleLoginPrompt])

  // 초기 로딩
  if (isLoading) {
    return <FeedLoading />
  }

  // 에러 상태
  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900 dark:text-red-100">
              독후감을 불러오는데 실패했습니다
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error?.message || '잠시 후 다시 시도해주세요.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 모든 페이지의 독후감을 하나의 배열로 합치기
  const allReviews = data?.pages.flatMap(page => page.items) || []

  return (
    <div className="space-y-6">
      {/* 비로그인 사용자 안내 */}
      {isHydrated && !isAuthenticated && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              ReadZone에 오신 것을 환영합니다!
            </h3>
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              독후감을 공유하고 다른 독자들과 소통하려면 로그인이 필요합니다.
            </p>
            <div className="flex justify-center space-x-3">
              <Button onClick={handleLoginPrompt} size="sm">
                로그인
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/register')}
                size="sm"
              >
                회원가입
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 독후감 목록 */}
      {allReviews.length > 0 ? (
        <div className="space-y-6">
          {allReviews.map((review) => (
            <ReviewCard 
              key={review.id} 
              review={{
                ...review,
                createdAt: new Date(review.createdAt),
                likeCount: review._count.likes,
                commentCount: review._count.comments,
              }}
              showActions={isHydrated && isAuthenticated}
              onLoginRequired={handleLoginPrompt}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            아직 작성된 독후감이 없습니다
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            첫 번째 독후감을 작성해보세요!
          </p>
        </div>
      )}

      {/* 무한 스크롤 트리거 */}
      {allReviews.length > 0 && (
        <div ref={loadMoreRef} className="py-4">
          {isFetchingNextPage && (
            <FeedLoading />
          )}
          {!hasNextPage && allReviews.length > 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
              모든 독후감을 불러왔습니다.
            </p>
          )}
        </div>
      )}
    </div>
  )
}