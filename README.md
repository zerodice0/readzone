# ReadZone

독서 후 의견을 공유하는 **독서 전용 커뮤니티 SNS 플랫폼**

## 🎯 프로젝트 개요

ReadZone은 독서 계획 수립이 아닌, **독서 이후 커뮤니티 형성**에 초점을 둔 Threads 스타일 SNS 플랫폼입니다.

### 핵심 기능
- 📚 **3단계 도서 검색**: DB → 카카오 API → 수동 입력
- ✍️ **마크다운 독후감**: 실시간 미리보기 + 자동저장
- 💬 **소셜 기능**: 좋아요, 댓글, 팔로우 시스템
- 🔔 **실시간 알림**: WebSocket 기반 알림 시스템
- 📱 **반응형 디자인**: 모바일 퍼스트 UI/UX

## 🛠️ 기술 스택

### Frontend
- **Framework**: React 18 + Vite
- **Language**: TypeScript (strict mode)
- **State**: Zustand + TanStack Query
- **Router**: TanStack Router
- **UI**: Tailwind CSS + shadcn/ui
- **Editor**: @uiw/react-md-editor

### Backend
- **Framework**: Hono (Node.js)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite + Prisma ORM
- **API**: 카카오 도서 검색 API

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18.17.0+
- pnpm 8.0.0+

### 설치 및 실행

```bash
# Node 버전 설정
nvm use

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 값들을 설정하세요

# 데이터베이스 설정
pnpm db:generate
pnpm db:migrate

# 개발 서버 실행 (frontend: 3000, backend: 4001)
pnpm dev
```

### 개별 패키지 실행
```bash
# 프론트엔드만 실행
pnpm dev:frontend

# 백엔드만 실행
pnpm dev:backend
```

## 📁 프로젝트 구조

```
readzone/
├── packages/
│   ├── frontend/              # React + Vite 프론트엔드
│   │   ├── src/
│   │   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   │   ├── pages/         # 페이지 컴포넌트
│   │   │   ├── hooks/         # 커스텀 훅
│   │   │   ├── store/         # Zustand 스토어
│   │   │   ├── lib/           # 유틸리티 함수
│   │   │   └── types/         # TypeScript 타입 정의
│   │   └── package.json
│   └── backend/               # Hono 백엔드
│       ├── src/
│       │   ├── routes/        # API 라우트
│       │   ├── services/      # 비즈니스 로직
│       │   ├── middleware/    # 미들웨어
│       │   ├── db/            # 데이터베이스 관련
│       │   └── types/         # TypeScript 타입 정의
│       ├── prisma/
│       └── package.json
├── docs/                      # 프로젝트 문서
└── package.json              # 모노레포 루트
```

## 📋 사용 가능한 명령어

### 개발
```bash
pnpm dev                # 전체 개발 서버 실행
pnpm dev:frontend       # 프론트엔드만 실행
pnpm dev:backend        # 백엔드만 실행
```

### 빌드
```bash
pnpm build              # 전체 빌드
pnpm build:frontend     # 프론트엔드 빌드
pnpm build:backend      # 백엔드 빌드
```

### 코드 품질
```bash
pnpm lint               # 전체 린트 검사
pnpm lint:frontend      # 프론트엔드 린트
pnpm lint:backend       # 백엔드 린트
pnpm type-check         # 전체 타입 체크
pnpm type-check:frontend # 프론트엔드 타입 체크
pnpm type-check:backend # 백엔드 타입 체크
```

### 테스트
```bash
pnpm test               # 전체 테스트
pnpm test:frontend      # 프론트엔드 테스트
pnpm test:backend       # 백엔드 테스트
```

### 데이터베이스
```bash
pnpm db:generate        # Prisma 클라이언트 생성
pnpm db:migrate         # 데이터베이스 마이그레이션
pnpm db:reset           # 데이터베이스 초기화
pnpm db:seed            # 시드 데이터 삽입
```

### 유틸리티
```bash
pnpm clean              # 모든 빌드 파일과 node_modules 제거
pnpm fresh-install      # 클린 후 재설치
```

## 🔧 개발 규칙

### 코드 품질 필수 사항
- ✅ **TypeScript strict mode** 준수
- ✅ **ESLint 에러 0개, 경고 0개** 유지
- ✅ **any 타입 사용 금지**
- ✅ **사용하지 않는 변수/import 금지**
- ✅ **모든 undefined 가능성 명시적 처리**

### 커밋 전 체크리스트
```bash
# 필수 검증 명령어
pnpm lint           # 린트 검사 (0개 에러 필수)
pnpm type-check     # 타입 체크 (0개 에러 필수)
pnpm test           # 테스트 실행
```

## 📱 주요 페이지 (11개)

1. **독후감 피드** (`/`) - Threads 스타일 무한 스크롤
2. **로그인** (`/login`) - 서비스 소개 + 로그인
3. **회원가입** (`/register`) - 이메일 인증 포함
4. **비밀번호 찾기** (`/forgot-password`) - 이메일 재설정
5. **이메일 인증** (`/verify-email`) - 회원가입 후 처리
6. **도서 검색** (`/search`) - 카카오 API + 수동 입력
7. **도서 상세** (`/books/[id]`) - 도서 정보 + 독후감 목록
8. **독후감 작성** (`/write`) - 마크다운 에디터 + 자동저장
9. **독후감 상세** (`/review/[id]`) - 안전한 HTML 렌더링 + 댓글
10. **프로필** (`/profile/[userId]`) - 기본 정보 + 활동 통계
11. **설정** (`/settings`) - 프로필 편집 + 계정 관리

## 🔒 보안 고려사항

### 환경 변수 보안
- 모든 API 키와 시크릿은 `.env.local`에 저장
- 환경 변수 파일은 절대 Git에 커밋하지 않음
- 정기적인 키 로테이션 실시

### 애플리케이션 보안
- DOMPurify로 XSS 방지
- Prisma ORM으로 SQL Injection 방지
- 모든 사용자 입력 Zod 스키마 검증
- JWT 토큰 기반 인증 시스템

## 📚 문서

- [📋 개발 가이드](./docs/development-guide.md) - 상세 개발 규칙
- [🗄️ 데이터베이스 스키마](./docs/database-schema.md) - Prisma 스키마 전체
- [👥 사용자 흐름](./docs/user-flows.md) - UI/UX 플로우차트
- [🔗 API 통합](./docs/api-integration.md) - 카카오 API 가이드

## 🤝 기여하기

1. 이 저장소를 Fork
2. 새 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

질문이나 제안사항이 있으시면 이슈를 생성해 주세요.