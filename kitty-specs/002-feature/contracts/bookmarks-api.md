# Bookmarks API Contract

독후감 북마크 기능을 위한 API 엔드포인트입니다.

## Endpoints

### POST /reviews/:reviewId/bookmark

**Purpose**: 독후감 북마크 토글 (북마크 추가 또는 취소)

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
    "isBookmarked": true,
    "bookmarkCount": 16
  },
  "meta": {
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Response Fields**:

- `isBookmarked`: 현재 북마크 상태 (true: 북마크됨, false: 북마크 취소)
- `bookmarkCount`: 업데이트된 총 북마크 수

**Side Effects**:

- 이미 북마크한 경우: Bookmark 레코드 삭제, `Review.bookmarkCount` 감소
- 북마크하지 않은 경우: Bookmark 레코드 생성, `Review.bookmarkCount` 증가
- 트랜잭션으로 원자적 처리

**Error Responses**:

- `401 Unauthorized`: 인증 필요
- `404 Not Found`: 독후감을 찾을 수 없음
- `422 Unprocessable Entity`: 삭제된 독후감에는 북마크 불가

---

### GET /users/me/bookmarks

**Purpose**: 내가 북마크한 독후감 목록 조회

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
      "id": "bookmark-uuid",
      "createdAt": "2025-11-09T12:34:56.789Z",
      "review": {
        "id": "review-uuid",
        "title": "독후감 제목",
        "content": "독후감 내용 일부 (150자)",
        "isRecommended": true,
        "likeCount": 43,
        "bookmarkCount": 16,
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
    "total": 12,
    "hasMore": false,
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Ordering**: 최신 북마크순 (`Bookmark.createdAt DESC`)

**Error Responses**:

- `401 Unauthorized`: 인증 필요

---

### DELETE /bookmarks/:id

**Purpose**: 북마크 삭제 (개별 삭제용 - 북마크 목록에서 직접 삭제)

**Authentication**: Required (본인의 북마크만 가능)

**URL Parameters**:

```typescript
{
  id: string; // 북마크 UUID
}
```

**Success Response** (204 No Content):

- 빈 응답 본문

**Side Effects**:

- Bookmark 레코드 삭제
- `Review.bookmarkCount` 감소
- 트랜잭션으로 원자적 처리

**Error Responses**:

- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 다른 사용자의 북마크
- `404 Not Found`: 북마크를 찾을 수 없음

---

### GET /reviews/:reviewId/bookmarks

**Purpose**: 독후감을 북마크한 사용자 목록 조회 (통계용, 선택적 구현)

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
      "id": "bookmark-uuid",
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
    "total": 16,
    "hasMore": false,
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Ordering**: 최신순 (`createdAt DESC`)

**Error Responses**:

- `404 Not Found`: 독후감을 찾을 수 없음

**Note**: 이 엔드포인트는 MVP에서는 선택적으로 구현하며, 향후 통계 기능 확장 시 추가할 수 있습니다.

---

## Data Types

### Bookmark

```typescript
interface Bookmark {
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
   - 한 사용자는 하나의 독후감에 하나의 북마크만 가능
   - DB 레벨에서 `unique([userId, reviewId])` 제약조건

2. **Toggle Behavior**:
   - 이미 북마크한 독후감에 POST 요청 시 북마크 취소
   - 북마크하지 않은 독후감에 POST 요청 시 북마크 추가
   - Idempotent 하지 않음 (토글 방식)

3. **Bookmark Count Synchronization**:
   - Bookmark 레코드 생성/삭제 시 `Review.bookmarkCount` 자동 업데이트
   - 트랜잭션으로 원자적 처리
   - 정합성 보장

4. **Soft Deleted Reviews**:
   - 삭제된 독후감(`status: DELETED`)에는 북마크 불가
   - 기존 북마크는 유지 (사용자가 직접 삭제 가능)

5. **Self-Bookmark**:
   - 자신의 독후감도 북마크 가능 (제한 없음)
   - 나중에 다시 보기 위한 용도

6. **Bookmark Organization**:
   - 현재는 단순 시간순 정렬
   - 향후 폴더/태그 기능 추가 가능 (Phase 2)

## Performance Considerations

1. **Index Usage**:
   - `userId, reviewId` unique 복합 인덱스
   - `userId, createdAt DESC` 복합 인덱스 (북마크 목록 조회)
   - `reviewId` 단일 인덱스 (북마크 수 집계)
   - 빠른 조회 및 삽입/삭제 보장

2. **Transaction Handling**:
   - Bookmark 레코드와 Review.bookmarkCount 업데이트를 단일 트랜잭션으로 처리
   - 정합성 보장 및 race condition 방지

3. **Caching Strategy**:
   - 북마크 상태는 실시간성이 중요하므로 캐싱하지 않음
   - `Review.bookmarkCount`는 DB에 비정규화하여 빠른 조회 지원
   - 사용자별 북마크 목록은 TTL 60s로 캐싱 가능 (선택적)

4. **Rate Limiting**:
   - 북마크 토글: 1000 req/15min (인증 사용자)
   - 악의적인 반복 요청 방지

## Use Cases

### 1. 나중에 읽기 (Read Later)

사용자가 관심 있는 독후감을 북마크하여 나중에 다시 찾아볼 수 있습니다.

**Workflow**:

1. 피드에서 독후감 발견
2. 북마크 버튼 클릭 (`POST /reviews/:id/bookmark`)
3. 북마크 목록에서 확인 (`GET /users/me/bookmarks`)
4. 독후감 읽기 (`GET /reviews/:id`)
5. 북마크 취소 (다시 `POST /reviews/:id/bookmark` 또는 `DELETE /bookmarks/:id`)

### 2. 개인 큐레이션

사용자가 좋아하는 독후감을 북마크하여 개인 라이브러리를 구축합니다.

**Workflow**:

1. 여러 독후감 북마크
2. 북마크 목록에서 주기적으로 재방문
3. 필요 없는 북마크 삭제
4. 새로운 독후감 발견 시 추가

### 3. 공유 준비

나중에 다른 사람과 공유하기 위해 북마크합니다.

**Workflow**:

1. 공유할 독후감 북마크
2. 북마크 목록에서 선택
3. 공유 링크 생성 (`GET /reviews/:id/share-link`)
4. 링크 공유 후 북마크 유지 또는 삭제

## Error Scenarios

### Concurrent Bookmark Toggle

**Problem**: 두 사용자가 동시에 같은 독후감을 북마크할 때

**Solution**:

- Prisma 트랜잭션의 격리 수준 활용
- `bookmarkCount` 업데이트를 `increment/decrement` 연산으로 처리
- 최종 정합성 보장

### Database Inconsistency

**Problem**: Bookmark 레코드와 `Review.bookmarkCount`의 불일치

**Mitigation**:

- 트랜잭션으로 원자적 처리
- 주기적인 정합성 검증 배치 작업 (선택적)
- 필요 시 재계산 엔드포인트 제공 (admin only)

## Future Enhancements

1. **Bookmark Folders**:
   - 북마크를 폴더로 조직화
   - 폴더별 독후감 관리

2. **Bookmark Tags**:
   - 북마크에 태그 추가
   - 태그별 필터링 및 검색

3. **Bookmark Notes**:
   - 북마크한 독후감에 개인 메모 추가
   - 나중에 다시 볼 때 참고용

4. **Bookmark Collections**:
   - 여러 북마크를 컬렉션으로 그룹화
   - 공개 컬렉션 기능 (큐레이션)

5. **Bookmark Export**:
   - 북마크 목록을 CSV/JSON 형식으로 내보내기
   - 데이터 이동성 제공

6. **Smart Bookmarks**:
   - AI 기반 북마크 추천
   - 읽지 않은 북마크 알림
   - 북마크 우선순위 자동 조정
