/**
 * 모든 API에서 공통으로 사용하는 응답 타입
 * - 표준 API 응답 형식 정의
 * - 페이지네이션, 에러 응답 등
 */

/** 표준 API 응답 래퍼 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/** 페이지네이션 응답 타입 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

/** 커서 기반 페이지네이션 (무한 스크롤용) */
export interface CursorPaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

/** 검색 요청 공통 파라미터 */
export interface SearchQuery {
  query: string
  page?: number
  limit?: number
}

/** 정렬 옵션 */
export type SortOrder = 'asc' | 'desc'

/** 공통 정렬 파라미터 */
export interface SortParams {
  sortBy?: string
  order?: SortOrder
}