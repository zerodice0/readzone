# Books API Contract

책 검색 및 정보 조회를 위한 API 엔드포인트입니다.

## Strategy

**외부 API → 내부 DB 캐싱 전략**:

- 독후감 작성 시: 외부 API (Google Books, Aladin 등)로 책 검색
- 책 선택 후: 내부 DB에 Book 엔티티 저장 (캐싱)
- 피드 조회 시: DB에서 책 정보 조회 (외부 API 호출 없음)
- 비용 절감: 같은 책에 대한 여러 독후감이 하나의 Book 레코드를 재사용

## Endpoints

### GET /books/search

**Purpose**: 외부 API를 통한 책 검색 (독후감 작성 시 사용)

**Authentication**: Required (독후감 작성 시에만 사용)

**Query Parameters**:

```typescript
{
  q: string;          // 검색어 (필수, 최소 2자)
  source?: "google" | "aladin" | "all"; // 검색 소스 (default: "all")
  page?: number;      // 페이지 번호 (default: 0)
  limit?: number;     // 페이지당 항목 수 (default: 10, max: 20)
}
```

**Success Response** (200 OK):

```json
{
  "data": [
    {
      "externalId": "google-books-id",
      "externalSource": "GOOGLE_BOOKS",
      "isbn": "9788936433598",
      "title": "채식주의자",
      "author": "한강",
      "publisher": "창비",
      "publishedDate": "2007-10-30T00:00:00.000Z",
      "coverImageUrl": "https://books.google.com/books/content?id=...",
      "description": "채식주의자는 한강의 장편소설이다...",
      "pageCount": 192,
      "language": "ko"
    }
  ],
  "meta": {
    "source": "GOOGLE_BOOKS",
    "page": 0,
    "limit": 10,
    "total": 25,
    "hasMore": true,
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Search Logic**:

1. `source: "all"` (기본값):
   - Google Books와 Aladin API를 병렬로 검색
   - 결과를 통합하여 중복 제거 (ISBN 기준)
   - 관련도 순으로 정렬

2. `source: "google"` 또는 `source: "aladin"`:
   - 지정된 소스만 검색
   - 해당 API의 결과 반환

**Error Responses**:

- `400 Bad Request`: 검색어가 너무 짧음 (최소 2자)
- `401 Unauthorized`: 인증 필요
- `503 Service Unavailable`: 외부 API 장애
- `504 Gateway Timeout`: 외부 API 응답 시간 초과 (10초)

**Performance**:

- Timeout: 10초
- Caching: 동일 검색어는 5분간 캐싱 (Redis)
- Fallback: 하나의 API가 실패해도 다른 API 결과 반환

---

### POST /books

**Purpose**: 외부 API 검색 결과를 내부 DB에 저장 (독후감 작성 시 자동 호출)

**Authentication**: Required

**Request Body**:

```typescript
{
  externalId: string;        // 외부 API의 책 ID (필수)
  externalSource: "GOOGLE_BOOKS" | "ALADIN" | "MANUAL"; // 소스 (필수)
  isbn?: string;             // ISBN-13 (선택)
  title: string;             // 책 제목 (필수)
  author: string;            // 저자명 (필수)
  publisher?: string;        // 출판사 (선택)
  publishedDate?: string;    // 출판일 ISO 8601 (선택)
  coverImageUrl?: string;    // 표지 이미지 URL (선택)
  description?: string;      // 책 소개 (선택)
  pageCount?: number;        // 페이지 수 (선택)
  language?: string;         // 언어 코드 (선택, 예: "ko", "en")
}
```

**Deduplication Logic**:

1. ISBN이 있는 경우: ISBN으로 기존 책 검색
2. ISBN이 없는 경우: `title + author`로 중복 체크
3. 이미 존재하는 책: 기존 레코드 반환 (생성 안 함)
4. 새로운 책: 새 레코드 생성

**Success Response** (200 OK 또는 201 Created):

```json
{
  "data": {
    "id": "book-uuid",
    "isbn": "9788936433598",
    "title": "채식주의자",
    "author": "한강",
    "publisher": "창비",
    "publishedDate": "2007-10-30T00:00:00.000Z",
    "coverImageUrl": "https://books.google.com/books/content?id=...",
    "description": "채식주의자는 한강의 장편소설이다...",
    "pageCount": 192,
    "language": "ko",
    "externalId": "google-books-id",
    "externalSource": "GOOGLE_BOOKS",
    "createdAt": "2025-11-09T12:34:56.789Z",
    "updatedAt": "2025-11-09T12:34:56.789Z"
  },
  "meta": {
    "isNew": true,
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Response Status**:

- `201 Created`: 새로운 책이 생성됨 (`isNew: true`)
- `200 OK`: 기존 책이 반환됨 (`isNew: false`)

**Error Responses**:

- `400 Bad Request`: 유효성 검증 실패 (제목/저자 누락)
- `401 Unauthorized`: 인증 필요
- `409 Conflict`: 중복 체크 중 충돌 발생 (재시도 필요)

---

### GET /books/:id

**Purpose**: 내부 DB에 저장된 책 정보 조회

**Authentication**: Optional

**URL Parameters**:

```typescript
{
  id: string; // 책 UUID
}
```

**Success Response** (200 OK):

```json
{
  "data": {
    "id": "book-uuid",
    "isbn": "9788936433598",
    "title": "채식주의자",
    "author": "한강",
    "publisher": "창비",
    "publishedDate": "2007-10-30T00:00:00.000Z",
    "coverImageUrl": "https://books.google.com/books/content?id=...",
    "description": "채식주의자는 한강의 장편소설이다...",
    "pageCount": 192,
    "language": "ko",
    "externalId": "google-books-id",
    "externalSource": "GOOGLE_BOOKS",
    "createdAt": "2025-11-09T12:34:56.789Z",
    "updatedAt": "2025-11-09T12:34:56.789Z",
    "reviewCount": 42
  },
  "meta": {
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Additional Field**:

- `reviewCount`: 이 책에 대한 독후감 수 (실시간 집계)

**Error Responses**:

- `404 Not Found`: 책을 찾을 수 없음

---

### GET /books/:id/reviews

**Purpose**: 특정 책에 대한 독후감 목록 조회

**Authentication**: Optional

**URL Parameters**:

```typescript
{
  id: string; // 책 UUID
}
```

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
      "id": "review-uuid",
      "title": "독후감 제목",
      "content": "독후감 내용 일부 (150자)",
      "isRecommended": true,
      "rating": 4,
      "likeCount": 43,
      "bookmarkCount": 16,
      "publishedAt": "2025-11-09T10:00:00.000Z",
      "user": {
        "id": "author-uuid",
        "name": "작성자 이름",
        "profileImage": "https://cdn.readzone.com/avatars/author-uuid.jpg"
      },
      "isLikedByMe": false,
      "isBookmarkedByMe": false
    }
  ],
  "meta": {
    "page": 0,
    "limit": 20,
    "total": 42,
    "hasMore": true,
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

**Ordering**: 최신순 (`publishedAt DESC`)

**Error Responses**:

- `404 Not Found`: 책을 찾을 수 없음

---

## Data Types

### Book

```typescript
interface Book {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  publishedDate: string | null; // ISO 8601
  coverImageUrl: string | null;
  description: string | null;
  pageCount: number | null;
  language: string | null;
  externalId: string | null;
  externalSource: ExternalSource | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  reviewCount?: number; // 집계 필드
}
```

### ExternalSource

```typescript
enum ExternalSource {
  GOOGLE_BOOKS = 'GOOGLE_BOOKS',
  ALADIN = 'ALADIN',
  MANUAL = 'MANUAL',
}
```

### BookSearchResult

```typescript
interface BookSearchResult {
  externalId: string;
  externalSource: ExternalSource;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  publishedDate: string | null;
  coverImageUrl: string | null;
  description: string | null;
  pageCount: number | null;
  language: string | null;
}
```

## External API Integration

### Google Books API

**Endpoint**: `https://www.googleapis.com/books/v1/volumes`

**Query Parameters**:

- `q`: 검색어
- `maxResults`: 결과 수 (최대 40)
- `startIndex`: 페이지네이션용

**Response Mapping**:

```typescript
{
  externalId: volumeInfo.id,
  externalSource: "GOOGLE_BOOKS",
  isbn: volumeInfo.industryIdentifiers?.find(id => id.type === "ISBN_13")?.identifier,
  title: volumeInfo.title,
  author: volumeInfo.authors?.join(", "),
  publisher: volumeInfo.publisher,
  publishedDate: volumeInfo.publishedDate,
  coverImageUrl: volumeInfo.imageLinks?.thumbnail,
  description: volumeInfo.description,
  pageCount: volumeInfo.pageCount,
  language: volumeInfo.language
}
```

### Aladin API

**Endpoint**: `http://www.aladin.co.kr/ttb/api/ItemSearch.aspx`

**Query Parameters**:

- `Query`: 검색어
- `QueryType`: "Title", "Author", "Keyword"
- `MaxResults`: 결과 수 (최대 100)
- `start`: 페이지네이션용
- `output`: "js" (JSON)
- `Version`: "20131101"

**Response Mapping**:

```typescript
{
  externalId: item.itemId,
  externalSource: "ALADIN",
  isbn: item.isbn13,
  title: item.title,
  author: item.author,
  publisher: item.publisher,
  publishedDate: item.pubDate,
  coverImageUrl: item.cover,
  description: item.description,
  pageCount: null, // Aladin API에서 제공하지 않음
  language: "ko"
}
```

## Business Rules

1. **Search Query**:
   - 최소 2자 이상
   - 특수 문자 처리 및 정규화

2. **Deduplication**:
   - ISBN 우선: ISBN이 있으면 ISBN으로 중복 체크
   - Title + Author: ISBN이 없으면 제목과 저자로 중복 체크
   - 중복 시 기존 레코드 반환, 새로 생성하지 않음

3. **External Source Priority**:
   - Google Books: 영문 책에 강함
   - Aladin: 한국 책에 강함
   - `source: "all"`일 때: 두 소스를 병렬 검색하여 통합

4. **Image Caching**:
   - 책 표지 이미지는 외부 CDN URL을 그대로 저장
   - 필요 시 자체 CDN으로 프록시 가능 (Phase 2)

5. **Data Freshness**:
   - 책 정보는 한 번 저장되면 일반적으로 업데이트하지 않음
   - 필요 시 주기적인 배치 작업으로 업데이트 (선택적)

6. **Manual Entry**:
   - 외부 API에서 찾지 못한 책은 사용자가 직접 입력 가능
   - `externalSource: "MANUAL"`로 표시

## Performance Considerations

1. **Search Caching**:
   - 동일 검색어는 Redis에 5분간 캐싱
   - 캐시 키: `book:search:{source}:{query}:{page}`

2. **API Rate Limiting**:
   - Google Books: 1000 req/day (무료)
   - Aladin: 무제한 (API 키 필요)
   - Rate limit 초과 시 다른 소스로 fallback

3. **Parallel Search**:
   - `source: "all"`일 때 Google Books와 Aladin을 병렬로 검색
   - Promise.allSettled()로 하나가 실패해도 나머지 결과 반환

4. **Database Indexing**:
   - ISBN: unique 인덱스
   - Title + Author: 복합 인덱스 (중복 체크용)
   - externalSource + externalId: unique 복합 인덱스

## Error Handling

### External API Failures

**Scenario**: Google Books API가 응답하지 않음

**Solution**:

1. Aladin API로 검색
2. 두 API 모두 실패 시 503 Service Unavailable 반환
3. 프론트엔드에서 manual entry 옵션 제공

### Duplicate Detection Failures

**Scenario**: 동시에 같은 책을 여러 사용자가 저장

**Solution**:

- Database unique constraint로 방지
- 409 Conflict 반환 시 재시도 로직
- 최대 3회 재시도 후 실패

### Image URL Failures

**Scenario**: 외부 이미지 URL이 더 이상 유효하지 않음

**Solution**:

- 프론트엔드에서 이미지 로드 실패 시 placeholder 표시
- 주기적인 배치 작업으로 invalid URL 감지 및 업데이트

## Future Enhancements

1. **Book Metadata Update**:
   - 주기적으로 외부 API에서 책 정보 업데이트
   - 새로운 에디션, 표지 변경 등 반영

2. **Advanced Search**:
   - 저자, 출판사, ISBN으로 필터링
   - 출판 연도 범위 검색
   - 언어별 필터링

3. **Book Recommendations**:
   - 인기 책 추천
   - 유사한 책 추천
   - AI 기반 개인화 추천

4. **Book Statistics**:
   - 독후감 수 추이
   - 평균 평점
   - 추천/비추천 비율

5. **Book Collections**:
   - 시리즈 책 그룹화
   - 작가별 책 목록
   - 장르별 분류
