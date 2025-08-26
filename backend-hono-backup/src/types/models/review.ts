/**
 * 독후감 관련 데이터베이스 엔티티 타입
 * - 독후감 작성, 수정, 조회에 사용
 * - 메인 피드, 독후감 상세 페이지에 활용
 */

import type { User } from './user'
import type { Book } from './book'
import type { Comment, Like } from './interaction'

/** 독후감 기본 엔티티 (Prisma Review 모델) */
export interface Review {
  id: string
  title: string
  content: string
  isRecommended: boolean
  rating?: number | null
  tags?: string | null          // JSON 문자열로 저장
  isPublic: boolean
  status: string                // ReviewStatus enum 값
  createdAt: Date
  updatedAt: Date
  userId: string
  bookId: string
}

/** 독후감 상세 페이지용 - 모든 관련 정보 포함 */
export interface ReviewWithDetails extends Review {
  user: User                    // 작성자 정보
  book: Book                    // 도서 정보
  likes: Like[]                 // 좋아요 목록
  comments: (Comment & {        // 댓글 + 댓글 작성자
    user: User
  })[]
  _count: {
    likes: number               // 좋아요 수
    comments: number            // 댓글 수
  }
}

/** 메인 피드용 독후감 카드 - PRD 01 기반 */
export interface ReviewCard {
  id: string
  content: string               // 미리보기 (150자 제한)
  createdAt: string            // ISO 문자열 형태
  author: {
    id: string
    username: string           // nickname과 동일
    profileImage?: string
  }
  book: {
    id: string
    title: string
    author: string
    cover?: string             // thumbnail과 동일
  }
  stats: {
    likes: number
    comments: number
    shares: number             // 공유 수 (추후 구현)
  }
  userInteraction: {
    isLiked: boolean
    isBookmarked: boolean      // 북마크 기능 (추후 구현)
  } | null                     // 비로그인 시 null
}