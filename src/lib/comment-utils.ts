import type { CommentDetail, CommentTree } from '@/types/comment'

/**
 * 댓글을 트리 구조로 변환하는 유틸리티 함수
 */
export function buildCommentTree(comments: CommentDetail[]): CommentTree[] {
  const commentMap = new Map<string, CommentTree>()
  const rootComments: CommentTree[] = []

  // 모든 댓글을 맵에 추가
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  // 트리 구조 구성
  comments.forEach(comment => {
    const commentNode = commentMap.get(comment.id)!
    
    if (comment.parentId) {
      // 대댓글인 경우 부모 댓글의 replies에 추가
      const parentComment = commentMap.get(comment.parentId)
      if (parentComment) {
        parentComment.replies.push(commentNode)
      }
    } else {
      // 최상위 댓글인 경우 루트에 추가
      rootComments.push(commentNode)
    }
  })

  return rootComments
}

/**
 * 댓글 깊이 검증 (최대 1단계만 허용)
 */
export function validateCommentDepth(parentId: string | null, depth: number): boolean {
  return parentId ? depth <= 1 : depth === 0
}

/**
 * 댓글 권한 검증
 */
export function checkCommentPermissions(comment: CommentDetail, currentUserId?: string) {
  const isOwner = currentUserId === comment.userId
  const isNotDeleted = !comment.isDeleted
  
  return {
    canEdit: isOwner && isNotDeleted,
    canDelete: isOwner && isNotDeleted,
    canReply: isNotDeleted && comment.depth === 0, // 최상위 댓글에만 답글 가능
    canLike: !!currentUserId && isNotDeleted,
  }
}

/**
 * 삭제된 댓글 표시 텍스트 가져오기
 */
export function getDeletedCommentText(comment: CommentDetail): string {
  if (!comment.isDeleted) {
    return comment.content
  }
  
  const hasReplies = comment._count.replies > 0
  return hasReplies 
    ? "삭제된 댓글입니다." 
    : "삭제된 댓글입니다."
}

/**
 * 댓글 수 계산 (삭제된 댓글 제외)
 */
export function countActiveComments(comments: CommentDetail[]): number {
  return comments.filter(comment => !comment.isDeleted).length
}

/**
 * 댓글 정렬 함수
 */
export function sortComments(comments: CommentDetail[], sortBy: 'latest' | 'oldest' | 'most_liked'): CommentDetail[] {
  switch (sortBy) {
    case 'latest':
      return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case 'oldest':
      return comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    case 'most_liked':
      return comments.sort((a, b) => b._count.likes - a._count.likes)
    default:
      return comments
  }
}

/**
 * 댓글 텍스트 미리보기 생성 (긴 댓글 자르기)
 */
export function generateCommentPreview(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) {
    return content
  }
  
  return content.substring(0, maxLength) + '...'
}

/**
 * 댓글 내용 검증
 */
export function validateCommentContent(content: string): { isValid: boolean; error?: string } {
  const trimmedContent = content.trim()
  
  if (!trimmedContent) {
    return { isValid: false, error: '댓글 내용을 입력해주세요.' }
  }
  
  if (trimmedContent.length < 2) {
    return { isValid: false, error: '댓글은 2글자 이상 입력해주세요.' }
  }
  
  if (trimmedContent.length > 1000) {
    return { isValid: false, error: '댓글은 1000글자 이하로 입력해주세요.' }
  }
  
  return { isValid: true }
}

/**
 * 댓글 멘션 파싱 (@username 형태)
 */
export function parseMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_가-힣]+)/g
  const mentions = []
  let match
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }
  
  return [...new Set(mentions)] // 중복 제거
}