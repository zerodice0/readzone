# Likes API Contract

독후감 좋아요 기능을 위한 API 엔드포인트입니다.

## Endpoints

### POST /reviews/:reviewId/like

**Purpose**: 독후감 좋아요 토글 (좋아요 추가 또는 취소)

**Authentication**: Required

**URL Parameters**:

```typescript
{
  reviewId: string; // 독후감 UUID
}
```

**Request Body**: None (빈 본문)

**Success Response** (200 OK):

```json
{
  "data": {
    "isLiked": true,
    "likeCount": 43
  },
  "meta": {
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Response Fields**:

- `isLiked`: 현재 좋아요 상태 (true: 좋아요 누름, false: 좋아요 취소)
- `likeCount`: 업데이트된 총 좋아요 수

**Side Effects**:

- 이미 좋아요한 경우: Like 레코드 삭제, `Review.likeCount` 감소
- 좋아요하지 않은 경우: Like 레코드 생성, `Review.likeCount` 증가
- 트랜잭션으로 원자적 처리

**Error Responses**:

- `401 Unauthorized`: 인증 필요
- `404 Not Found`: 독후감을 찾을 수 없음
- `422 Unprocessable Entity`: 삭제된 독후감에는 좋아요 불가

---

### GET /reviews/:reviewId/likes

**Purpose**: 독후감에 좋아요를 누른 사용자 목록 조회

**Authentication**: Optional

**URL Parameters**:

```typescript
{
  reviewId: string; // 독후감 UUID
}
```

**Query Parameters**:

```typescript
{
  page?: number;  // 페이지 번호 (default: 0)
  limit?: number; // 페이지당 항목 수 (default: 20, max: 100)
}
```

**Success Response** (200 OK):

```json
{
  "data": [
    {
      "id": "like-uuid",
      "createdAt": "2025-11-09T12:34:56.789Z",
      "user": {
        "id": "user-uuid",
        "name": "김독서",
        "profileImage": "https://cdn.readzone.com/avatars/user-uuid.jpg"
      }
    }
  ],
  "meta": {
    "page": 0,
    "limit": 20,
    "total": 43,
    "hasMore": true,
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Ordering**: 최신순 (`createdAt DESC`)

**Error Responses**:

- `404 Not Found`: 독후감을 찾을 수 없음

---

### GET /users/me/likes

**Purpose**: 내가 좋아요한 독후감 목록 조회

**Authentication**: Required

**Query Parameters**:

```typescript
{
  page?: number;  // 페이지 번호 (default: 0)
  limit?: number; // 페이지당 항목 수 (default: 20, max: 50)
}
```

**Success Response** (200 OK):

```json
{
  "data": [
    {
      "id": "like-uuid",
      "createdAt": "2025-11-09T12:34:56.789Z",
      "review": {
        "id": "review-uuid",
        "title": "독후감 제목",
        "content": "독후감 내용 일부 (150자)",
        "isRecommended": true,
        "likeCount": 43,
        "bookmarkCount": 15,
        "publishedAt": "2025-11-09T10:00:00.000Z",
        "user": {
          "id": "author-uuid",
          "name": "작성자 이름",
          "profileImage": "https://cdn.readzone.com/avatars/author-uuid.jpg"
        },
        "book": {
          "id": "book-uuid",
          "title": "책 제목",
          "author": "저자명",
          "coverImageUrl": "https://image.aladin.co.kr/cover/..."
        }
      }
    }
  ],
  "meta": {
    "page": 0,
    "limit": 20,
    "total": 25,
    "hasMore": true,
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Ordering**: 최신 좋아요순 (`Like.createdAt DESC`)

**Error Responses**:

- `401 Unauthorized`: 인증 필요

---

## Data Types

### Like

```typescript
interface Like {
  id: string;
  userId: string;
  reviewId: string;
  createdAt: string; // ISO 8601
  user?: UserSummary;
  review?: ReviewSummary;
}
```

### UserSummary

```typescript
interface UserSummary {
  id: string;
  name: string;
  profileImage: string | null;
}
```

### ReviewSummary

```typescript
interface ReviewSummary {
  id: string;
  title: string | null;
  content: string; // 최대 150자
  isRecommended: boolean;
  likeCount: number;
  bookmarkCount: number;
  publishedAt: string;
  user: UserSummary;
  book: BookSummary;
}
```

## Business Rules

1. **Unique Constraint**:
   - 한 사용자는 하나의 독후감에 하나의 좋아요만 가능
   - DB 레벨에서 `unique([userId, reviewId])` 제약조건

2. **Toggle Behavior**:
   - 이미 좋아요한 독후감에 POST 요청 시 좋아요 취소
   - 좋아요하지 않은 독후감에 POST 요청 시 좋아요 추가
   - Idempotent 하지 않음 (토글 방식)

3. **Like Count Synchronization**:
   - Like 레코드 생성/삭제 시 `Review.likeCount` 자동 업데이트
   - 트랜잭션으로 원자적 처리
   - 정합성 보장

4. **Soft Deleted Reviews**:
   - 삭제된 독후감(`status: DELETED`)에는 좋아요 불가
   - 기존 좋아요는 유지 (통계 목적)

5. **Self-Like Prevention**:
   - 자신의 독후감에도 좋아요 가능 (제한 없음)
   - 필요 시 프론트엔드 또는 비즈니스 로직에서 제어

## Performance Considerations

1. **Index Usage**:
   - `userId, reviewId` unique 복합 인덱스
   - `reviewId, createdAt` 복합 인덱스 (좋아요 목록 조회)
   - 빠른 조회 및 삽입/삭제 보장

2. **Transaction Handling**:
   - Like 레코드와 Review.likeCount 업데이트를 단일 트랜잭션으로 처리
   - 정합성 보장 및 race condition 방지

3. **Caching Strategy**:
   - 좋아요 상태는 실시간성이 중요하므로 캐싱하지 않음
   - `Review.likeCount`는 DB에 비정규화하여 빠른 조회 지원

4. **Rate Limiting**:
   - 좋아요 토글: 1000 req/15min (인증 사용자)
   - 악의적인 반복 요청 방지

## Error Scenarios

### Concurrent Like Toggle

**Problem**: 두 사용자가 동시에 같은 독후감에 좋아요를 누를 때

**Solution**:

- Prisma 트랜잭션의 격리 수준 활용
- `likeCount` 업데이트를 `increment/decrement` 연산으로 처리
- 최종 정합성 보장

### Database Inconsistency

**Problem**: Like 레코드와 `Review.likeCount`의 불일치

**Mitigation**:

- 트랜잭션으로 원자적 처리
- 주기적인 정합성 검증 배치 작업 (선택적)
- 필요 시 재계산 엔드포인트 제공 (admin only)

## Future Enhancements

1. **Like Notifications**:
   - 독후감 작성자에게 좋아요 알림 전송
   - WebSocket 또는 Server-Sent Events 활용

2. **Like Analytics**:
   - 시간대별 좋아요 통계
   - 인기 독후감 순위

3. **Unlike Reason**:
   - 좋아요 취소 이유 수집 (선택적)
   - 사용자 경험 개선을 위한 데이터

4. **Bulk Operations**:
   - 여러 독후감에 대한 좋아요 상태 일괄 조회
   - 프론트엔드 최적화용
