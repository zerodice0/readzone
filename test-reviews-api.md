# Phase 4 Reviews API Testing Guide

## 구현된 API 엔드포인트

### 1. 독후감 CRUD API

#### POST /api/reviews - 독후감 생성
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "book_id_here",
    "title": "좋은 책이었습니다",
    "content": "이 책은 정말 인상깊었습니다. 특히...",
    "isRecommended": true,
    "tags": ["판타지", "재미있음", "추천"],
    "purchaseLink": "https://example.com/book"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "id": "clr123...",
      "title": "좋은 책이었습니다",
      "content": "이 책은 정말 인상깊었습니다...",
      "isRecommended": true,
      "tags": ["판타지", "재미있음", "추천"],
      "purchaseLink": "https://example.com/book",
      "user": { "id": "...", "nickname": "...", "image": "..." },
      "book": { "id": "...", "title": "...", "authors": [...] },
      "_count": { "likes": 0, "comments": 0 }
    }
  }
}
```

#### GET /api/reviews - 독후감 목록 조회
```bash
# 기본 목록
curl "http://localhost:3000/api/reviews?page=1&limit=10"

# 필터링 및 정렬
curl "http://localhost:3000/api/reviews?sort=popular&tags=판타지,추천&search=좋은책"

# 특정 사용자의 독후감
curl "http://localhost:3000/api/reviews?userId=user_id_here"

# 특정 도서의 독후감
curl "http://localhost:3000/api/reviews?bookId=book_id_here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrevious": false
    },
    "stats": {
      "total": 50,
      "recommendedCount": 35,
      "notRecommendedCount": 15,
      "recommendationRate": 70
    }
  }
}
```

### 2. 개별 독후감 API

#### GET /api/reviews/[id] - 독후감 상세 조회
```bash
curl "http://localhost:3000/api/reviews/clr123..."
```

#### PUT /api/reviews/[id] - 독후감 수정
```bash
curl -X PUT http://localhost:3000/api/reviews/clr123... \
  -H "Content-Type: application/json" \
  -d '{
    "title": "수정된 제목",
    "content": "수정된 내용...",
    "tags": ["판타지", "수정됨"]
  }'
```

#### DELETE /api/reviews/[id] - 독후감 삭제
```bash
curl -X DELETE http://localhost:3000/api/reviews/clr123...
```

### 3. 임시저장 API

#### POST /api/reviews/draft - 임시저장
```bash
curl -X POST http://localhost:3000/api/reviews/draft \
  -H "Content-Type: application/json" \
  -d '{
    "content": "임시로 작성중인 내용...",
    "bookId": "book_id_here",
    "title": "임시 제목",
    "metadata": {
      "tags": ["초안"],
      "autoSaveTime": "2024-01-23T10:30:00Z"
    }
  }'
```

#### GET /api/reviews/draft - 임시저장 목록
```bash
curl "http://localhost:3000/api/reviews/draft?page=1&limit=5"
```

#### GET /api/reviews/draft/[id] - 특정 임시저장 조회
```bash
curl "http://localhost:3000/api/reviews/draft/draft_id_here"
```

#### DELETE /api/reviews/draft/[id] - 임시저장 삭제
```bash
curl -X DELETE http://localhost:3000/api/reviews/draft/draft_id_here
```

## 에러 응답 형식

모든 API는 일관된 에러 응답 형식을 사용합니다:

```json
{
  "success": false,
  "error": {
    "errorType": "VALIDATION_ERROR",
    "message": "입력 데이터가 올바르지 않습니다.",
    "details": [...]
  }
}
```

### 에러 타입
- `UNAUTHORIZED`: 인증 필요 (401)
- `FORBIDDEN`: 권한 없음 (403)
- `NOT_FOUND`: 리소스 없음 (404)
- `VALIDATION_ERROR`: 입력 검증 실패 (400)
- `DUPLICATE_ENTRY`: 중복 데이터 (409)
- `INTERNAL_ERROR`: 서버 오류 (500)

## 보안 기능

1. **인증 확인**: 모든 POST, PUT, DELETE 요청에서 NextAuth 세션 확인
2. **권한 검증**: 본인의 독후감/임시저장만 수정/삭제 가능
3. **입력 검증**: Zod 스키마를 통한 엄격한 데이터 검증
4. **SQL 인젝션 방지**: Prisma ORM 사용으로 자동 방지
5. **중복 방지**: 사용자당 도서별 독후감 1개 제한

## 데이터베이스 스키마

### BookReview 모델
```prisma
model BookReview {
  id            String   @id @default(cuid())
  title         String?
  content       String
  isRecommended Boolean
  tags          String   // JSON 배열
  purchaseLink  String?
  linkClicks    Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  userId String
  bookId String
  user   User   @relation(fields: [userId], references: [id])
  book   Book   @relation(fields: [bookId], references: [id])

  likes    ReviewLike[]
  comments Comment[]
}
```

### ReviewDraft 모델
```prisma
model ReviewDraft {
  id        String   @id @default(cuid())
  userId    String
  bookId    String?
  title     String?
  content   String
  metadata  String   @default("{}") // JSON
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User  @relation(fields: [userId], references: [id])
  book Book? @relation(fields: [bookId], references: [id])
}
```

## 테스트 시나리오

### 1. 독후감 생성 플로우
1. 로그인한 사용자가 독후감 작성
2. 도서 존재 확인
3. 중복 독후감 확인
4. 데이터 검증 및 저장
5. 포맷된 응답 반환

### 2. 임시저장 플로우
1. 사용자가 독후감 작성 중 임시저장
2. 기존 임시저장 확인 (같은 도서)
3. 새로 생성하거나 기존 것 업데이트
4. 메타데이터와 함께 저장

### 3. 목록 조회 플로우
1. 쿼리 파라미터 검증
2. 동적 WHERE 조건 구성
3. 정렬 및 페이지네이션 적용
4. 관련 데이터 조인
5. JSON 데이터 파싱 및 응답

## 성능 고려사항

1. **인덱스 최적화**: userId, bookId, createdAt에 인덱스 설정
2. **JSON 파싱**: 응답 시에만 JSON.parse() 수행
3. **관계 최적화**: include로 N+1 쿼리 방지
4. **페이지네이션**: 대용량 데이터 처리를 위한 커서 기반 페이지네이션 고려
5. **캐싱**: 인기 독후감 목록 캐싱 고려

## Next.js App Router 특징

1. **Route Handlers**: app/api 디렉토리의 route.ts 파일
2. **타입 안전성**: TypeScript와 Zod를 통한 완전한 타입 체크
3. **미들웨어**: NextAuth를 통한 자동 세션 관리
4. **에러 경계**: 전역 에러 처리 및 로깅
5. **서버 컴포넌트**: 서버 사이드 렌더링 최적화