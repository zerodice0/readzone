/**
 * 알림 관련 데이터베이스 엔티티 타입
 * - 좋아요, 댓글, 팔로우 등의 알림 생성 및 관리
 * - 실시간 알림 시스템에 사용
 */

import type { User } from './user'

/** 알림 엔티티 (Prisma Notification 모델) */
export interface Notification {
  id: string
  type: string                  // NotificationType enum 값
  message: string               // 알림 메시지
  isRead: boolean              // 읽음 상태
  data?: string | null         // JSON 형태의 추가 데이터
  createdAt: Date
  userId: string               // 알림 받는 사용자
  senderId?: string | null     // 알림 보낸 사용자 (시스템 알림은 null)
  reviewId?: string | null     // 관련 독후감 ID
  commentId?: string | null    // 관련 댓글 ID
}

/** 알림 + 발신자 정보 - 알림 목록 표시용 */
export interface NotificationWithSender extends Notification {
  sender?: User                // 알림 발신자 정보 (있는 경우)
}

/** 알림 타입별 추가 데이터 구조 */
export interface NotificationData {
  like: {
    reviewTitle: string        // 독후감 제목
  }
  comment: {
    reviewTitle: string        // 독후감 제목
    commentPreview: string     // 댓글 미리보기 (50자)
  }
  reply: {
    reviewTitle: string        // 독후감 제목
    originalComment: string    // 원본 댓글 미리보기
    replyPreview: string       // 답글 미리보기
  }
  follow: Record<string, never>  // 팔로우 알림은 추가 데이터 없음
  system: {
    actionUrl?: string         // 시스템 알림 액션 URL
  }
}