/**
 * 애플리케이션 전반에서 사용하는 열거형 타입
 * - SQLite에서 ENUM 대신 string literal 사용
 * - 타입 안전성 보장 및 오타 방지
 */

/** 도서 등록 소스 */
export type BookSource = 
  | 'KAKAO_API'     // 카카오 도서 검색 API
  | 'DATABASE'      // 기존 DB에서 검색
  | 'MANUAL'        // 사용자 수동 입력

/** 독후감 상태 */
export type ReviewStatus = 
  | 'DRAFT'         // 임시저장
  | 'PUBLISHED'     // 발행됨
  | 'ARCHIVED'      // 보관됨 (비공개 전환)

/** 알림 타입 */
export type NotificationType = 
  | 'LIKE'          // 좋아요 알림
  | 'COMMENT'       // 댓글 알림
  | 'REPLY'         // 답글 알림
  | 'FOLLOW'        // 팔로우 알림
  | 'SYSTEM'        // 시스템 알림

/** 사용자 역할 (추후 확장용) */
export type UserRole = 
  | 'USER'          // 일반 사용자
  | 'MODERATOR'     // 중재자
  | 'ADMIN'         // 관리자

/** 신고 유형 (추후 확장용) */
export type ReportType = 
  | 'SPAM'          // 스팸
  | 'INAPPROPRIATE' // 부적절한 콘텐츠
  | 'HARASSMENT'    // 괴롭힘
  | 'COPYRIGHT'     // 저작권 침해
  | 'FAKE_INFO'     // 허위 정보
  | 'OTHER'         // 기타

/** 정렬 순서 */
export type SortOrder = 'asc' | 'desc'

/** 피드 탭 타입 */
export type FeedTab = 'recommended' | 'latest' | 'following'

/** 공유 플랫폼 */
export type SharePlatform = 'kakao' | 'twitter' | 'facebook' | 'link'