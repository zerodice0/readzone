# CLAUDE.md

ReadZone 프로젝트 개발 가이드 - 독서 후 의견을 공유하는 **독서 전용 커뮤니티 SNS 플랫폼**

## 🎯 프로젝트 개요

**목적**: 독서 계획 수립이 아닌, **독서 이후 커뮤니티 형성**에 초점을 둔 Threads 스타일 SNS 플랫폼

## 🛠️ 핵심 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)  
- **Database**: SQLite + Prisma ORM
- **Authentication**: NextAuth.js
- **State**: Zustand + TanStack Query
- **UI**: Tailwind CSS + Radix UI
- **Editor**: React Quill 2.0+ (WYSIWYG HTML)
- **Security**: DOMPurify (XSS 방지)
- **API**: 카카오 도서 검색 API

## 🚨 핵심 개발 규칙

### 코드 품질 필수 사항
- **TypeScript strict mode** 준수
- **ESLint 에러 0개, 경고 0개** 유지
- **any 타입 사용 금지**
- **Next.js Image 컴포넌트** 필수 사용
- **React Hooks 규칙** 완전 준수

### 필수 검증 명령어
```bash
npm run lint      # 린트 검사 (0개 에러 목표)
npm run type-check # 타입 체크
```

> 📋 **상세 개발 규칙**: [개발 가이드](./docs/development-guide.md) 참조

## 📱 페이지 구성 (11개)

1. **독후감 피드** (`/`) - Threads 스타일 무한 스크롤, 비로그인 읽기 가능
2. **로그인** (`/login`) - 서비스 소개 + 로그인 폼
3. **회원가입** (`/register`) - 이메일 인증 포함
4. **비밀번호 찾기** (`/forgot-password`) - 이메일 재설정
5. **이메일 인증** (`/verify-email`) - 회원가입 후 처리
6. **도서 검색** (`/search`) - 카카오 API + 수동 입력
7. **도서 상세** (`/books/[id]`) - 도서 정보 + 280자 의견
8. **독후감 작성** (`/write`) - React Quill 에디터 + 자동저장
9. **독후감 상세** (`/review/[id]`) - 안전한 HTML 렌더링 + 댓글
10. **프로필** (`/profile/[userId]`) - 기본 정보 + 활동 통계
11. **설정** (`/settings`) - 프로필 편집 + 계정 관리

## 📁 프로젝트 구조

```
readzone/
├── app/                     # Next.js App Router
│   ├── (auth)/             # 인증: login, register, verify-email
│   ├── (main)/             # 메인: search, books, write, review, profile, settings  
│   └── api/                # API Routes: auth, books, reviews
├── components/             # 재사용 컴포넌트
│   ├── ui/                # Radix UI 기반
│   ├── editor/            # React Quill 에디터
│   ├── feed/              # 피드 시스템
│   └── book/              # 도서 관련
├── lib/                   # 유틸리티
├── hooks/                 # 커스텀 훅
├── store/                 # Zustand 스토어
├── types/                 # TypeScript 타입
└── prisma/               # 데이터베이스
```

## 🚀 빠른 시작

```bash
# 환경 설정
nvm use 18.17.0
npm install
cp .env.example .env.local

# 개발 실행
npm run dev

# 데이터베이스
npx prisma generate
npx prisma migrate dev
```

## 🎯 핵심 기능

### 3단계 도서 검색
1. **서버 DB 검색** → 2. **카카오 API** → 3. **수동 입력**

### React Quill 에디터
- WYSIWYG HTML 편집
- 자동저장 (5분 간격 + 로컬 백업)
- 다크테마 완전 지원

### 소셜 기능
- 좋아요/댓글 시스템
- 도서 의견 (280자)
- SNS 공유 최적화

## 📊 Phase별 개발 현황

- ✅ **Phase 1**: Foundation (기반 인프라) - 100% 완료
- ✅ **Phase 2**: Core Pages (핵심 페이지) - 100% 완료  
- ✅ **Phase 3**: Book System (도서 시스템) - 100% 완료
- ✅ **Phase 4**: Review System (독후감 시스템) - 100% 완료
- ✅ **Phase 5**: Social Features (소셜 기능) - 100% 완료
- ✅ **Phase 6**: Optimization (최적화) - 100% 완료

### 주요 성과
- 총 11개 페이지 모두 구현 완료
- React Quill 에디터 마이그레이션 완료 (Toast UI → React Quill)
- 성능 메트릭 목표 달성 (LCP <2.5s, FID <100ms, CLS <0.1)
- PWA 기능 구현 완료

## 📚 상세 문서

### 개발 관련
- [📋 개발 가이드](./docs/development-guide.md) - TypeScript, ESLint 규칙, 코딩 원칙
- [🎨 React Quill 가이드](./docs/react-quill-guide.md) - 에디터 시스템 완전 가이드
- [🗄️ 데이터베이스 스키마](./docs/database-schema.md) - Prisma 스키마 전체
- [🔗 API 통합](./docs/api-integration.md) - 카카오 API, API Routes 설계

### 프로젝트 관리
- [📈 Phase별 개발 계획](./docs/phase-development.md) - 6단계 개발 현황
- [🚀 배포 가이드](./docs/deployment.md) - 배포, 보안, 트러블슈팅
- [👥 사용자 흐름](./docs/user-flows.md) - UI/UX 플로우차트

## 🔒 중요 보안 주의사항

### 환경 변수 보안 (필수)
- **모든 API 키와 시크릿은 `.env.local`에 저장**
- **환경 변수 파일은 절대 Git에 커밋하지 않음**
- 정기적인 키 로테이션 실시

### 애플리케이션 보안
- NextAuth.js CSRF 보호 활용
- DOMPurify + SafeHtmlRenderer로 XSS 방지
- Prisma ORM으로 SQL Injection 방지
- 모든 사용자 입력 Zod 스키마 검증

ReadZone은 독서 커뮤니티 SNS 플랫폼으로, 6개 Phase에 걸쳐 완전히 구현되었습니다. 각 문서에서 상세한 정보를 확인하실 수 있습니다.