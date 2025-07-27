# ReadZone 데이터베이스 스키마

## 완전한 Prisma 스키마

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// NextAuth.js 필수 모델들
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// 사용자 모델
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  nickname      String    @unique
  bio           String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // NextAuth.js 관계
  accounts Account[]
  sessions Session[]
  
  // 앱 관계
  reviews  BookReview[]
  opinions BookOpinion[]
  likes    ReviewLike[]
  comments Comment[]
}

// 도서 모델
model Book {
  id            String   @id @default(cuid())
  isbn          String?  @unique         // API 검색 시에만
  title         String
  authors       String                   // JSON 문자열로 저장
  publisher     String?
  genre         String?
  pageCount     Int?
  thumbnail     String?
  description   String?
  isManualEntry Boolean  @default(false) // 수동 입력 여부
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // 관계
  reviews  BookReview[]
  opinions BookOpinion[]
}

// 독후감 모델
model BookReview {
  id            String   @id @default(cuid())
  title         String?
  content       String                   // HTML 콘텐츠 (React Quill 생성)
  isRecommended Boolean
  tags          String                   // JSON 문자열로 저장
  purchaseLink  String?                  // 구매 링크
  linkClicks    Int      @default(0)     // 클릭 추적
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // 관계
  userId String
  bookId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  book   Book   @relation(fields: [bookId], references: [id], onDelete: Cascade)

  likes    ReviewLike[]
  comments Comment[]
}

// 도서 의견 모델 (280자 제한)
model BookOpinion {
  id            String   @id @default(cuid())
  content       String
  isRecommended Boolean
  createdAt     DateTime @default(now())

  // 관계
  userId String
  bookId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  book   Book   @relation(fields: [bookId], references: [id], onDelete: Cascade)

  // 사용자당 도서별 1개 제한
  @@unique([userId, bookId])
}

// 좋아요 모델
model ReviewLike {
  id       String @id @default(cuid())
  userId   String
  reviewId String

  user   User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  review BookReview @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  // 사용자당 독후감별 1개 제한
  @@unique([userId, reviewId])
}

// 댓글 모델
model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 관계
  userId   String
  reviewId String
  user     User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  review   BookReview @relation(fields: [reviewId], references: [id], onDelete: Cascade)
}
```

## 주요 설계 특징

### NextAuth.js 완전 호환
- **Account**: OAuth 제공자 계정 정보 저장
- **Session**: 사용자 세션 관리
- **VerificationToken**: 이메일 인증 토큰

### 사용자별 제한
- **BookOpinion**: 사용자당 도서별 1개만 작성 가능
- **ReviewLike**: 사용자당 독후감별 1개의 좋아요만 가능

### 캐스케이드 삭제
- 사용자 삭제 시 관련된 모든 데이터 자동 삭제
- 도서 삭제 시 관련 독후감과 의견 삭제

### 수동 입력 지원
- **Book.isManualEntry**: API에서 찾을 수 없는 도서의 수동 입력 구분

### 클릭 추적
- **BookReview.linkClicks**: 구매 링크 클릭 수 추적

### JSON 저장
- **authors**: 여러 저자 정보를 JSON 문자열로 저장
- **tags**: 해시태그 배열을 JSON 문자열로 저장
- SQLite의 배열 타입 미지원으로 인한 선택

## 모델별 상세 설명

### User 모델
사용자의 기본 정보와 활동 내역을 저장합니다.
- `email`: 로그인용 이메일 (유니크)
- `nickname`: 서비스 내 표시명 (유니크)
- `bio`: 자기소개 (선택)
- `image`: 프로필 이미지 URL (선택)

### Book 모델
도서 정보를 저장합니다.
- `isbn`: 카카오 API 검색 도서의 경우만
- `isManualEntry`: true면 사용자가 직접 입력한 도서
- `authors`: JSON 형태로 저장 (예: `["저자1", "저자2"]`)

### BookReview 모델
독후감의 전체 내용을 저장합니다.
- `content`: React Quill로 생성된 HTML
- `isRecommended`: 추천/비추천 여부
- `tags`: 해시태그 배열 (예: `["자기계발", "동기부여"]`)
- `purchaseLink`: 선택적 구매 링크

### BookOpinion 모델
도서에 대한 간단한 의견을 저장합니다.
- `content`: 280자 제한 텍스트
- 사용자당 도서별 1개만 작성 가능

### Comment 모델
독후감에 대한 댓글을 저장합니다.
- 중첩 댓글은 Phase 5에서 추가됨
- 수정 가능 (updatedAt 필드)

### ReviewLike 모델
좋아요 관계를 저장합니다.
- 사용자와 독후감 간의 다대다 관계
- 중복 좋아요 방지

## 인덱스 및 성능 최적화

### 권장 인덱스 (프로덕션)
```sql
-- 자주 사용되는 조회 최적화
CREATE INDEX idx_book_reviews_user_id ON BookReview(userId);
CREATE INDEX idx_book_reviews_book_id ON BookReview(bookId);
CREATE INDEX idx_book_reviews_created_at ON BookReview(createdAt DESC);
CREATE INDEX idx_comments_review_id ON Comment(reviewId);
CREATE INDEX idx_book_opinions_book_id ON BookOpinion(bookId);
```

### 쿼리 최적화 팁
1. **피드 조회**: `createdAt` DESC 인덱스 활용
2. **사용자 콘텐츠**: `userId` 인덱스로 빠른 조회
3. **도서별 콘텐츠**: `bookId` 인덱스 활용
4. **좋아요 집계**: 별도 카운트 필드 고려

## 마이그레이션 가이드

### 개발 환경
```bash
# 스키마 변경 후
npx prisma migrate dev --name describe_your_change

# 클라이언트 재생성
npx prisma generate
```

### 프로덕션 환경
```bash
# 마이그레이션 파일 생성
npx prisma migrate dev --create-only

# 프로덕션 적용
npx prisma migrate deploy
```

### 데이터 시딩
```bash
# 개발용 샘플 데이터
npx prisma db seed
```

## 장르 분류 시스템

KDC(한국십진분류법) 기반:
```typescript
enum BookGenre {
  // 주요 분류
  PHILOSOPHY = '철학',
  RELIGION = '종교',
  SOCIAL_SCIENCE = '사회과학',
  LITERATURE = '문학',
  
  // 세부 문학 장르
  NOVEL = '소설',
  POETRY = '시',
  ESSAY = '에세이',
  
  // 실용서
  SELF_HELP = '자기계발',
  BUSINESS = '경영/경제',
  OTHER = '기타'
}
```

## 백업 및 복구

### SQLite 백업
```bash
# 백업 스크립트 (crontab)
0 2 * * * sqlite3 /path/to/prod.db ".backup /path/to/backup/prod-$(date +\%Y\%m\%d).db"

# 복구
sqlite3 prod.db ".restore /path/to/backup/prod-20250724.db"
```

### 데이터 무결성 체크
```sql
-- 고아 레코드 확인
SELECT * FROM BookReview WHERE userId NOT IN (SELECT id FROM User);
SELECT * FROM Comment WHERE reviewId NOT IN (SELECT id FROM BookReview);
```