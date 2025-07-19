# ReadZone 개발 가이드

## 프로젝트 개요

**ReadZone**은 독서 기록을 작성하고 커뮤니티에서 공유할 수 있는 모던한 독서 플랫폼입니다.

### 핵심 목표
- 모던하고 친근한 독서 경험 제공
- 고풍스러운 독서 이미지 탈피
- 일상적이고 캐주얼한 독서 기록 문화 조성

## 프로젝트 구조

```
readzone/
├── readzone-backend/     # Node.js + Express API 서버
├── readzone-frontend/    # React + TypeScript 웹 앱
├── docs/                 # 프로젝트 문서
│   ├── PRD.md           # 전체 프로젝트 요구사항
│   ├── API.md           # API 명세서
│   └── DATABASE.md      # 데이터베이스 스키마
├── README.md            # 프로젝트 전체 소개
└── CLAUDE.md           # 이 파일
```

## 기술 스택

### Backend (readzone-backend)
- **런타임**: Node.js 18+
- **프레임워크**: Express.js
- **언어**: TypeScript
- **데이터베이스**: PostgreSQL
- **ORM**: Prisma
- **인증**: JWT
- **환경 관리**: dotenv
- **프로세스 관리**: PM2 (프로덕션)

### Frontend (readzone-frontend)
- **프레임워크**: React 18
- **언어**: TypeScript
- **라우팅**: React Router v6
- **스타일링**: Tailwind CSS
- **폰트**: Pretendard (한글 최적화)
- **상태 관리**: Zustand
- **HTTP 클라이언트**: Axios
- **폼 관리**: React Hook Form

### 인프라
- **운영체제**: Ubuntu Server
- **웹서버**: NGINX (리버스 프록시 + 정적 파일 서빙)
- **SSL**: Let's Encrypt
- **외부 API**: 카카오 도서 검색 API

## 개발 환경 설정

### 필수 사전 요구사항
- Node.js 18+
- PostgreSQL 14+
- Git

### 초기 설정
```bash
# 프로젝트 클론
git clone [repository-url]
cd readzone

# 백엔드 설정
cd readzone-backend
npm install
cp .env.example .env
# .env 파일 편집 후
npx prisma migrate dev
npm run dev

# 프론트엔드 설정 (새 터미널)
cd ../readzone-frontend
npm install
npm start
```

## 코딩 스타일 가이드

### TypeScript 규칙
- **strict 모드** 사용
- **explicit 타입 정의** 선호
- **interface over type** (객체 타입 정의 시)
- **함수형 컴포넌트** 사용 (React)

### 네이밍 컨벤션
```typescript
// 파일명: kebab-case
user-profile.tsx
book-search.service.ts

// 컴포넌트: PascalCase
const UserProfile = () => {}
const BookSearchForm = () => {}

// 변수/함수: camelCase
const userName = 'john'
const fetchBookData = async () => {}

// 상수: SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'
const MAX_SEARCH_RESULTS = 20

// 타입/인터페이스: PascalCase
interface User {
  id: string
  username: string
}

type BookSearchParams = {
  query: string
  page: number
}
```

### 폴더 구조 규칙

#### Backend 구조
```
src/
├── controllers/     # 요청 처리 로직
├── routes/         # 라우트 정의
├── services/       # 비즈니스 로직
├── models/         # 데이터 모델 (Prisma)
├── middleware/     # 미들웨어
├── utils/          # 유틸리티 함수
├── config/         # 설정 파일
└── types/          # TypeScript 타입 정의
```

#### Frontend 구조
```
src/
├── components/     # 재사용 가능한 컴포넌트
│   ├── ui/        # 기본 UI 컴포넌트
│   └── common/    # 공통 컴포넌트
├── pages/          # 페이지 컴포넌트
├── hooks/          # 커스텀 훅
├── services/       # API 호출 로직
├── stores/         # Zustand 스토어
├── types/          # TypeScript 타입
├── utils/          # 유틸리티 함수
└── styles/         # 스타일 파일
```

## API 설계 원칙

### REST API 규칙
```
GET    /api/books              # 도서 목록 조회
GET    /api/books/:id          # 도서 상세 조회
POST   /api/books/search       # 도서 검색

GET    /api/posts              # 공개 게시글 목록
POST   /api/posts              # 게시글 작성
GET    /api/posts/:id          # 게시글 상세 조회
PUT    /api/posts/:id          # 게시글 수정
DELETE /api/posts/:id          # 게시글 삭제

GET    /api/users/:id          # 사용자 프로필
GET    /api/users/:id/posts    # 사용자 게시글 목록

POST   /api/auth/register      # 회원가입
POST   /api/auth/login         # 로그인
POST   /api/auth/logout        # 로그아웃
GET    /api/auth/me            # 내 정보 조회
```

### 응답 형식
```typescript
// 성공 응답
{
  "success": true,
  "data": {
    // 실제 데이터
  },
  "message": "성공 메시지" // 선택사항
}

// 오류 응답
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자에게 표시할 메시지"
  }
}

// 페이지네이션
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## 데이터베이스 설계 원칙

### 테이블 명명 규칙
- **소문자 + 언더스코어** 사용
- **복수형** 사용 (users, posts, books)
- **관계 테이블**: `table1_table2` (user_follows, post_bookmarks)

### 컬럼 명명 규칙
- **snake_case** 사용
- **기본 컬럼**: id, created_at, updated_at
- **외래키**: `table_id` (user_id, book_id)
- **불린**: `is_`, `has_` 접두사 (is_public, has_cover)

### Prisma 스키마 예시
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  posts     Post[]
  bookmarks Bookmark[]
  
  @@map("users")
}

model Post {
  id        String   @id @default(cuid())
  content   String
  isPublic  Boolean  @default(true) @map("is_public")
  userId    String   @map("user_id")
  bookId    String   @map("book_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  user      User     @relation(fields: [userId], references: [id])
  book      Book     @relation(fields: [bookId], references: [id])
  bookmarks Bookmark[]
  
  @@map("posts")
}
```

## 보안 가이드라인

### 인증 & 인가
- **JWT 토큰** 사용 (액세스 토큰 방식)
- **비밀번호 해싱**: bcrypt 사용
- **환경 변수**로 시크릿 키 관리
- **CORS 설정** 프로덕션에서 제한

### API 보안
```typescript
// 인증 미들웨어 예시
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ success: false, error: { message: '토큰이 필요합니다' } })
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: { message: '유효하지 않은 토큰입니다' } })
    }
    req.user = user
    next()
  })
}
```

### 데이터 검증
- **입력 데이터 검증**: Joi 또는 Zod 사용
- **SQL 인젝션 방지**: Prisma ORM 사용
- **XSS 방지**: 사용자 입력 이스케이프

## 성능 최적화 가이드

### Backend 최적화
- **데이터베이스 인덱스** 적절히 설정
- **N+1 쿼리 방지**: Prisma include 활용
- **API 응답 캐싱**: Redis 또는 메모리 캐시
- **이미지 최적화**: 카카오 API 이미지 캐싱

### Frontend 최적화
- **코드 스플리팅**: React.lazy 사용
- **이미지 최적화**: WebP 포맷, lazy loading
- **메모이제이션**: React.memo, useMemo, useCallback
- **번들 크기 최적화**: Tree shaking

## 테스트 가이드라인

### Backend 테스트
```typescript
// Jest + Supertest 사용
describe('POST /api/posts', () => {
  it('should create a new post', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'test content',
        bookId: 'book123',
        isPublic: true
      })
      .expect(201)
    
    expect(response.body.success).toBe(true)
    expect(response.body.data.content).toBe('test content')
  })
})
```

### Frontend 테스트
```typescript
// React Testing Library 사용
import { render, screen, fireEvent } from '@testing-library/react'
import BookSearchForm from './BookSearchForm'

describe('BookSearchForm', () => {
  it('should submit search query', async () => {
    const mockOnSearch = jest.fn()
    render(<BookSearchForm onSearch={mockOnSearch} />)
    
    const input = screen.getByPlaceholderText('책 제목을 입력하세요')
    const button = screen.getByRole('button', { name: '검색' })
    
    fireEvent.change(input, { target: { value: '해리포터' } })
    fireEvent.click(button)
    
    expect(mockOnSearch).toHaveBeenCalledWith('해리포터')
  })
})
```

## 배포 가이드

### 프로덕션 환경 설정

#### NGINX 설정 예시
```nginx
server {
    listen 80;
    server_name readzone.example.com;

    location / {
        root /var/www/readzone-frontend/build;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### PM2 설정 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'readzone-backend',
    script: 'dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

### 배포 프로세스
```bash
# 1. 코드 업데이트
git pull origin main

# 2. 백엔드 배포
cd readzone-backend
npm install
npm run build
pm2 restart readzone-backend

# 3. 프론트엔드 배포
cd ../readzone-frontend
npm install
npm run build
sudo cp -r build/* /var/www/readzone-frontend/

# 4. NGINX 재시작
sudo nginx -t && sudo systemctl reload nginx
```

## 모니터링 & 로깅

### 로그 설정
- **Winston** 라이브러리 사용
- **로그 레벨**: error, warn, info, debug
- **파일 로테이션** 설정

### 모니터링 지표
- **응답 시간**
- **에러율**
- **데이터베이스 성능**
- **메모리 사용량**

## 개발 시 주의사항

### 1. 보안
- ❌ 비밀번호나 API 키를 코드에 하드코딩하지 마세요
- ❌ 사용자 입력을 검증 없이 사용하지 마세요
- ✅ 모든 API 엔드포인트에서 인증/인가를 확인하세요

### 2. 성능
- ❌ N+1 쿼리를 발생시키지 마세요
- ❌ 무한 스크롤 없이 대량 데이터를 로드하지 마세요
- ✅ 적절한 인덱스와 캐싱을 사용하세요

### 3. 사용자 경험
- ❌ 로딩 상태를 표시하지 않고 API를 호출하지 마세요
- ❌ 에러 메시지 없이 실패를 처리하지 마세요
- ✅ 사용자 친화적인 에러 메시지를 제공하세요

### 4. 코드 품질
- ❌ 타입 단언(as)을 남발하지 마세요
- ❌ any 타입을 사용하지 마세요
- ✅ 적절한 타입 정의와 에러 핸들링을 하세요

## 트러블슈팅

### 자주 발생하는 문제들

#### 1. 카카오 API 연동 이슈
```typescript
// 문제: CORS 오류
// 해결: 서버에서 프록시 처리
app.use('/api/books/search', createProxyMiddleware({
  target: 'https://dapi.kakao.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/books/search': '/v3/search/book'
  }
}))
```

#### 2. Prisma 마이그레이션 오류
```bash
# 문제: 마이그레이션 충돌
# 해결: 마이그레이션 리셋
npx prisma migrate reset
npx prisma db push
```

#### 3. JWT 토큰 만료 처리
```typescript
// 문제: 토큰 만료 시 자동 로그아웃
// 해결: Axios 인터셉터 활용
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그아웃 처리
      authStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

## 기여 가이드라인

### 브랜치 전략
- **main**: 프로덕션 브랜치
- **develop**: 개발 브랜치
- **feature/기능명**: 기능 개발 브랜치
- **hotfix/이슈명**: 긴급 수정 브랜치

### 커밋 메시지 규칙
```
type(scope): description

feat(auth): add JWT token refresh logic
fix(ui): resolve mobile responsive issue
docs(readme): update installation guide
```

### 코드 리뷰 체크리스트
- [ ] 코딩 스타일 가이드 준수
- [ ] 적절한 타입 정의
- [ ] 보안 취약점 검토
- [ ] 성능 최적화 고려
- [ ] 테스트 코드 작성
- [ ] 문서 업데이트

---

이 문서는 ReadZone 프로젝트의 개발 전반에 대한 가이드라인을 제공합니다. 궁금한 점이나 개선사항이 있다면 팀원들과 논의하여 문서를 지속적으로 업데이트해 주세요.