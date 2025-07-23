'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ReviewCard } from './review-card'
import { FeedLoading } from './feed-loading'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/store/auth-store'

// 임시 데이터 (실제 구현에서는 API에서 가져옴)
const MOCK_REVIEWS = [
  {
    id: '1',
    title: '어린왕자를 읽고',
    content: '어린왕자를 다시 읽으니 어릴 때 느끼지 못했던 감정들이 느껴졌습니다. 특히 장미와의 관계에서 사랑의 진정한 의미를 깨달았고, 여우가 전하는 "길들인다"는 것의 의미가 마음 깊이 와닿았어요. 어른이 되어 읽는 동화는 정말 다른 것 같습니다...',
    book: {
      title: '어린왕자',
      authors: ['앙투안 드 생텍쥐페리'],
      thumbnail: 'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F1467038',
    },
    user: {
      nickname: '독서왕김씨',
      profileImage: null,
    },
    isRecommended: true,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    likeCount: 12,
    commentCount: 3,
    isLiked: false,
  },
  {
    id: '2',
    title: '데미안을 읽고 나서',
    content: '헤르만 헤세의 데미안을 읽으며 자아 성찰의 시간을 가졌습니다. 싱클레어의 성장 과정을 보며 나 자신의 어린 시절을 되돌아보게 되었고, 데미안이라는 인물을 통해 진정한 멘토의 의미를 알게 되었어요. 특히 "새는 알에서 나오려고 투쟁한다"는 구절이 인상 깊었습니다.',
    book: {
      title: '데미안',
      authors: ['헤르만 헤세'],
      thumbnail: 'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F1480027',
    },
    user: {
      nickname: '문학소녀',
      profileImage: null,
    },
    isRecommended: true,
    createdAt: new Date('2024-01-14T14:20:00Z'),
    likeCount: 8,
    commentCount: 5,
    isLiked: true,
  },
  {
    id: '3',
    title: '1984를 읽고 소름이...',
    content: '조지 오웰의 1984를 읽으며 현재 우리 사회의 모습이 떠올라 소름이 돋았습니다. 빅 브라더의 감시 사회, 언어의 왜곡, 역사의 조작... 소설 속 이야기가 현실과 너무 닮아있어서 무서웠어요. 하지만 그렇기에 더욱 의미 있는 책이라고 생각합니다.',
    book: {
      title: '1984',
      authors: ['조지 오웰'],
      thumbnail: 'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5082251',
    },
    user: {
      nickname: '사색하는개발자',
      profileImage: null,
    },
    isRecommended: true,
    createdAt: new Date('2024-01-13T20:15:00Z'),
    likeCount: 15,
    commentCount: 7,
    isLiked: false,
  },
]

export function ReviewFeed(): JSX.Element {
  const { data: session } = useSession()
  const { isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [reviews] = useState(MOCK_REVIEWS)

  const handleLoginPrompt = (): void => {
    // 실제로는 로그인 모달을 표시하거나 로그인 페이지로 리다이렉트
    window.location.href = '/login'
  }

  if (isLoading) {
    return <FeedLoading />
  }

  return (
    <div className="space-y-6">
      {/* 비로그인 사용자 안내 */}
      {!isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              ReadZone에 오신 것을 환영합니다!
            </h3>
            <p className="text-blue-700 mb-4">
              독후감을 공유하고 다른 독자들과 소통하려면 로그인이 필요합니다.
            </p>
            <div className="flex justify-center space-x-3">
              <Button onClick={handleLoginPrompt} size="sm">
                로그인
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/register'}
                size="sm"
              >
                회원가입
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 독후감 목록 */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard 
              key={review.id} 
              review={review}
              showActions={isAuthenticated}
              onLoginRequired={handleLoginPrompt}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            아직 작성된 독후감이 없습니다
          </h3>
          <p className="text-gray-500">
            첫 번째 독후감을 작성해보세요!
          </p>
        </div>
      )}

      {/* 더 보기 버튼 (무한 스크롤 구현 전 임시) */}
      {reviews.length > 0 && (
        <div className="text-center pt-8">
          <Button 
            variant="outline" 
            onClick={() => setIsLoading(true)}
            disabled={isLoading}
          >
            {isLoading ? '로딩 중...' : '더 많은 독후감 보기'}
          </Button>
        </div>
      )}
    </div>
  )
}