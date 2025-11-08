# Data Model: 독후감 메인 피드

**Feature**: 002-feature
**Date**: 2025-11-09
**Status**: Complete

## Overview

독후감 메인 피드 기능을 위한 데이터 모델입니다. 기존 User 엔티티를 활용하며, Review, Book, Like, Bookmark 엔티티를 새롭게 추가합니다.

## Entity Diagram

```
User (기존)
  ├─→ Review (N)
  ├─→ Like (N)
  └─→ Bookmark (N)

Book (신규)
  └─→ Review (N)

Review (신규)
  ├─→ User (작성자) (1)
  ├─→ Book (1)
  ├─→ Like (N)
  └─→ Bookmark (N)

Like (신규)
  ├─→ User (1)
  └─→ Review (1)

Bookmark (신규)
  ├─→ User (1)
  └─→ Review (1)
```

## Entities

### 1. Book (책)

독후감의 대상이 되는 책 정보. 외부 API에서 가져온 정보를 캐싱하여 저장.

**Attributes**:

- `id` (String, UUID, PK): 책 고유 식별자
- `isbn` (String, Unique, Nullable): ISBN-13 (있는 경우)
- `title` (String, Required): 책 제목
- `author` (String, Required): 저자명
- `publisher` (String, Nullable): 출판사
- `publishedDate` (DateTime, Nullable): 출판일
- `coverImageUrl` (String, Nullable): 책 표지 이미지 URL (외부 CDN)
- `description` (String, Nullable): 책 소개 (외부 API에서 가져온 설명)
- `pageCount` (Int, Nullable): 페이지 수
- `language` (String, Nullable): 언어 코드 (예: "ko", "en")
- `externalId` (String, Nullable): 외부 API의 책 ID (Google Books ID, Aladin ID 등)
- `externalSource` (Enum, Nullable): 외부 데이터 소스 (GOOGLE_BOOKS, ALADIN 등)
- `createdAt` (DateTime): 생성 시간
- `updatedAt` (DateTime): 수정 시간

**Relationships**:

- `reviews` (Review[]): 이 책에 대한 독후감 목록

**Indexes**:

- `isbn` (unique)
- `title, author` (복합 인덱스, 중복 방지용)
- `externalSource, externalId` (복합 unique 인덱스)

**Business Rules**:

- ISBN이 없는 경우 `title + author`로 중복 체크
- 동일한 책에 대한 여러 독후감은 하나의 Book 레코드 공유
- 외부 API에서 가져온 정보는 주기적으로 업데이트 가능 (별도 배치 작업)

### 2. Review (독후감)

사용자가 작성한 독후감.

**Attributes**:

- `id` (String, UUID, PK): 독후감 고유 식별자
- `userId` (String, FK → User.id, Required): 작성자
- `bookId` (String, FK → Book.id, Required): 독후감 대상 책
- `title` (String, Nullable): 독후감 제목 (선택적)
- `content` (Text, Required): 독후감 본문
- `rating` (Int, Nullable): 평점 (1-5)
- `isRecommended` (Boolean, Required): 추천 여부 (👍/👎)
- `readStatus` (Enum, Required): 독서 상태 (READING, COMPLETED, DROPPED)
- `likeCount` (Int, Default: 0): 좋아요 수 (비정규화 - 성능 최적화)
- `bookmarkCount` (Int, Default: 0): 북마크 수 (통계용)
- `viewCount` (Int, Default: 0): 조회 수
- `status` (Enum, Default: PUBLISHED): 상태 (DRAFT, PUBLISHED, DELETED)
- `publishedAt` (DateTime, Nullable): 공개 시간
- `deletedAt` (DateTime, Nullable): 삭제 시간 (soft delete)
- `createdAt` (DateTime): 생성 시간
- `updatedAt` (DateTime): 수정 시간

**Relationships**:

- `user` (User): 작성자
- `book` (Book): 독후감 대상 책
- `likes` (Like[]): 이 독후감에 대한 좋아요 목록
- `bookmarks` (Bookmark[]): 이 독후감에 대한 북마크 목록

**Indexes**:

- `userId, status, publishedAt` (복합 인덱스, 사용자별 독후감 조회용)
- `bookId, status, publishedAt` (복합 인덱스, 책별 독후감 조회용)
- `status, publishedAt DESC` (복합 인덱스, 피드 조회용 - 가장 중요)
- `status, deletedAt` (복합 인덱스, soft delete 필터링용)

**Business Rules**:

- `content`는 최소 10자 이상 (프론트엔드 검증)
- `isRecommended`는 필수 (독후감 작성 시 반드시 선택)
- `likeCount`는 Like 엔티티와 동기화 (트리거 또는 트랜잭션)
- Soft delete: `deletedAt`이 null이 아니면 삭제된 것으로 간주

### 3. Like (좋아요)

사용자가 독후감에 대해 표현한 긍정적 반응.

**Attributes**:

- `id` (String, UUID, PK): 좋아요 고유 식별자
- `userId` (String, FK → User.id, Required): 좋아요를 누른 사용자
- `reviewId` (String, FK → Review.id, Required): 좋아요 대상 독후감
- `createdAt` (DateTime): 생성 시간

**Relationships**:

- `user` (User): 좋아요를 누른 사용자
- `review` (Review): 좋아요 대상 독후감

**Indexes**:

- `userId, reviewId` (복합 unique 인덱스, 중복 방지)
- `reviewId, createdAt` (복합 인덱스, 독후감별 좋아요 목록 조회용)

**Business Rules**:

- 한 사용자는 하나의 독후감에 하나의 좋아요만 가능
- 좋아요 취소 시 레코드 삭제
- 좋아요 생성/삭제 시 Review.likeCount 업데이트 (트랜잭션)

### 4. Bookmark (북마크)

사용자가 나중에 다시 보기 위해 저장한 독후감.

**Attributes**:

- `id` (String, UUID, PK): 북마크 고유 식별자
- `userId` (String, FK → User.id, Required): 북마크한 사용자
- `reviewId` (String, FK → Review.id, Required): 북마크 대상 독후감
- `createdAt` (DateTime): 생성 시간

**Relationships**:

- `user` (User): 북마크한 사용자
- `review` (Review): 북마크 대상 독후감

**Indexes**:

- `userId, reviewId` (복합 unique 인덱스, 중복 방지)
- `userId, createdAt DESC` (복합 인덱스, 사용자별 북마크 목록 조회용)
- `reviewId` (인덱스, 독후감별 북마크 수 집계용)

**Business Rules**:

- 한 사용자는 하나의 독후감에 하나의 북마크만 가능
- 북마크 취소 시 레코드 삭제
- 북마크 생성/삭제 시 Review.bookmarkCount 업데이트 (선택적)

## Enums

### ExternalSource

```typescript
enum ExternalSource {
  GOOGLE_BOOKS  // Google Books API
  ALADIN        // 알라딘 API
  MANUAL        // 사용자 직접 입력 (폴백)
}
```

### ReadStatus

```typescript
enum ReadStatus {
  READING     // 읽는 중
  COMPLETED   // 완독
  DROPPED     // 중단
}
```

### ReviewStatus

```typescript
enum ReviewStatus {
  DRAFT       // 임시 저장
  PUBLISHED   // 공개
  DELETED     // 삭제됨 (soft delete)
}
```

## Prisma Schema Extension

기존 `schema.prisma`에 추가할 모델:

```prisma
// ============================================
// Book Entity
// ============================================

model Book {
  id              String    @id @default(uuid())
  isbn            String?   @unique
  title           String
  author          String
  publisher       String?
  publishedDate   DateTime?
  coverImageUrl   String?
  description     String?   @db.Text
  pageCount       Int?
  language        String?
  externalId      String?
  externalSource  ExternalSource?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relationships
  reviews         Review[]

  @@unique([externalSource, externalId])
  @@index([title, author])
  @@map("books")
}

enum ExternalSource {
  GOOGLE_BOOKS
  ALADIN
  MANUAL
}

// ============================================
// Review Entity
// ============================================

model Review {
  id              String       @id @default(uuid())
  userId          String
  bookId          String
  title           String?
  content         String       @db.Text
  rating          Int?
  isRecommended   Boolean
  readStatus      ReadStatus   @default(COMPLETED)
  likeCount       Int          @default(0)
  bookmarkCount   Int          @default(0)
  viewCount       Int          @default(0)
  status          ReviewStatus @default(PUBLISHED)
  publishedAt     DateTime?
  deletedAt       DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  // Relationships
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  book            Book         @relation(fields: [bookId], references: [id], onDelete: Restrict)
  likes           Like[]
  bookmarks       Bookmark[]

  @@index([userId, status, publishedAt])
  @@index([bookId, status, publishedAt])
  @@index([status, publishedAt(sort: Desc)])
  @@index([status, deletedAt])
  @@map("reviews")
}

enum ReadStatus {
  READING
  COMPLETED
  DROPPED
}

enum ReviewStatus {
  DRAFT
  PUBLISHED
  DELETED
}

// ============================================
// Like Entity
// ============================================

model Like {
  id         String   @id @default(uuid())
  userId     String
  reviewId   String
  createdAt  DateTime @default(now())

  // Relationships
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  review     Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@unique([userId, reviewId])
  @@index([reviewId, createdAt])
  @@map("likes")
}

// ============================================
// Bookmark Entity
// ============================================

model Bookmark {
  id         String   @id @default(uuid())
  userId     String
  reviewId   String
  createdAt  DateTime @default(now())

  // Relationships
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  review     Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@unique([userId, reviewId])
  @@index([userId, createdAt(sort: Desc)])
  @@index([reviewId])
  @@map("bookmarks")
}
```

## User Model Extension

기존 `User` 모델에 추가할 관계:

```prisma
model User {
  // ... 기존 필드들 ...

  // 새로운 관계 추가
  reviews    Review[]
  likes      Like[]
  bookmarks  Bookmark[]

  // ... 나머지 기존 필드들 ...
}
```

## Query Patterns

### 피드 조회 (Feed Query)

```typescript
// 메인 피드: 최신순 독후감 목록
const feed = await prisma.review.findMany({
  where: {
    status: 'PUBLISHED',
    deletedAt: null,
  },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        profileImage: true,
      },
    },
    book: {
      select: {
        id: true,
        title: true,
        author: true,
        coverImageUrl: true,
      },
    },
    _count: {
      select: {
        likes: true,
        bookmarks: true,
      },
    },
  },
  orderBy: {
    publishedAt: 'desc',
  },
  take: 20,
  skip: page * 20,
});
```

### 사용자별 좋아요/북마크 상태 조회

```typescript
// 로그인 사용자의 좋아요/북마크 상태 확인
const userInteractions = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    likes: {
      where: {
        reviewId: { in: reviewIds },
      },
      select: { reviewId: true },
    },
    bookmarks: {
      where: {
        reviewId: { in: reviewIds },
      },
      select: { reviewId: true },
    },
  },
});
```

### 좋아요 토글

```typescript
// 좋아요 추가/취소 (트랜잭션)
await prisma.$transaction(async (tx) => {
  const existing = await tx.like.findUnique({
    where: {
      userId_reviewId: { userId, reviewId },
    },
  });

  if (existing) {
    // 좋아요 취소
    await tx.like.delete({
      where: { id: existing.id },
    });
    await tx.review.update({
      where: { id: reviewId },
      data: { likeCount: { decrement: 1 } },
    });
  } else {
    // 좋아요 추가
    await tx.like.create({
      data: { userId, reviewId },
    });
    await tx.review.update({
      where: { id: reviewId },
      data: { likeCount: { increment: 1 } },
    });
  }
});
```

## Migration Strategy

1. **Phase 1**: Book, Review, Like, Bookmark 모델 추가
2. **Phase 2**: User 모델에 관계 추가
3. **Phase 3**: 인덱스 생성
4. **Phase 4**: 초기 시드 데이터 (테스트용)

**Migration Command**:

```bash
npx prisma migrate dev --name add-review-feed-entities
npx prisma generate
```

## Data Validation

### Review Content Validation

- 최소 길이: 10자
- 최대 길이: 10,000자
- HTML 태그 제거 (XSS 방지)

### Book Data Validation

- ISBN 형식 검증 (ISBN-13: 13자리 숫자)
- 제목/저자 필수
- 외부 URL 검증 (http/https)

## Performance Considerations

1. **인덱스 최적화**:
   - 피드 조회 쿼리: `status, publishedAt DESC` 복합 인덱스
   - N+1 문제 방지: `include`로 관련 데이터 한번에 로드

2. **비정규화**:
   - `Review.likeCount`: 좋아요 수 캐싱 (실시간 집계 방지)
   - `Review.bookmarkCount`: 북마크 수 캐싱 (통계용)

3. **Pagination**:
   - Cursor-based pagination 고려 (무한 스크롤 최적화)
   - Offset-based로 시작, 성능 이슈 시 Cursor 방식으로 전환

4. **캐싱**:
   - 피드 데이터: Redis 캐싱 (선택적, 성능 모니터링 후 결정)
   - Book 데이터: DB 캐싱으로 외부 API 호출 최소화

## Security Considerations

1. **Authorization**:
   - 비로그인 사용자: 조회만 가능
   - 로그인 사용자: 좋아요/북마크/작성 가능
   - 작성자: 본인 독후감 수정/삭제 가능

2. **Data Protection**:
   - Soft delete로 데이터 복구 가능
   - Cascade delete로 관련 데이터 정합성 유지

3. **Input Sanitization**:
   - Review content: HTML 태그 제거
   - Book data: 외부 API 데이터 검증

## Next Steps

1. ✅ API contracts 정의 (`contracts/`)
2. ✅ Quickstart guide 작성 (`quickstart.md`)
3. → Prisma migration 실행
4. → 시드 데이터 생성
5. → API 엔드포인트 구현
