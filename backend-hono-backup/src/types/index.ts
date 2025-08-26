/**
 * 백엔드 타입 정의 메인 진입점
 * - 도메인별로 분리된 타입 모듈들의 재export
 * - 가독성과 유지보수성을 위한 구조화된 타입 시스템
 */

// ===== 데이터베이스 엔티티 타입 =====
// Prisma 스키마와 1:1 매핑되는 도메인 엔티티
export * from './models/user'
export * from './models/book'
export * from './models/review'
export * from './models/interaction'
export * from './models/notification'

// ===== API 요청/응답 타입 =====
// 클라이언트-서버 간 통신을 위한 인터페이스
export * from './api/common'
export * from './api/auth'
export * from './api/feed'
export * from './api/review'
export * from './api/book'

// ===== 외부 서비스 타입 =====
// 서드파티 API 연동을 위한 타입 정의
export * from './external/kakao'

// ===== 공통 유틸리티 타입 =====
// 애플리케이션 전반에서 사용하는 공통 타입
export * from './common/enums'

// ===== 편의를 위한 타입 재export =====
// 자주 사용되는 핵심 타입들을 별도로 재export

/** 피드 관련 핵심 타입 (PRD 01) */
export type {
  FeedRequest,
  FeedResponse,
  ReviewCard,
  LikeRequest,
  LikeResponse
} from './api/feed'

/** 인증 관련 핵심 타입 */
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  JWTPayload
} from './api/auth'

/** 도서 검색 핵심 타입 */
export type {
  SearchBooksRequest,
  SearchBooksResponse,
  BookSearchResult
} from './api/book'

/** 사용자 엔티티 핵심 타입 */
export type {
  User,
  UserProfile,
  UserStats
} from './models/user'

/** 독후감 엔티티 핵심 타입 */
export type {
  Review,
  ReviewWithDetails
} from './models/review'

/** 공통 열거형 타입 */
export type {
  FeedTab,
  BookSource,
  ReviewStatus,
  NotificationType,
  SortOrder
} from './common/enums'