# ReadZone 데이터베이스 설계

## 1. 개요

### 1.1 데이터베이스 정보
- **DBMS**: PostgreSQL 14+
- **ORM**: Prisma
- **인코딩**: UTF-8
- **타임존**: UTC

### 1.2 네이밍 규칙
- **테이블명**: 소문자 + 언더스코어, 복수형 (users, posts, books)
- **컬럼명**: snake_case
- **인덱스명**: idx_테이블명_컬럼명
- **외래키명**: fk_테이블명_참조테이블명

### 1.3 공통 컬럼
모든 테이블에는 다음 공통 컬럼이 포함됩니다:
- `id`: Primary Key (CUID)
- `created_at`: 생성 시간 (TIMESTAMP)
- `updated_at`: 수정 시간 (TIMESTAMP)

## 2. 테이블 설계

### 2.1 사용자 (users)
사용자 계정 정보를 저장하는 테이블

```sql
CREATE TABLE users (
    id VARCHAR(30) PRIMARY KEY, -- CUID
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt 해시
    display_name VARCHAR(100),
    bio TEXT,
    avatar VARCHAR(500),
    is_public BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Prisma Schema:**
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique
  password      String
  displayName   String?   @map("display_name")
  bio           String?
  avatar        String?
  isPublic      Boolean   @default(true) @map("is_public")
  emailVerified Boolean   @default(false) @map("email_verified")
  isActive      Boolean   @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  posts         Post[]
  comments      Comment[]
  likes         Like[]
  follows       Follow[] @relation("Follower")
  followers     Follow[] @relation("Following")
  libraryBooks  LibraryBook[]

  @@map("users")
}
```

### 2.2 도서 (books)
도서 정보를 저장하는 테이블 (카카오 API 데이터 캐싱)

```sql
CREATE TABLE books (
    id VARCHAR(30) PRIMARY KEY, -- CUID
    isbn VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    authors TEXT[], -- JSON 배열
    publisher VARCHAR(200),
    published_date DATE,
    description TEXT,
    thumbnail VARCHAR(500),
    categories TEXT[], -- JSON 배열
    page_count INTEGER,
    price INTEGER,
    sale_price INTEGER,
    url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE UNIQUE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_authors ON books USING GIN(authors);
CREATE INDEX idx_books_categories ON books USING GIN(categories);
```

**Prisma Schema:**
```prisma
model Book {
  id            String    @id @default(cuid())
  isbn          String    @unique
  title         String
  authors       String[]
  publisher     String?
  publishedDate DateTime? @map("published_date")
  description   String?
  thumbnail     String?
  categories    String[]
  pageCount     Int?      @map("page_count")
  price         Int?
  salePrice     Int?      @map("sale_price")
  url           String?
  status        String    @default("available")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  posts         Post[]
  libraryBooks  LibraryBook[]

  @@map("books")
}
```

### 2.3 게시글 (posts)
독서 기록 게시글을 저장하는 테이블

```sql
CREATE TABLE posts (
    id VARCHAR(30) PRIMARY KEY, -- CUID
    user_id VARCHAR(30) NOT NULL,
    book_id VARCHAR(30) NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    reading_progress INTEGER DEFAULT 0 CHECK (reading_progress >= 0 AND reading_progress <= 100),
    tags TEXT[], -- JSON 배열
    is_public BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_book_id ON posts(book_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_is_public ON posts(is_public);
CREATE INDEX idx_posts_rating ON posts(rating);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
```

**Prisma Schema:**
```prisma
model Post {
  id              String    @id @default(cuid())
  userId          String    @map("user_id")
  bookId          String    @map("book_id")
  content         String
  rating          Int?      @db.SmallInt
  readingProgress Int       @default(0) @map("reading_progress") @db.SmallInt
  tags            String[]
  isPublic        Boolean   @default(true) @map("is_public")
  isDeleted       Boolean   @default(false) @map("is_deleted")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  book            Book      @relation(fields: [bookId], references: [id], onDelete: Cascade)
  comments        Comment[]
  likes           Like[]

  @@map("posts")
}
```

### 2.4 댓글 (comments)
게시글 댓글을 저장하는 테이블

```sql
CREATE TABLE comments (
    id VARCHAR(30) PRIMARY KEY, -- CUID
    post_id VARCHAR(30) NOT NULL,
    user_id VARCHAR(30) NOT NULL,
    parent_id VARCHAR(30), -- 대댓글인 경우
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
```

**Prisma Schema:**
```prisma
model Comment {
  id        String    @id @default(cuid())
  postId    String    @map("post_id")
  userId    String    @map("user_id")
  parentId  String?   @map("parent_id")
  content   String
  isDeleted Boolean   @default(false) @map("is_deleted")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentReplies")

  @@map("comments")
}
```

### 2.5 좋아요 (likes)
게시글 좋아요를 저장하는 테이블

```sql
CREATE TABLE likes (
    id VARCHAR(30) PRIMARY KEY, -- CUID
    user_id VARCHAR(30) NOT NULL,
    post_id VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    
    UNIQUE(user_id, post_id)
);

-- 인덱스
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE UNIQUE INDEX idx_likes_user_post ON likes(user_id, post_id);
```

**Prisma Schema:**
```prisma
model Like {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  postId    String   @map("post_id")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@map("likes")
}
```

### 2.6 팔로우 (follows)
사용자 간 팔로우 관계를 저장하는 테이블

```sql
CREATE TABLE follows (
    id VARCHAR(30) PRIMARY KEY, -- CUID
    follower_id VARCHAR(30) NOT NULL, -- 팔로우하는 사람
    following_id VARCHAR(30) NOT NULL, -- 팔로우받는 사람
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- 인덱스
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE UNIQUE INDEX idx_follows_follower_following ON follows(follower_id, following_id);
```

**Prisma Schema:**
```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String   @map("follower_id")
  followingId String   @map("following_id")
  createdAt   DateTime @default(now()) @map("created_at")

  follower    User     @relation("Follower", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@map("follows")
}
```

### 2.7 서재 (library_books)
사용자의 개인 서재를 저장하는 테이블

```sql
CREATE TABLE library_books (
    id VARCHAR(30) PRIMARY KEY, -- CUID
    user_id VARCHAR(30) NOT NULL,
    book_id VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'want_to_read', -- want_to_read, reading, completed
    current_page INTEGER DEFAULT 0,
    total_pages INTEGER,
    notes TEXT,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    
    UNIQUE(user_id, book_id)
);

-- 인덱스
CREATE INDEX idx_library_books_user_id ON library_books(user_id);
CREATE INDEX idx_library_books_book_id ON library_books(book_id);
CREATE INDEX idx_library_books_status ON library_books(status);
CREATE UNIQUE INDEX idx_library_books_user_book ON library_books(user_id, book_id);
```

**Prisma Schema:**
```prisma
model LibraryBook {
  id          String    @id @default(cuid())
  userId      String    @map("user_id")
  bookId      String    @map("book_id")
  status      String    @default("want_to_read") // want_to_read, reading, completed
  currentPage Int       @default(0) @map("current_page")
  totalPages  Int?      @map("total_pages")
  notes       String?
  startedAt   DateTime? @map("started_at")
  finishedAt  DateTime? @map("finished_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  book        Book      @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@unique([userId, bookId])
  @@map("library_books")
}
```

### 2.8 독서 목표 (reading_goals)
사용자의 연간 독서 목표를 저장하는 테이블

```sql
CREATE TABLE reading_goals (
    id VARCHAR(30) PRIMARY KEY, -- CUID
    user_id VARCHAR(30) NOT NULL,
    year INTEGER NOT NULL,
    books_target INTEGER DEFAULT 0,
    pages_target INTEGER DEFAULT 0,
    books_read INTEGER DEFAULT 0,
    pages_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE(user_id, year)
);

-- 인덱스
CREATE INDEX idx_reading_goals_user_id ON reading_goals(user_id);
CREATE INDEX idx_reading_goals_year ON reading_goals(year);
CREATE UNIQUE INDEX idx_reading_goals_user_year ON reading_goals(user_id, year);
```

**Prisma Schema:**
```prisma
model ReadingGoal {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  year        Int
  booksTarget Int      @default(0) @map("books_target")
  pagesTarget Int      @default(0) @map("pages_target")
  booksRead   Int      @default(0) @map("books_read")
  pagesRead   Int      @default(0) @map("pages_read")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, year])
  @@map("reading_goals")
}
```

## 3. 뷰 (Views)

### 3.1 게시글 통계 뷰
```sql
CREATE VIEW post_stats AS
SELECT 
    p.id as post_id,
    COUNT(DISTINCT l.id) as likes_count,
    COUNT(DISTINCT c.id) as comments_count,
    AVG(p.rating) as average_rating
FROM posts p
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN comments c ON p.id = c.post_id AND c.is_deleted = false
WHERE p.is_deleted = false
GROUP BY p.id;
```

### 3.2 사용자 통계 뷰
```sql
CREATE VIEW user_stats AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT p.id) as posts_count,
    COUNT(DISTINCT f1.id) as followers_count,
    COUNT(DISTINCT f2.id) as following_count,
    COUNT(DISTINCT lb.id) FILTER (WHERE lb.status = 'completed') as books_read_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id AND p.is_deleted = false
LEFT JOIN follows f1 ON u.id = f1.following_id
LEFT JOIN follows f2 ON u.id = f2.follower_id
LEFT JOIN library_books lb ON u.id = lb.user_id
GROUP BY u.id;
```

### 3.3 도서 통계 뷰
```sql
CREATE VIEW book_stats AS
SELECT 
    b.id as book_id,
    COUNT(DISTINCT p.id) as posts_count,
    AVG(p.rating) as average_rating,
    COUNT(DISTINCT lb.id) FILTER (WHERE lb.status = 'reading') as reading_count,
    COUNT(DISTINCT lb.id) FILTER (WHERE lb.status = 'want_to_read') as want_to_read_count,
    COUNT(DISTINCT lb.id) FILTER (WHERE lb.status = 'completed') as completed_count
FROM books b
LEFT JOIN posts p ON b.id = p.book_id AND p.is_deleted = false
LEFT JOIN library_books lb ON b.id = lb.book_id
GROUP BY b.id;
```

## 4. 인덱스 최적화

### 4.1 복합 인덱스
```sql
-- 게시글 피드 조회 최적화
CREATE INDEX idx_posts_public_created ON posts(is_public, created_at DESC) WHERE is_deleted = false;

-- 팔로우 피드 조회 최적화
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC) WHERE is_deleted = false;

-- 댓글 조회 최적화
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at) WHERE is_deleted = false;

-- 좋아요 수 집계 최적화
CREATE INDEX idx_likes_post_created ON likes(post_id, created_at);
```

### 4.2 부분 인덱스
```sql
-- 활성 사용자만 인덱싱
CREATE INDEX idx_users_active_email ON users(email) WHERE is_active = true;

-- 공개 게시글만 인덱싱
CREATE INDEX idx_posts_public_rating ON posts(rating) WHERE is_public = true AND is_deleted = false;
```

## 5. 트리거 및 함수

### 5.1 통계 업데이트 트리거
```sql
-- 게시글 생성/삭제 시 사용자 통계 업데이트
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 구현 로직
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT OR UPDATE OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();
```

### 5.2 자동 타임스탬프 업데이트
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 적용
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 6. 데이터 마이그레이션

### 6.1 초기 데이터
```sql
-- 기본 카테고리 데이터
INSERT INTO categories (name, description) VALUES
('소설', '문학 소설'),
('에세이', '수필 및 에세이'),
('자기계발', '자기계발서'),
('경제경영', '경제 및 경영 도서'),
('과학', '과학 도서'),
('역사', '역사 도서'),
('예술', '예술 관련 도서');

-- 테스트 사용자 (개발 환경)
INSERT INTO users (id, email, username, password, display_name) VALUES
('test_user_1', 'test@example.com', 'testuser', '$2b$12$hash...', '테스트 사용자');
```

## 7. 백업 및 복구

### 7.1 백업 전략
- **전체 백업**: 매일 새벽 2시 자동 실행
- **증분 백업**: 매시간 트랜잭션 로그 백업
- **보관 기간**: 30일 (일간), 12개월 (주간), 5년 (월간)

### 7.2 백업 스크립트
```bash
#!/bin/bash
# 일간 백업 스크립트
BACKUP_DIR="/backup/readzone"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -h localhost -U readzone_user -d readzone > "$BACKUP_DIR/readzone_$DATE.sql"
gzip "$BACKUP_DIR/readzone_$DATE.sql"

# 30일 이전 백업 파일 삭제
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

## 8. 성능 모니터링

### 8.1 슬로우 쿼리 모니터링
```sql
-- 슬로우 쿼리 로깅 설정
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1초 이상
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();
```

### 8.2 인덱스 사용량 모니터링
```sql
-- 사용되지 않는 인덱스 찾기
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename, indexname;
```

## 9. 보안 설정

### 9.1 사용자 권한
```sql
-- 애플리케이션 사용자
CREATE USER readzone_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE readzone TO readzone_app;
GRANT USAGE ON SCHEMA public TO readzone_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO readzone_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO readzone_app;

-- 읽기 전용 사용자 (분석용)
CREATE USER readzone_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE readzone TO readzone_readonly;
GRANT USAGE ON SCHEMA public TO readzone_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readzone_readonly;
```

### 9.2 행 레벨 보안 (RLS)
```sql
-- 사용자는 자신의 데이터만 접근 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_policy ON users FOR ALL TO readzone_app
    USING (id = current_setting('app.current_user_id'));

-- 공개 게시글만 조회 가능
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_read_policy ON posts FOR SELECT TO readzone_app
    USING (is_public = true OR user_id = current_setting('app.current_user_id'));
```

---

이 데이터베이스 설계는 ReadZone 프로젝트의 요구사항을 충족하도록 설계되었으며, 확장성과 성능을 고려하여 작성되었습니다.