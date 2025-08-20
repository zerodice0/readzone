import type { ReviewCard } from '@/types/feed'

/**
 * 공용 더미 데이터 - 메인 피드와 LoginPage에서 공유
 * TODO: 실제 API가 구현되면 이 데이터를 제거하고 실제 API 호출로 교체
 */
export const dummyReviews: ReviewCard[] = [
  {
    id: 'review-1',
    content: '이 책을 읽고 나서 정말 많은 것을 깨달았습니다. 특히 주인공의 성장 과정이 인상적이었고, 작가의 섬세한 심리 묘사가 돋보였습니다. 인생에 대해 다시 생각해보게 되는 책이었어요...',
    createdAt: '2024-08-20T10:30:00Z',
    author: {
      id: 'user-1',
      username: '책벌레김독서',
      profileImage: '/avatars/user-1.jpg'
    },
    book: {
      id: 'book-1',
      title: '어린왕자',
      author: '생텍쥐페리',
      cover: '/covers/little-prince.jpg'
    },
    stats: {
      likes: 42,
      comments: 12,
      shares: 5
    },
    userInteraction: null // 비로그인 상태를 가정
  },
  {
    id: 'review-2', 
    content: '현대 사회의 문제점을 날카롭게 지적한 작품입니다. 작가의 통찰력이 정말 대단하다고 느꼈어요. 특히 3장에서 나온 사회 구조에 대한 분석이 매우 인상깊었습니다...',
    createdAt: '2024-08-20T09:15:00Z',
    author: {
      id: 'user-2',
      username: '사회비평가',
      profileImage: '/avatars/user-2.jpg'
    },
    book: {
      id: 'book-2',
      title: '1984',
      author: '조지 오웰',
      cover: '/covers/1984.jpg'
    },
    stats: {
      likes: 38,
      comments: 9,
      shares: 3
    },
    userInteraction: null
  },
  {
    id: 'review-3',
    content: '마법 같은 이야기였습니다! 판타지 장르를 좋아하지 않았는데, 이 책으로 완전히 마음이 바뀌었어요. 등장인물들의 매력과 상상력 넘치는 세계관이 정말 좋았습니다...',
    createdAt: '2024-08-20T08:45:00Z',
    author: {
      id: 'user-3',
      username: '판타지초보',
      profileImage: '/avatars/user-3.jpg'
    },
    book: {
      id: 'book-3',
      title: '해리포터와 마법사의 돌',
      author: 'J.K. 롤링',
      cover: '/covers/harry-potter-1.jpg'
    },
    stats: {
      likes: 56,
      comments: 18,
      shares: 8
    },
    userInteraction: null
  }
]

/**
 * 인기 독후감 하나를 반환하는 유틸리티 함수
 * LoginPage에서 사용
 */
export const getPopularReview = (): ReviewCard => {
  // 좋아요 수가 가장 높은 리뷰 반환
  return dummyReviews.reduce((prev, current) => 
    prev.stats.likes > current.stats.likes ? prev : current
  )
}

/**
 * 최근 독후감들을 반환하는 유틸리티 함수
 * MainFeed에서 사용 (기존 API 교체 시 사용)
 */
export const getRecentReviews = (limit = 20): ReviewCard[] => {
  return dummyReviews
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}