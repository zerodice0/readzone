/**
 * 사용자 상호작용 관련 데이터베이스 엔티티 타입
 * - 좋아요, 댓글, 팔로우 등 소셜 기능에 사용
 * - 알림 시스템과 연계
 */

import type { User } from './user'

/** 좋아요 엔티티 (Prisma Like 모델) */
export interface Like {
  id: string
  userId: string
  reviewId: string
  createdAt: Date
}

/** 댓글 엔티티 (Prisma Comment 모델) */
export interface Comment {
  id: string
  content: string
  parentId?: string | null      // 답글인 경우 부모 댓글 ID
  createdAt: Date
  updatedAt: Date
  userId: string
  reviewId: string
}

/** 댓글 + 작성자 정보 - 댓글 목록 표시용 */
export interface CommentWithUser extends Comment {
  user: User
  replies?: CommentWithUser[]   // 답글 목록 (중첩 댓글)
}

/** 팔로우 관계 엔티티 (Prisma Follow 모델) */
export interface Follow {
  id: string
  followerId: string            // 팔로우 하는 사용자
  followingId: string           // 팔로우 받는 사용자
  createdAt: Date
}

/** 팔로우 관계 + 사용자 정보 - 팔로우 목록용 */
export interface FollowWithUser extends Follow {
  follower: User                // 팔로워 정보
  following: User               // 팔로잉 정보
}