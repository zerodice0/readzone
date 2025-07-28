// 기본 댓글 타입
export interface BaseComment {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  parentId: string | null
  depth: number
  isDeleted: boolean
  deletedAt: Date | null
  userId: string
  reviewId: string
}

// 댓글 상세 정보 (사용자, 좋아요 포함)
export interface CommentDetail extends BaseComment {
  user: {
    id: string
    nickname: string
    image: string | null
  }
  replies?: CommentDetail[]
  _count: {
    replies: number
    likes: number
  }
  isLiked?: boolean // 현재 사용자가 좋아요 했는지
  canEdit?: boolean // 현재 사용자가 편집 가능한지
  canDelete?: boolean // 현재 사용자가 삭제 가능한지
}

// 댓글 생성 요청
export interface CreateCommentRequest {
  content: string
  parentId?: string // 대댓글인 경우
}

// 댓글 수정 요청
export interface UpdateCommentRequest {
  content: string
}

// 댓글 목록 응답
export interface CommentsResponse {
  comments: CommentDetail[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
    nextCursor?: string
  }
}

// 댓글 좋아요 응답
export interface CommentLikeResponse {
  success: boolean
  isLiked: boolean
  likesCount: number
}

// 댓글 트리 구조 (대댓글 포함)
export interface CommentTree extends CommentDetail {
  replies: CommentTree[]
}

// 댓글 통계
export interface CommentStats {
  total: number
  topLevel: number // 최상위 댓글 수
  replies: number // 대댓글 수
  deleted: number // 삭제된 댓글 수
}

// Prisma 쿼리용 댓글 include 옵션
export const commentInclude = {
  user: {
    select: {
      id: true,
      nickname: true,
      image: true,
    },
  },
  replies: {
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
    where: {
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
  _count: {
    select: {
      likes: true,
      replies: true,
    },
  },
} as const

// 댓글 정렬 옵션
export type CommentSortOption = 'latest' | 'oldest' | 'most_liked'

// 댓글 필터 옵션
export interface CommentFilters {
  sort?: CommentSortOption
  includeDeleted?: boolean
  parentId?: string | null // null이면 최상위 댓글만, undefined면 모든 댓글
}