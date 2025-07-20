# ReadZone 📚

모던하고 친근한 독서 기록 및 커뮤니티 플랫폼

## 프로젝트 소개

**ReadZone**은 독서 기록을 작성하고 커뮤니티에서 공유할 수 있는 모던한 독서 플랫폼입니다. 기존의 고풍스럽고 진부한 독서 이미지를 탈피하여, 일상적이고 캐주얼한 독서 문화를 조성하는 것을 목표로 합니다.

### ✨ 주요 기능

- **📖 독서 기록**: 책을 읽으며 느낀 감상을 자유롭게 기록 ✅
- **🔍 도서 검색**: 카카오 도서 API를 통한 풍부한 도서 데이터 ✅
- **👥 커뮤니티**: 다른 사용자들과 독서 경험 공유 및 소통 ✅
- **📚 개인 서재**: 읽은 책, 읽고 있는 책, 읽고 싶은 책 관리 ✅
- **📊 독서 통계**: 개인의 독서 패턴 분석 및 목표 설정 ✅
- **🔔 알림 시스템**: 팔로우, 좋아요, 댓글 등 실시간 알림 ✅
- **🏆 독서 목표**: 연간 독서 목표 설정 및 진행률 추적 ✅
- **🎯 추천 시스템**: 독서 그룹과 취향 기반 도서 추천 ✅
- **📱 PWA 지원**: 오프라인 사용 및 모바일 최적화 ✅

## 기술 스택

### Backend
- **Node.js** 18+ & **Express.js**
- **TypeScript** for type safety
- **PostgreSQL** with **Prisma ORM**
- **JWT** authentication
- **bcrypt** for password hashing
- **Jest** & **Supertest** for testing
- **Winston** for logging
- **Joi** for validation

### Frontend  
- **React** 18 with **TypeScript**
- **Tailwind CSS** for styling
- **React Router** v6 for routing
- **Zustand** for state management
- **Axios** for HTTP requests
- **React Hook Form** for form handling
- **Chart.js** for data visualization
- **PWA** features with Service Worker

### Infrastructure
- **NGINX** (reverse proxy)
- **PM2** (process management)
- **Let's Encrypt** (SSL certificates)

## 프로젝트 구조

```
readzone/
├── readzone-backend/     # Node.js + Express API 서버
├── readzone-frontend/    # React + TypeScript 웹 앱
├── docs/                 # 프로젝트 문서
│   ├── PRD.md           # 제품 요구사항 명세서
│   ├── API.md           # API 명세서
│   └── DATABASE.md      # 데이터베이스 스키마
├── README.md            # 이 파일
└── CLAUDE.md           # 개발 가이드
```

## 빠른 시작

### 사전 요구사항

- Node.js 18+
- PostgreSQL 14+
- Git

### 설치 및 실행

1. **프로젝트 클론**
```bash
git clone [repository-url]
cd readzone
```

2. **백엔드 설정**
```bash
cd readzone-backend
npm install
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 연결 정보 입력
npx prisma migrate dev
npm run dev
```

3. **프론트엔드 설정** (새 터미널)
```bash
cd readzone-frontend
npm install
npm start
```

4. **브라우저에서 확인**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### 환경 변수 설정

**Backend (.env)**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/readzone"
JWT_SECRET="your-super-secret-jwt-key"
KAKAO_API_KEY="your-kakao-api-key"
PORT=3001
NODE_ENV=development
```

**Frontend (.env)**
```env
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_ENV=development
```

## 개발 가이드

### 코딩 스타일

- **TypeScript strict 모드** 사용
- **함수형 컴포넌트** 선호 (React)
- **camelCase** for variables and functions
- **PascalCase** for components and types
- **kebab-case** for file names

### API 호출 예시

```typescript
// 게시글 목록 조회
const response = await axios.get('/api/posts?type=public&page=1&limit=20');

// 게시글 작성
const newPost = await axios.post('/api/posts', {
  content: '독서 감상...',
  isbn: '9788983920775',
  rating: 5,
  tags: ['소설', '판타지']
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 데이터베이스 스키마

주요 테이블:
- `users`: 사용자 정보
- `books`: 도서 정보
- `posts`: 독서 기록
- `comments`: 댓글
- `likes`: 좋아요
- `follows`: 팔로우 관계
- `library_books`: 개인 서재

자세한 스키마는 [DATABASE.md](docs/DATABASE.md)를 참고하세요.

## API 문서

REST API 엔드포인트:

- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/posts` - 게시글 목록
- `POST /api/posts` - 게시글 작성
- `GET /api/books/search` - 도서 검색
- `POST /api/users/:id/follow` - 팔로우

전체 API 문서는 [API.md](docs/API.md)를 참고하세요.

## 배포

### 프로덕션 빌드

**Backend**
```bash
cd readzone-backend
npm run build
npm run start:prod
```

**Frontend**
```bash
cd readzone-frontend
npm run build
# build/ 폴더의 파일들을 웹서버에 배포
```

### Docker 사용 (예정)

```bash
# 전체 스택 실행
docker-compose up -d

# 개발 환경
docker-compose -f docker-compose.dev.yml up
```

## 테스트

### Backend 테스트 (Jest + Supertest)

```bash
cd readzone-backend

# 모든 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:coverage

# 테스트 watch 모드
npm run test:watch

# 특정 테스트 파일 실행
npm test -- --testPathPattern=auth.test.ts
```

**테스트 커버리지:**
- ✅ 인증 API (회원가입, 로그인, 토큰 검증)
- ✅ 게시글 CRUD (작성, 수정, 삭제, 조회)
- ✅ 도서 검색 및 조회
- ✅ 사용자 프로필 및 팔로우
- ✅ 미들웨어 (인증, 에러 핸들링)
- ✅ 유틸리티 함수 (페이지네이션, 유효성 검사)

### Frontend 테스트

```bash
cd readzone-frontend
npm test
```

## 기여하기

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 개발 규칙

- 코드 스타일 가이드 준수
- 테스트 코드 작성
- API 변경 시 문서 업데이트
- 커밋 메시지는 [Conventional Commits](https://conventionalcommits.org/) 형식 사용

## 개발 진행 상황

### ✅ Phase 1 (MVP) - 완료
- [x] 사용자 인증 시스템 (JWT 기반)
- [x] 기본 독서 기록 작성 및 관리
- [x] 도서 검색 연동 (카카오 API)
- [x] 간단한 피드 기능
- [x] 데이터베이스 설정 및 마이그레이션

### ✅ Phase 2 (핵심 기능) - 완료  
- [x] 커뮤니티 기능 (좋아요, 댓글, 북마크)
- [x] 팔로우 시스템
- [x] 사용자 프로필 관리
- [x] 고급 검색 기능 (통합검색)
- [x] 도서 상세 페이지

### ✅ Phase 3 (고급 기능) - 완료
- [x] 독서 목표 설정 및 관리
- [x] 개인 서재 관리 (독서 상태, 진행률)
- [x] 알림 시스템 (실시간 알림)
- [x] 독서 통계 및 분석 (차트, 월별/연도별)
- [x] 소셜 기능 (독서 그룹, 추천 시스템)

### ✅ Phase 4 (최적화 및 품질) - 완료
- [x] 반응형 디자인 (모바일 최적화)
- [x] 성능 최적화 (이미지 lazy loading, 코드 스플리팅)
- [x] PWA 기능 (오프라인 지원, 푸시 알림)
- [x] 백엔드 테스트 구현 (Jest, Supertest)

### 🔮 향후 계획
- [ ] 프론트엔드 테스트 확장
- [ ] Docker 컨테이너화
- [ ] CI/CD 파이프라인 구축
- [ ] 소셜 로그인 (구글, 네이버)
- [ ] AI 기반 도서 추천
- [ ] 모바일 앱 (React Native)

## 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 문의 및 지원

- 이슈 제보: [GitHub Issues](https://github.com/username/readzone/issues)
- 문의사항: contact@readzone.com
- 개발 가이드: [CLAUDE.md](CLAUDE.md)

---

**ReadZone** - 모든 사람이 쉽고 재미있게 독서를 기록할 수 있는 플랫폼을 만들어가고 있습니다. 📚✨