/**
 * 메인 피드 API 요청/응답 타입
 * - PRD 01 (메인 피드) 구현을 위한 타입 정의
 * - 무한 스크롤, 탭별 피드, 상호작용 API
 */

import type { ReviewCard } from '../models/review'

// Re-export ReviewCard for convenience
export type { ReviewCard }

/** 피드 요청 파라미터 - PRD 01 기반 */
export interface FeedRequest {
  tab: 'recommended' | 'latest' | 'following'
  cursor?: string              // 무한 스크롤용 커서
  limit: number                // 기본값: 20
}

/** 피드 응답 - PRD 01 기반 */
export interface FeedResponse {
  reviews: ReviewCard[]
  nextCursor: string | null
  hasMore: boolean
}

/** 좋아요 토글 요청 - PRD 01 기반 */
export interface LikeRequest {
  action: 'like' | 'unlike'
}

/** 좋아요 토글 응답 - PRD 01 기반 */
export interface LikeResponse {
  success: boolean
  likesCount: number
  isLiked: boolean
}

/** 공유 요청 (추후 구현) */
export interface ShareRequest {
  platform: 'kakao' | 'twitter' | 'link'
}

/** 공유 응답 */
export interface ShareResponse {
  success: boolean
  shareUrl?: string            // 링크 공유 시 URL
  sharesCount: number          // 업데이트된 공유 수
}