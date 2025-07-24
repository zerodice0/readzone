# Comment API Documentation

## Overview

ReadZone 댓글 시스템의 완전한 CRUD API 문서입니다. 보안, 인증, 권한 관리, 입력 검증, 스팸 방지 등을 포함한 엔터프라이즈급 댓글 시스템을 제공합니다.

## API Endpoints

### 1. 댓글 목록 조회 및 작성

#### GET `/api/reviews/[id]/comments`
독후감의 댓글 목록을 조회합니다.

**Query Parameters:**
```typescript
{
  page?: number        // 페이지 번호 (기본값: 1)
  limit?: number       // 페이지당 개수 (기본값: 20, 최대: 50)
  sort?: 'latest' | 'oldest' | 'most_liked'  // 정렬 방식 (기본값: latest)
  parentId?: string    // 특정 부모 댓글의 답글만 조회
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    comments: CommentTree[]     // 트리 구조 댓글 목록
    pagination: {
      page: number
      limit: number
      total: number
      hasMore: boolean
      nextCursor?: string
    }
    meta: {
      sort: string
      parentId: string | null
      isAuthenticated: boolean
    }
  }
}
```

#### POST `/api/reviews/[id]/comments`
새 댓글을 작성합니다.

**Authentication:** Required  
**Rate Limiting:** 50회/시간, 200회/일

**Request Body:**
```typescript
{
  content: string      // 댓글 내용 (2-1000자)
  parentId?: string    // 대댓글인 경우 부모 댓글 ID
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    comment: CommentDetail
    message: string
  }
}
```

### 2. 개별 댓글 관리

#### GET `/api/comments/[id]`
댓글 상세 정보를 조회합니다.

**Response:**
```typescript
{
  success: boolean
  data: {
    comment: CommentDetail
  }
}
```

#### PUT `/api/comments/[id]`
댓글을 수정합니다.

**Authentication:** Required  
**Authorization:** 댓글 작성자만 가능  
**Time Limit:** 작성 후 24시간 이내

**Request Body:**
```typescript
{
  content: string      // 수정할 댓글 내용 (2-1000자)
}
```

#### DELETE `/api/comments/[id]`
댓글을 삭제합니다 (소프트 삭제).

**Authentication:** Required  
**Authorization:** 댓글 작성자 또는 독후감 작성자

**Behavior:**
- 답글이 있는 경우: 내용만 "삭제된 댓글입니다"로 변경
- 답글이 없는 경우: 완전 숨김 처리
- 관련 좋아요는 모두 삭제

### 3. 댓글 좋아요

#### POST `/api/comments/[id]/like`
댓글 좋아요를 토글합니다.

**Authentication:** Required

**Response:**
```typescript
{
  success: boolean
  data: {
    isLiked: boolean
    likeCount: number
    message: string
  }
}
```

#### DELETE `/api/comments/[id]/like`
댓글 좋아요를 명시적으로 취소합니다.

**Authentication:** Required

## Data Models

### CommentDetail
```typescript
interface CommentDetail {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  parentId: string | null
  depth: number              // 0: 최상위, 1: 대댓글
  isDeleted: boolean
  deletedAt: Date | null
  userId: string
  reviewId: string
  user: {
    id: string
    nickname: string
    image: string | null
  }
  replies?: CommentDetail[]  // 대댓글 목록
  _count: {
    replies: number
    likes: number
  }
  isLiked?: boolean         // 현재 사용자의 좋아요 여부
  canEdit?: boolean         // 수정 권한
  canDelete?: boolean       // 삭제 권한
  canReply?: boolean        // 답글 권한 (최상위만 가능)
}
```

### CommentTree
```typescript
interface CommentTree extends CommentDetail {
  replies: CommentTree[]    // 재귀적 트리 구조
}
```

## Security Features

### 1. Authentication & Authorization
- **JWT 기반 인증**: NextAuth.js 세션 검증
- **권한 기반 접근 제어**: 댓글 작성자/독후감 작성자 권한 확인
- **시간 기반 제한**: 댓글 수정은 작성 후 24시간 이내만 가능

### 2. Input Validation & Sanitization
- **Zod 스키마 검증**: 모든 입력 데이터 타입 및 형식 검증
- **HTML 태그 제거**: DOMPurify를 사용한 XSS 방지
- **내용 길이 제한**: 2-1000자 범위 강제
- **의미 있는 내용 검증**: 공백만 있는 댓글 거부

### 3. Rate Limiting & Spam Prevention
- **시간당 제한**: 사용자당 50회/시간
- **일일 제한**: 사용자당 200회/일
- **깊이 제한**: 1단계 대댓글까지만 허용
- **자기 좋아요 방지**: 본인 댓글에 좋아요 불가

### 4. Security Headers & Logging
- **IP 주소 추적**: 모든 댓글 작업 IP 로깅
- **보안 이벤트 로깅**: 생성/수정/삭제/좋아요 작업 추적
- **악성 패턴 감지**: 스크립트 삽입 시도 차단

## Performance Optimizations

### 1. Database Indexes
```sql
-- Comment 테이블 인덱스
CREATE INDEX Comment_reviewId_createdAt_idx ON Comment(reviewId, createdAt);
CREATE INDEX Comment_userId_idx ON Comment(userId);
CREATE INDEX Comment_parentId_idx ON Comment(parentId);
CREATE INDEX Comment_isDeleted_idx ON Comment(isDeleted);

-- CommentLike 테이블 인덱스
CREATE INDEX CommentLike_commentId_idx ON CommentLike(commentId);
CREATE UNIQUE INDEX CommentLike_userId_commentId_key ON CommentLike(userId, commentId);
```

### 2. Query Optimizations
- **선택적 관계 로딩**: 필요한 관계만 include
- **트랜잭션 처리**: 좋아요 토글 등 원자적 작업
- **페이지네이션**: 커서 기반 무한 스크롤 지원
- **소프트 삭제**: 답글 구조 유지

### 3. Caching Strategy
- **읽기 최적화**: isDeleted=false 인덱스 활용
- **카운트 최적화**: _count 관계 활용
- **트리 구조 캐싱**: 클라이언트 사이드 트리 빌딩

## Error Handling

### HTTP Status Codes
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청 (INVALID_PARAMS, INVALID_INPUT, INVALID_CONTENT)
- `401`: 인증 필요 (UNAUTHORIZED)
- `403`: 권한 없음 (FORBIDDEN)
- `404`: 리소스 없음 (NOT_FOUND)
- `410`: 삭제된 리소스 (GONE)
- `429`: 요청 제한 (RATE_LIMITED)
- `500`: 서버 오류 (INTERNAL_ERROR)

### Error Response Format
```typescript
{
  success: false
  error: {
    errorType: string     // 에러 타입 코드
    message: string       // 사용자 친화적 메시지
    details?: object      // 상세 검증 오류 (선택적)
  }
}
```

## Usage Examples

### 1. 댓글 목록 조회
```javascript
// 최신순으로 첫 페이지 조회
const response = await fetch('/api/reviews/review123/comments?sort=latest&page=1&limit=20')
const { data } = await response.json()

// 트리 구조로 댓글과 대댓글 표시
data.comments.forEach(comment => {
  console.log(comment.content)
  comment.replies?.forEach(reply => {
    console.log(`  └─ ${reply.content}`)
  })
})
```

### 2. 댓글 작성
```javascript
// 최상위 댓글 작성
const response = await fetch('/api/reviews/review123/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: '정말 좋은 독후감이네요!'
  })
})

// 대댓글 작성
const replyResponse = await fetch('/api/reviews/review123/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: '저도 동감입니다.',
    parentId: 'comment123'
  })
})
```

### 3. 댓글 좋아요
```javascript
// 좋아요 토글
const response = await fetch('/api/comments/comment123/like', {
  method: 'POST'
})
const { data } = await response.json()
console.log(`좋아요 ${data.isLiked ? '추가' : '취소'}, 총 ${data.likeCount}개`)
```

## Testing

종합적인 테스트 스위트가 포함되어 있습니다:

```bash
# 전체 댓글 API 테스트 실행
npx tsx src/scripts/test-comment-api.ts
```

**테스트 범위:**
- ✅ 데이터베이스 스키마 검증
- ✅ CRUD 작업 테스트
- ✅ 보안 기능 검증
- ✅ 유틸리티 함수 테스트
- ✅ 성능 및 인덱스 검증
- ✅ 자동 데이터 정리

## Migration Notes

기존 Comment 모델에서 확장된 기능:
- ✅ `parentId`, `depth` 필드 추가 (대댓글 지원)
- ✅ `isDeleted`, `deletedAt` 필드 추가 (소프트 삭제)
- ✅ `CommentLike` 모델 추가 (좋아요 시스템)
- ✅ 성능 최적화 인덱스 추가
- ✅ 보안 및 검증 강화

Migration: `20250724011913_enhance_comment_system_with_replies_and_likes`

## Next Steps

댓글 시스템이 완성되었으므로 다음 단계로 진행 가능:

1. **프로필 페이지 구현** (`/sc:implement "사용자 프로필 페이지와 활동 통계 시스템"`)
2. **댓글 UI 컴포넌트 구현** (`/sc:implement "댓글 섹션 UI 컴포넌트 with 대댓글 지원"`)
3. **실시간 알림 시스템** (댓글 작성 시 독후감 작성자에게 알림)
4. **댓글 신고 시스템** (스팸/부적절한 댓글 신고 기능)