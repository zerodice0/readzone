# Reviews API Contract

독후감 조회, 작성, 수정, 삭제를 위한 API 엔드포인트입니다.

## Endpoints

### GET /reviews/feed

**Purpose**: 메인 피드 - 최신 독후감 목록을 시간순으로 조회

**Authentication**: Optional (로그인하지 않아도 조회 가능)

**Query Parameters**:

```typescript
{
  page?: number;     // 페이지 번호 (default: 0)
  limit?: number;    // 페이지당 항목 수 (default: 20, max: 50)
}
```

**Success Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid-string",
      "title": "독후감 제목 (선택적)",
      "content": "독후감 내용 일부 (최대 150자)",
      "isRecommended": true,
      "rating": 4,
      "readStatus": "COMPLETED",
      "likeCount": 42,
      "bookmarkCount": 15,
      "viewCount": 234,
      "publishedAt": "2025-11-09T12:34:56.789Z",
      "createdAt": "2025-11-09T12:00:00.000Z",
      "updatedAt": "2025-11-09T12:34:56.789Z",
      "user": {
        "id": "user-uuid",
        "name": "김독서",
        "profileImage": "https://cdn.readzone.com/avatars/user-uuid.jpg"
      },
      "book": {
        "id": "book-uuid",
        "title": "책 제목",
        "author": "저자명",
        "coverImageUrl": "https://image.aladin.co.kr/cover/..."
      },
      "isLikedByMe": false, // 로그인한 경우에만 포함
      "isBookmarkedByMe": false // 로그인한 경우에만 포함
    }
  ],
  "meta": {
    "page": 0,
    "limit": 20,
    "total": 150,
    "hasMore": true,
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Error Responses**:

- `400 Bad Request`: 잘못된 쿼리 파라미터
- `429 Too Many Requests`: Rate limit 초과

**Performance**:

- Target: <200ms p95
- Caching: 비로그인 사용자는 Redis 캐싱 (TTL: 60s)

---

### GET /reviews/:id

**Purpose**: 독후감 상세 조회

**Authentication**: Optional

**URL Parameters**:

```typescript
{
  id: string; // 독후감 UUID
}
```

**Success Response** (200 OK):

```json
{
  "data": {
    "id": "uuid-string",
    "title": "독후감 제목",
    "content": "독후감 전체 내용 (제한 없음)",
    "isRecommended": true,
    "rating": 4,
    "readStatus": "COMPLETED",
    "likeCount": 42,
    "bookmarkCount": 15,
    "viewCount": 235,
    "status": "PUBLISHED",
    "publishedAt": "2025-11-09T12:34:56.789Z",
    "createdAt": "2025-11-09T12:00:00.000Z",
    "updatedAt": "2025-11-09T12:34:56.789Z",
    "user": {
      "id": "user-uuid",
      "name": "김독서",
      "profileImage": "https://cdn.readzone.com/avatars/user-uuid.jpg"
    },
    "book": {
      "id": "book-uuid",
      "isbn": "9788936433598",
      "title": "책 제목",
      "author": "저자명",
      "publisher": "출판사",
      "publishedDate": "2020-01-15T00:00:00.000Z",
      "coverImageUrl": "https://image.aladin.co.kr/cover/...",
      "description": "책 소개",
      "pageCount": 320
    },
    "isLikedByMe": false,
    "isBookmarkedByMe": false
  },
  "meta": {
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Side Effects**:

- `viewCount` 1 증가 (동일 IP/세션은 1시간 내 중복 카운트 방지)

**Error Responses**:

- `404 Not Found`: 독후감을 찾을 수 없음 또는 삭제된 독후감

---

### POST /reviews

**Purpose**: 새 독후감 작성

**Authentication**: Required

**Request Body**:

```typescript
{
  bookId: string;         // 책 UUID (필수)
  title?: string;         // 독후감 제목 (선택)
  content: string;        // 독후감 본문 (필수, 최소 10자)
  rating?: number;        // 평점 1-5 (선택)
  isRecommended: boolean; // 추천 여부 (필수)
  readStatus: "READING" | "COMPLETED" | "DROPPED"; // 독서 상태
  status?: "DRAFT" | "PUBLISHED"; // 상태 (default: PUBLISHED)
}
```

**Validation Rules**:

- `content`: 최소 10자, 최대 10,000자
- `rating`: 1-5 사이의 정수 (선택적)
- `title`: 최대 200자
- `isRecommended`: 필수 boolean

**Success Response** (201 Created):

```json
{
  "data": {
    "id": "new-review-uuid",
    "bookId": "book-uuid",
    "title": "독후감 제목",
    "content": "독후감 본문",
    "isRecommended": true,
    "rating": 4,
    "readStatus": "COMPLETED",
    "status": "PUBLISHED",
    "likeCount": 0,
    "bookmarkCount": 0,
    "viewCount": 0,
    "publishedAt": "2025-11-09T12:34:56.789Z",
    "createdAt": "2025-11-09T12:34:56.789Z",
    "updatedAt": "2025-11-09T12:34:56.789Z"
  },
  "meta": {
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Error Responses**:

- `400 Bad Request`: 유효성 검증 실패
- `401 Unauthorized`: 인증 필요
- `404 Not Found`: 존재하지 않는 책 ID
- `422 Unprocessable Entity`: 비즈니스 로직 검증 실패

---

### PATCH /reviews/:id

**Purpose**: 독후감 수정

**Authentication**: Required (작성자만 가능)

**URL Parameters**:

```typescript
{
  id: string; // 독후감 UUID
}
```

**Request Body** (모든 필드 선택적):

```typescript
{
  title?: string;
  content?: string;
  rating?: number;
  isRecommended?: boolean;
  readStatus?: "READING" | "COMPLETED" | "DROPPED";
  status?: "DRAFT" | "PUBLISHED";
}
```

**Success Response** (200 OK):

```json
{
  "data": {
    "id": "review-uuid",
    "title": "수정된 제목",
    "content": "수정된 내용",
    "isRecommended": true,
    "rating": 5,
    "readStatus": "COMPLETED",
    "status": "PUBLISHED",
    "likeCount": 42,
    "bookmarkCount": 15,
    "viewCount": 235,
    "publishedAt": "2025-11-09T12:34:56.789Z",
    "createdAt": "2025-11-09T12:00:00.000Z",
    "updatedAt": "2025-11-09T13:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-11-09T13:00:00.000Z"
  }
}
```

**Error Responses**:

- `400 Bad Request`: 유효성 검증 실패
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 작성자가 아님
- `404 Not Found`: 독후감을 찾을 수 없음

---

### DELETE /reviews/:id

**Purpose**: 독후감 삭제 (Soft Delete)

**Authentication**: Required (작성자만 가능)

**URL Parameters**:

```typescript
{
  id: string; // 독후감 UUID
}
```

**Success Response** (204 No Content):

- 빈 응답 본문

**Side Effects**:

- `status` → `DELETED`
- `deletedAt` 타임스탬프 설정
- 관련 좋아요/북마크는 유지 (통계 목적)

**Error Responses**:

- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 작성자가 아님
- `404 Not Found`: 독후감을 찾을 수 없음

---

### GET /reviews/:id/share-link

**Purpose**: 독후감 공유 링크 생성

**Authentication**: Optional

**URL Parameters**:

```typescript
{
  id: string; // 독후감 UUID
}
```

**Success Response** (200 OK):

```json
{
  "data": {
    "url": "https://readzone.com/reviews/uuid-string",
    "shortUrl": "https://rz.link/abc123",
    "title": "독후감 제목 - ReadZone",
    "description": "독후감 내용 일부 (150자)",
    "imageUrl": "https://cdn.readzone.com/og-images/review-uuid.jpg"
  },
  "meta": {
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Error Responses**:

- `404 Not Found`: 독후감을 찾을 수 없음

---

## Data Types

### Review

```typescript
interface Review {
  id: string;
  userId: string;
  bookId: string;
  title: string | null;
  content: string;
  rating: number | null;
  isRecommended: boolean;
  readStatus: ReadStatus;
  likeCount: number;
  bookmarkCount: number;
  viewCount: number;
  status: ReviewStatus;
  publishedAt: string | null; // ISO 8601
  deletedAt: string | null; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  user: UserSummary;
  book: BookSummary;
  isLikedByMe?: boolean; // 로그인한 경우에만
  isBookmarkedByMe?: boolean; // 로그인한 경우에만
}
```

### ReadStatus

```typescript
enum ReadStatus {
  READING = 'READING',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}
```

### ReviewStatus

```typescript
enum ReviewStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DELETED = 'DELETED',
}
```

## Business Rules

1. **Content Validation**:
   - 최소 10자, 최대 10,000자
   - HTML 태그 제거 (XSS 방지)

2. **Recommendation**:
   - `isRecommended`는 필수 필드
   - 독후감 작성 시 반드시 선택

3. **View Count**:
   - 동일 IP/세션에서 1시간 내 중복 카운트 방지
   - Redis를 활용한 캐싱

4. **Soft Delete**:
   - 삭제 시 `status`를 `DELETED`로 변경
   - `deletedAt` 타임스탬프 설정
   - 실제 데이터는 보존 (통계 및 복구 목적)

5. **Pagination**:
   - Default: 20 items per page
   - Max: 50 items per page
   - 0-based page indexing

## Performance Considerations

1. **Index Usage**:
   - `status, publishedAt DESC` 복합 인덱스
   - 피드 조회 쿼리 최적화

2. **N+1 Problem Prevention**:
   - `user`, `book` 관계를 `include`로 한 번에 로드
   - Prisma의 `select`로 필요한 필드만 조회

3. **Caching**:
   - 비로그인 피드: Redis 캐싱 (TTL: 60s)
   - 로그인 피드: 개인화된 데이터로 캐싱 제외

4. **Rate Limiting**:
   - Anonymous: 100 req/15min
   - Authenticated: 1000 req/15min
