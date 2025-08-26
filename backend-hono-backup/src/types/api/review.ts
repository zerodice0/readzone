/**
 * 독후감 CRUD API 요청/응답 타입
 * - 독후감 작성, 수정, 삭제, 조회에 사용
 * - 댓글 작성, 수정, 삭제 포함
 */

/** 독후감 작성 요청 */
export interface CreateReviewRequest {
  title: string
  content: string
  bookId: string
  isRecommended: boolean
  rating?: number              // 1-5 점수 (선택사항)
  tags?: string[]              // 태그 배열
  isPublic?: boolean           // 공개/비공개 (기본: true)
}

/** 독후감 수정 요청 */
export interface UpdateReviewRequest {
  title?: string
  content?: string
  isRecommended?: boolean
  rating?: number
  tags?: string[]
  isPublic?: boolean
}

/** 독후감 목록 조회 요청 */
export interface GetReviewsRequest {
  bookId?: string              // 특정 도서의 독후감만
  userId?: string              // 특정 사용자의 독후감만
  status?: 'published' | 'draft' | 'archived'
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'likes' | 'comments'
  order?: 'asc' | 'desc'
}

/** 댓글 작성 요청 */
export interface CreateCommentRequest {
  content: string
  parentId?: string            // 답글인 경우 부모 댓글 ID
}

/** 댓글 수정 요청 */
export interface UpdateCommentRequest {
  content: string
}

/** 댓글 목록 조회 요청 */
export interface GetCommentsRequest {
  reviewId: string
  page?: number
  limit?: number
  includeReplies?: boolean     // 답글 포함 여부 (기본: true)
}