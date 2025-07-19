# ReadZone API 명세서

## 1. 개요

### 1.1 기본 정보
- **Base URL**: `https://api.readzone.com` (프로덕션)
- **Base URL**: `http://localhost:3001` (개발)
- **API Version**: v1
- **Content-Type**: `application/json`
- **인증 방식**: JWT Bearer Token

### 1.2 공통 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": {
    // 실제 데이터
  },
  "message": "요청이 성공적으로 처리되었습니다" // 선택사항
}
```

#### 오류 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자에게 표시할 오류 메시지",
    "details": {} // 개발 환경에서만 제공
  }
}
```

#### 페이지네이션 응답
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 1.3 HTTP 상태 코드
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 리소스 없음
- `409`: 충돌 (중복 등)
- `429`: 요청 제한 초과
- `500`: 서버 오류

### 1.4 인증 헤더
```http
Authorization: Bearer <JWT_TOKEN>
```

## 2. 인증 (Authentication)

### 2.1 회원가입
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "username": "username",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 2.2 로그인
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com", // 또는 username
  "password": "password123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "username": "username"
    },
    "token": "jwt_token_here"
  }
}
```

### 2.3 로그아웃
```http
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "로그아웃되었습니다"
}
```

### 2.4 내 정보 조회
```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "username",
    "profile": {
      "displayName": "사용자 이름",
      "bio": "간단한 소개",
      "avatar": "https://example.com/avatar.jpg",
      "isPublic": true
    },
    "stats": {
      "postsCount": 15,
      "followersCount": 10,
      "followingCount": 5,
      "booksReadCount": 20
    }
  }
}
```

## 3. 사용자 관리 (Users)

### 3.1 사용자 프로필 조회
```http
GET /api/users/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "username",
    "profile": {
      "displayName": "사용자 이름",
      "bio": "간단한 소개",
      "avatar": "https://example.com/avatar.jpg",
      "isPublic": true
    },
    "stats": {
      "postsCount": 15,
      "followersCount": 10,
      "followingCount": 5,
      "booksReadCount": 20
    },
    "isFollowing": false // 로그인한 사용자가 이 사용자를 팔로우하는지
  }
}
```

### 3.2 프로필 수정
```http
PUT /api/users/profile
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "displayName": "새로운 이름",
  "bio": "새로운 소개",
  "avatar": "https://example.com/new-avatar.jpg",
  "isPublic": true
}
```

### 3.3 사용자 검색
```http
GET /api/users/search?q=검색어&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "user_123",
        "username": "username",
        "displayName": "사용자 이름",
        "avatar": "https://example.com/avatar.jpg",
        "followersCount": 10
      }
    ],
    "pagination": { /* 페이지네이션 정보 */ }
  }
}
```

### 3.4 팔로우
```http
POST /api/users/:userId/follow
```

**Headers:** `Authorization: Bearer <token>`

### 3.5 언팔로우
```http
DELETE /api/users/:userId/follow
```

**Headers:** `Authorization: Bearer <token>`

### 3.6 팔로워 목록
```http
GET /api/users/:userId/followers?page=1&limit=20
```

### 3.7 팔로잉 목록
```http
GET /api/users/:userId/following?page=1&limit=20
```

## 4. 도서 관리 (Books)

### 4.1 도서 검색 (카카오 API 프록시)
```http
POST /api/books/search
```

**Request Body:**
```json
{
  "query": "해리포터",
  "sort": "accuracy", // accuracy, recency
  "page": 1,
  "size": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "title": "해리 포터와 마법사의 돌",
        "contents": "책 소개 내용...",
        "url": "https://book.naver.com/...",
        "isbn": "9788983920775",
        "datetime": "2001-01-01T00:00:00.000+09:00",
        "authors": ["조앤 K. 롤링"],
        "publisher": "문학수첩",
        "translators": ["김혜원"],
        "price": 9900,
        "sale_price": 8910,
        "thumbnail": "https://search1.kakaocdn.net/thumb/...",
        "status": "정상판매"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### 4.2 도서 상세 조회
```http
GET /api/books/:isbn
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isbn": "9788983920775",
    "title": "해리 포터와 마법사의 돌",
    "authors": ["조앤 K. 롤링"],
    "publisher": "문학수첩",
    "publishedDate": "2001-01-01",
    "description": "상세한 책 소개...",
    "thumbnail": "https://example.com/thumbnail.jpg",
    "categories": ["소설", "판타지"],
    "pageCount": 320,
    "stats": {
      "postsCount": 150,
      "averageRating": 4.5,
      "readingCount": 50,
      "wantToReadCount": 200
    }
  }
}
```

### 4.3 인기 도서 목록
```http
GET /api/books/trending?period=week&limit=20
```

**Query Parameters:**
- `period`: `day`, `week`, `month`
- `limit`: 조회할 도서 수 (기본 20, 최대 50)

## 5. 독서 기록 (Posts)

### 5.1 게시글 목록 조회
```http
GET /api/posts?type=public&page=1&limit=20&sort=recent
```

**Query Parameters:**
- `type`: `public`, `following`, `my`
- `sort`: `recent`, `popular`, `rating`
- `userId`: 특정 사용자의 게시글 (선택사항)
- `isbn`: 특정 도서의 게시글 (선택사항)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "post_123",
        "content": "정말 재미있는 책이었습니다...",
        "rating": 5,
        "readingProgress": 100,
        "tags": ["판타지", "모험"],
        "isPublic": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": "user_123",
          "username": "username",
          "displayName": "사용자 이름",
          "avatar": "https://example.com/avatar.jpg"
        },
        "book": {
          "isbn": "9788983920775",
          "title": "해리 포터와 마법사의 돌",
          "authors": ["조앤 K. 롤링"],
          "thumbnail": "https://example.com/thumbnail.jpg"
        },
        "stats": {
          "likesCount": 10,
          "commentsCount": 5,
          "isLiked": false // 로그인한 사용자가 좋아요했는지
        }
      }
    ],
    "pagination": { /* 페이지네이션 정보 */ }
  }
}
```

### 5.2 게시글 상세 조회
```http
GET /api/posts/:postId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "post_123",
    "content": "상세한 독서 감상...",
    "rating": 5,
    "readingProgress": 100,
    "tags": ["판타지", "모험"],
    "isPublic": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "user": { /* 사용자 정보 */ },
    "book": { /* 도서 정보 */ },
    "stats": { /* 통계 정보 */ }
  }
}
```

### 5.3 게시글 작성
```http
POST /api/posts
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "독서 감상을 적어주세요...",
  "isbn": "9788983920775",
  "rating": 5, // 1-5
  "readingProgress": 100, // 0-100 (%)
  "tags": ["판타지", "모험"],
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "post_123",
    "content": "독서 감상을 적어주세요...",
    // ... 다른 필드들
  }
}
```

### 5.4 게시글 수정
```http
PUT /api/posts/:postId
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (게시글 작성과 동일)

### 5.5 게시글 삭제
```http
DELETE /api/posts/:postId
```

**Headers:** `Authorization: Bearer <token>`

### 5.6 게시글 좋아요
```http
POST /api/posts/:postId/like
```

**Headers:** `Authorization: Bearer <token>`

### 5.7 게시글 좋아요 취소
```http
DELETE /api/posts/:postId/like
```

**Headers:** `Authorization: Bearer <token>`

### 5.8 게시글 검색
```http
GET /api/posts/search?q=검색어&page=1&limit=20
```

**Query Parameters:**
- `q`: 검색어 (제목, 내용, 태그에서 검색)
- `tags`: 태그 필터 (쉼표로 구분)
- `rating`: 평점 필터 (예: 4 -> 4점 이상)

## 6. 댓글 (Comments)

### 6.1 댓글 목록 조회
```http
GET /api/posts/:postId/comments?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "comment_123",
        "content": "좋은 리뷰네요!",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": "user_456",
          "username": "commenter",
          "displayName": "댓글 작성자",
          "avatar": "https://example.com/avatar.jpg"
        },
        "replies": [
          {
            "id": "reply_123",
            "content": "감사합니다!",
            "createdAt": "2024-01-01T01:00:00.000Z",
            "user": { /* 답글 작성자 정보 */ }
          }
        ]
      }
    ],
    "pagination": { /* 페이지네이션 정보 */ }
  }
}
```

### 6.2 댓글 작성
```http
POST /api/posts/:postId/comments
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "댓글 내용...",
  "parentId": null // 대댓글인 경우 부모 댓글 ID
}
```

### 6.3 댓글 수정
```http
PUT /api/comments/:commentId
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "수정된 댓글 내용..."
}
```

### 6.4 댓글 삭제
```http
DELETE /api/comments/:commentId
```

**Headers:** `Authorization: Bearer <token>`

## 7. 나의 서재 (My Library)

### 7.1 서재 도서 목록
```http
GET /api/library/books?status=reading&page=1&limit=20
```

**Query Parameters:**
- `status`: `reading`, `completed`, `want_to_read`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "library_123",
        "status": "reading",
        "addedAt": "2024-01-01T00:00:00.000Z",
        "startedAt": "2024-01-01T00:00:00.000Z",
        "finishedAt": null,
        "currentPage": 150,
        "totalPages": 320,
        "notes": "개인 메모...",
        "book": { /* 도서 정보 */ }
      }
    ],
    "pagination": { /* 페이지네이션 정보 */ }
  }
}
```

### 7.2 서재에 도서 추가
```http
POST /api/library/books
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "isbn": "9788983920775",
  "status": "want_to_read" // reading, completed, want_to_read
}
```

### 7.3 서재 도서 상태 변경
```http
PUT /api/library/books/:libraryId
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "completed",
  "currentPage": 320,
  "notes": "완독 후 감상..."
}
```

### 7.4 서재에서 도서 제거
```http
DELETE /api/library/books/:libraryId
```

**Headers:** `Authorization: Bearer <token>`

## 8. 통계 및 분석 (Analytics)

### 8.1 개인 독서 통계
```http
GET /api/analytics/reading-stats?period=year
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period`: `month`, `year`, `all`

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "booksRead": 20,
      "pagesRead": 6000,
      "averageRating": 4.2,
      "favoriteGenres": ["소설", "에세이"],
      "readingStreak": 15 // 연속 독서일
    },
    "monthly": [
      {
        "month": "2024-01",
        "booksRead": 3,
        "pagesRead": 900
      }
    ],
    "genres": [
      {
        "genre": "소설",
        "count": 8,
        "percentage": 40
      }
    ]
  }
}
```

### 8.2 독서 목표
```http
GET /api/analytics/reading-goals
PUT /api/analytics/reading-goals
```

**PUT Request Body:**
```json
{
  "yearlyBooksTarget": 50,
  "yearlyPagesTarget": 15000
}
```

## 9. 추천 시스템 (Recommendations)

### 9.1 추천 도서
```http
GET /api/recommendations/books?limit=10
```

**Headers:** `Authorization: Bearer <token>`

### 9.2 추천 사용자
```http
GET /api/recommendations/users?limit=10
```

**Headers:** `Authorization: Bearer <token>`

### 9.3 추천 게시글
```http
GET /api/recommendations/posts?limit=20
```

**Headers:** `Authorization: Bearer <token>`

## 10. 오류 코드

### 10.1 인증 관련 오류
- `AUTH_001`: 유효하지 않은 토큰
- `AUTH_002`: 토큰 만료
- `AUTH_003`: 권한 없음
- `AUTH_004`: 이메일 중복
- `AUTH_005`: 사용자명 중복
- `AUTH_006`: 잘못된 로그인 정보

### 10.2 검증 오류
- `VALIDATION_001`: 필수 필드 누락
- `VALIDATION_002`: 잘못된 형식
- `VALIDATION_003`: 값의 범위 초과
- `VALIDATION_004`: 지원하지 않는 형식

### 10.3 리소스 오류
- `RESOURCE_001`: 리소스를 찾을 수 없음
- `RESOURCE_002`: 이미 존재하는 리소스
- `RESOURCE_003`: 삭제된 리소스에 접근

### 10.4 외부 API 오류
- `EXTERNAL_001`: 카카오 API 오류
- `EXTERNAL_002`: API 호출 제한 초과
- `EXTERNAL_003`: 외부 서비스 응답 없음

### 10.5 서버 오류
- `SERVER_001`: 내부 서버 오류
- `SERVER_002`: 데이터베이스 연결 오류
- `SERVER_003`: 서비스 일시 중단

---

이 API 명세서는 ReadZone 프로젝트의 백엔드 API 설계를 기반으로 작성되었습니다. 실제 구현 과정에서 세부사항이 조정될 수 있습니다.