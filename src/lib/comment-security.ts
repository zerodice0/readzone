import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import DOMPurify from 'isomorphic-dompurify'

/**
 * 댓글 보안 및 권한 관리 유틸리티
 */

// 댓글 작성 제한 설정
export const COMMENT_LIMITS = {
  MAX_COMMENTS_PER_HOUR: 50, // 시간당 최대 댓글 수
  MAX_COMMENTS_PER_DAY: 200, // 일당 최대 댓글 수
  MAX_DEPTH: 1, // 최대 댓글 깊이 (0: 최상위, 1: 대댓글)
  CONTENT_MIN_LENGTH: 2,
  CONTENT_MAX_LENGTH: 1000,
  EDIT_TIME_LIMIT: 24 * 60 * 60 * 1000, // 24시간 (ms)
} as const

/**
 * 사용자 인증 및 세션 검증
 */
export async function validateAuthSession() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return {
      success: false,
      error: {
        errorType: 'UNAUTHORIZED' as const,
        message: '로그인이 필요합니다.',
        statusCode: 401,
      },
    }
  }

  return {
    success: true,
    user: {
      id: session.user.id,
      nickname: session.user.nickname,
      email: session.user.email,
    },
  }
}

/**
 * 독후감 존재 여부 및 접근 권한 확인
 */
export async function validateReviewAccess(reviewId: string) {
  try {
    const review = await prisma.bookReview.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    })

    if (!review) {
      return {
        success: false,
        error: {
          errorType: 'NOT_FOUND' as const,
          message: '독후감을 찾을 수 없습니다.',
          statusCode: 404,
        },
      }
    }

    return {
      success: true,
      review,
    }
  } catch (error) {
    logger.error('Review access validation failed', { reviewId, error })
    return {
      success: false,
      error: {
        errorType: 'INTERNAL_ERROR' as const,
        message: '독후감 조회 중 오류가 발생했습니다.',
        statusCode: 500,
      },
    }
  }
}

/**
 * 댓글 존재 여부 및 권한 확인
 */
export async function validateCommentAccess(commentId: string, userId?: string) {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        content: true,
        userId: true,
        parentId: true,
        depth: true,
        isDeleted: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
        review: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    })

    if (!comment) {
      return {
        success: false,
        error: {
          errorType: 'NOT_FOUND' as const,
          message: '댓글을 찾을 수 없습니다.',
          statusCode: 404,
        },
      }
    }

    // 삭제된 댓글인지 확인
    if (comment.isDeleted) {
      return {
        success: false,
        error: {
          errorType: 'GONE' as const,
          message: '삭제된 댓글입니다.',
          statusCode: 410,
        },
      }
    }

    // 소유자 권한 확인
    const isOwner = userId === comment.userId
    const isReviewOwner = userId === comment.review.userId

    return {
      success: true,
      comment,
      permissions: {
        canEdit: isOwner,
        canDelete: isOwner || isReviewOwner, // 댓글 작성자 또는 독후감 작성자
        canReply: comment.depth === 0, // 최상위 댓글에만 답글 가능
      },
    }
  } catch (error) {
    logger.error('Comment access validation failed', { commentId, userId, error })
    return {
      success: false,
      error: {
        errorType: 'INTERNAL_ERROR' as const,
        message: '댓글 조회 중 오류가 발생했습니다.',
        statusCode: 500,
      },
    }
  }
}

/**
 * 대댓글 깊이 검증
 */
export async function validateReplyDepth(parentId: string) {
  try {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        depth: true,
        isDeleted: true,
      },
    })

    if (!parentComment) {
      return {
        success: false,
        error: {
          errorType: 'NOT_FOUND' as const,
          message: '부모 댓글을 찾을 수 없습니다.',
          statusCode: 404,
        },
      }
    }

    if (parentComment.isDeleted) {
      return {
        success: false,
        error: {
          errorType: 'GONE' as const,
          message: '삭제된 댓글에는 답글을 달 수 없습니다.',
          statusCode: 410,
        },
      }
    }

    // 깊이 제한 확인 (1단계만 허용)
    if (parentComment.depth >= COMMENT_LIMITS.MAX_DEPTH) {
      return {
        success: false,
        error: {
          errorType: 'FORBIDDEN' as const,
          message: '더 이상 답글을 달 수 없습니다.',
          statusCode: 403,
        },
      }
    }

    return {
      success: true,
      parentComment,
      newDepth: parentComment.depth + 1,
    }
  } catch (error) {
    logger.error('Reply depth validation failed', { parentId, error })
    return {
      success: false,
      error: {
        errorType: 'INTERNAL_ERROR' as const,
        message: '답글 검증 중 오류가 발생했습니다.',
        statusCode: 500,
      },
    }
  }
}

/**
 * 댓글 작성 제한 확인 (스팸 방지)
 */
export async function validateCommentRateLimit(userId: string) {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // 시간당 댓글 수 확인
    const hourlyCount = await prisma.comment.count({
      where: {
        userId,
        createdAt: {
          gte: oneHourAgo,
        },
        isDeleted: false,
      },
    })

    if (hourlyCount >= COMMENT_LIMITS.MAX_COMMENTS_PER_HOUR) {
      return {
        success: false,
        error: {
          errorType: 'RATE_LIMITED' as const,
          message: '시간당 댓글 작성 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          statusCode: 429,
        },
      }
    }

    // 일당 댓글 수 확인
    const dailyCount = await prisma.comment.count({
      where: {
        userId,
        createdAt: {
          gte: oneDayAgo,
        },
        isDeleted: false,
      },
    })

    if (dailyCount >= COMMENT_LIMITS.MAX_COMMENTS_PER_DAY) {
      return {
        success: false,
        error: {
          errorType: 'RATE_LIMITED' as const,
          message: '일일 댓글 작성 한도를 초과했습니다.',
          statusCode: 429,
        },
      }
    }

    return {
      success: true,
      limits: {
        hourlyUsed: hourlyCount,
        hourlyLimit: COMMENT_LIMITS.MAX_COMMENTS_PER_HOUR,
        dailyUsed: dailyCount,
        dailyLimit: COMMENT_LIMITS.MAX_COMMENTS_PER_DAY,
      },
    }
  } catch (error) {
    logger.error('Comment rate limit validation failed', { userId, error })
    return {
      success: false,
      error: {
        errorType: 'INTERNAL_ERROR' as const,
        message: '댓글 제한 확인 중 오류가 발생했습니다.',
        statusCode: 500,
      },
    }
  }
}

/**
 * 댓글 편집 시간 제한 확인
 */
export function validateEditTimeLimit(commentCreatedAt: Date): boolean {
  const now = new Date()
  const timeDiff = now.getTime() - commentCreatedAt.getTime()
  return timeDiff <= COMMENT_LIMITS.EDIT_TIME_LIMIT
}

/**
 * 댓글 내용 보안 검증 및 정제
 */
export function sanitizeCommentContent(content: string): {
  success: boolean
  content?: string
  error?: string
} {
  try {
    // 기본 트리밍
    const trimmed = content.trim()

    // 길이 검증
    if (trimmed.length < COMMENT_LIMITS.CONTENT_MIN_LENGTH) {
      return {
        success: false,
        error: `댓글은 ${COMMENT_LIMITS.CONTENT_MIN_LENGTH}자 이상 입력해주세요.`,
      }
    }

    if (trimmed.length > COMMENT_LIMITS.CONTENT_MAX_LENGTH) {
      return {
        success: false,
        error: `댓글은 ${COMMENT_LIMITS.CONTENT_MAX_LENGTH}자 이하로 입력해주세요.`,
      }
    }

    // 의미 있는 내용인지 확인 (공백 제거 후)
    const meaningfulContent = trimmed.replace(/\s/g, '')
    if (meaningfulContent.length < COMMENT_LIMITS.CONTENT_MIN_LENGTH) {
      return {
        success: false,
        error: '의미 있는 댓글을 입력해주세요.',
      }
    }

    // HTML 태그 제거 및 보안 정제
    const sanitized = DOMPurify.sanitize(trimmed, {
      ALLOWED_TAGS: [], // HTML 태그 모두 제거
      ALLOWED_ATTR: [],
    })

    // 악성 패턴 검사
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:.*base64/i,
    ]

    const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
      pattern.test(sanitized)
    )

    if (hasSuspiciousContent) {
      return {
        success: false,
        error: '허용되지 않는 내용이 포함되어 있습니다.',
      }
    }

    return {
      success: true,
      content: sanitized,
    }
  } catch (error) {
    logger.error('Comment content sanitization failed', { content, error })
    return {
      success: false,
      error: '댓글 내용 검증 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 댓글 작업 로깅
 */
export function logCommentAction(
  action: 'create' | 'update' | 'delete' | 'like' | 'unlike',
  data: {
    userId: string
    commentId?: string
    reviewId?: string
    parentId?: string
    ipAddress?: string
  }
) {
  logger.info(`Comment ${action}`, {
    action,
    userId: data.userId,
    commentId: data.commentId,
    reviewId: data.reviewId,
    parentId: data.parentId,
    ipAddress: data.ipAddress,
    timestamp: new Date().toISOString(),
  })
}