# CLAUDE.md

ReadZone 프로젝트 개발 가이드 - 독서 후 의견을 공유하는 **독서 전용 커뮤니티 SNS 플랫폼**

## 🎯 프로젝트 개요

**목적**: 독서 계획 수립이 아닌, **독서 이후 커뮤니티 형성**에 초점을 둔 Threads 스타일 SNS 플랫폼

## 🛠️ 핵심 기술 스택

### 🌐 배포 및 인프라 (비용 최적화)
- **배포**: Vercel (Hobby Plan - 무료)
- **데이터베이스**: Neon PostgreSQL (Free Tier - 무료)
- **파일 저장소**: Cloudinary (Free Plan - 무료)
- **이메일**: Resend (3,000개/월 - 무료)
- **분석**: Google Analytics 4 (추후 도입)

### Backend
- **Framework**: NestJS (엔터프라이즈급 Node.js 프레임워크)
- **Runtime**: Node.js 18+
- **Language**: TypeScript (strict mode)
- **Database**: Neon PostgreSQL + Prisma ORM
- **Authentication**: JWT + Passport 기반
- **Validation**: class-validator + class-transformer
- **API**: 카카오 도서 검색 API
- **개발 서버**: nest start --watch (포트 4001)
- **테스팅**: Jest + Supertest (E2E 테스트)

### 개발 환경
- **패키지 관리**: npm + Turborepo (모노레포 워크스페이스)
- **Node.js**: 18.17.0+ (권장)
- **TypeScript**: 5.3+ (strict mode)
- **개발 도구**: ESLint (0 경고 정책), Jest (단위 테스트)

### Frontend
- **Bundler**: Vite (포트 3000)
- **Framework**: React 19+
- **Language**: TypeScript (strict mode)
- **State**: Zustand + TanStack Query
- **UI**: Tailwind CSS + shadcn/ui
- **Router**: TanStack Router
- **Forms**: React Hook Form + Zod
- **Editor**: 
  - 독후감: @uiw/react-md-editor (Markdown)
  - 짧은 독후감: Native textarea
- **Security**: DOMPurify (XSS 방지)

## 🚨 핵심 개발 규칙

### 코드 품질 필수 사항
- **TypeScript strict mode** 준수
- **ESLint 에러 0개, 경고 0개** 유지
- **TypeScript 타입 체크 에러 0개** 유지
- **any 타입 사용 금지**
- **eslint-disable 주석 사용 금지** - 린트 규칙 회피 불가, 근본 원인 해결 필수
- **모든 타입은 명시적으로 정의** - Prisma 쿼리 결과도 정확한 타입 사용
- **이미지 최적화** 고려 (Vite 환경)
- **React Hooks 규칙** 완전 준수
- **사용하지 않는 변수/import 금지**
- **모든 undefined 가능성 명시적 처리**

### 📝 Lint & TypeScript 규칙 가이드

#### Backend (NestJS) 코드 작성 시 주의사항
```typescript
// ✅ GOOD - Prettier 규칙 준수
import { Injectable } from '@nestjs/common';  // 싱글 쿼트
const data = {
  name: 'test',
  items: [1, 2, 3],  // 트레일링 컴마
};

// ❌ BAD
import { Injectable } from "@nestjs/common";  // 더블 쿼트 사용 금지
const data = {
  items: [1, 2, 3]  // 트레일링 컴마 누락
}

// ✅ GOOD - 미사용 파라미터 처리
handleRequest(_err: any, user: any, _info: any) {
  return user;  // 언더스코어로 미사용 표시
}

// ❌ BAD
handleRequest(err: any, user: any, info: any) {  // 미사용 변수 에러
  return user;
}

// ✅ GOOD - Prisma 타입 정의
type UserWithRelations = Prisma.UserGetPayload<{
  include: { reviews: true; }
}>;

// ❌ BAD - spread로 타입 추론 실패
const includeConfig = { reviews: true };
const user = await prisma.user.findFirst({
  include: { ...includeConfig }  // 타입 추론 실패
});

// ✅ GOOD - Prisma mode 사용
where: {
  name: {
    contains: query,
    mode: 'insensitive',  // 문자열 직접 사용
  }
}

// ❌ BAD
mode: Prisma.QueryMode.insensitive  // import 필요
```

#### Frontend (React) 코드 작성 시 주의사항
```typescript
// ✅ GOOD - 타입 import
import type { FC, ReactNode } from 'react';
import { useState, useEffect } from 'react';

// ✅ GOOD - Props interface 정의
interface ComponentProps {
  title: string;
  count?: number;  // optional 명시
}

// ✅ GOOD - undefined 처리
const value = data?.property ?? defaultValue;
if (user?.name) {
  // null/undefined 체크
}

// ❌ BAD - noUncheckedIndexedAccess 위반
const item = array[index];  // 에러: undefined 가능
// ✅ GOOD
const item = array[index];
if (item) {
  // 사용 전 체크
}

// ✅ GOOD - Hooks deps
useEffect(() => {
  fetchData(id);
}, [id, fetchData]);  // 모든 의존성 명시

// ❌ BAD
useEffect(() => {
  fetchData(id);
}, []);  // exhaustive-deps 에러
```

#### 공통 주의사항
```typescript
// ✅ GOOD - 타입 안전성
const processData = (input: string): number => {
  return parseInt(input, 10);
};

// ❌ BAD - any 사용
const processData = (input: any): any => {
  return input;
};

// ✅ GOOD - 파일 끝 개행
export default MyComponent;
// (빈 줄)

// ❌ BAD - 개행 없음
export default MyComponent;  // EOF
```

### 필수 검증 명령어
```bash
npm run lint       # 린트 검사 (0개 에러 필수)
npm run type-check # 타입 체크 (0개 에러 필수)
```

**⚠️ 중요**: 실제 동작과 무관하게 모든 타입 에러와 린트 경고는 반드시 해결해야 합니다.

> 📋 **상세 개발 규칙**: [개발 가이드](./docs/development-guide.md) 참조

## 📱 페이지 구성 (11개)

1. **독후감 피드** (`/`) - Threads 스타일 무한 스크롤, 비로그인 읽기 가능
2. **로그인** (`/login`) - 서비스 소개 + 로그인 폼
3. **회원가입** (`/register`) - 이메일 인증 포함
4. **비밀번호 찾기** (`/forgot-password`) - 이메일 재설정
5. **이메일 인증** (`/verify-email`) - 회원가입 후 처리
6. **도서 검색** (`/search`) - 카카오 API + 수동 입력
7. **도서 상세** (`/books/[id]`) - 도서 정보 + 독후감 목록
8. **독후감 작성** (`/write`) - Markdown 에디터 + 자동저장
9. **독후감 상세** (`/review/[id]`) - 안전한 HTML 렌더링 + 댓글
10. **프로필** (`/profile/[userId]`) - 기본 정보 + 활동 통계
11. **설정** (`/settings`) - 프로필 편집 + 계정 관리

## 📁 프로젝트 구조

```
readzone/
├── packages/
│   ├── frontend/          # Vite + React 프론트엔드
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── lib/
│   │   └── vite.config.ts
│   └── backend/           # NestJS 백엔드
│       ├── src/
│       │   ├── modules/
│       │   ├── common/
│       │   ├── prisma/
│       │   └── main.ts
│       ├── test/
│       └── prisma/
├── docs/                  # 프로젝트 문서
└── package.json          # 모노레포 루트
```

## 🚀 빠른 시작

```bash
# 환경 설정
nvm use 18.17.0
npm install
cp .env.example .env.local

# 개발 실행 (프론트엔드 + 백엔드 동시 실행)
npm run dev

# 개별 실행
npm run dev:frontend  # 포트 3000
npm run dev:backend   # 포트 4001

# 데이터베이스 설정
npm run db:generate   # Prisma 클라이언트 생성
npm run db:migrate    # 데이터베이스 마이그레이션
npm run db:seed       # 샘플 데이터 추가

# 코드 품질 검사
npm run lint          # 모든 린트 검사 (Turborepo로 병렬 실행)
npm run type-check    # 타입 체크 (Turborepo로 병렬 실행)
npm run test          # 단위 테스트 실행
npm run test:e2e      # E2E 테스트 실행 (19개 테스트 완료)

# 빌드
npm run build         # 프로덕션 빌드 (Turborepo로 최적화)
```

## 🎯 핵심 기능

### 3단계 도서 검색
1. **서버 DB 검색** → 2. **카카오 API** → 3. **수동 입력**

### Markdown 에디터
- 독후감 작성: 마크다운 에디터 + 실시간 프리뷰
- 짧은 독후감: 일반 텍스트 입력
- 다크테마 완전 지원
- 페이지 이탈 시 저장 확인

### 소셜 기능
- 좋아요/댓글 시스템
- 독후감 (모든 길이 통합)
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
- Markdown 에디터 시스템 구축 완료
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

## 🔑 환경 변수 설정

### 필수 환경 변수
```bash
# 데이터베이스 (Neon)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."  # Prisma 마이그레이션용

# JWT 인증 (NestJS)
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# 파일 저장 (Cloudinary)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# 이메일 (Resend)
RESEND_API_KEY="re_your-api-key"

# 카카오 API
KAKAO_REST_API_KEY="your-kakao-api-key"
```

## 🔒 중요 보안 주의사항

### 환경 변수 보안 (필수)
- **모든 API 키와 시크릿은 `.env.local`에 저장**
- **환경 변수 파일은 절대 Git에 커밋하지 않음**
- **Vercel 배포 시 환경 변수 별도 설정**
- 정기적인 키 로테이션 실시

### 애플리케이션 보안
- NestJS ValidationPipe로 입력 검증
- JWT + Passport 기반 안전한 인증
- class-validator로 데이터 검증
- Prisma ORM으로 SQL Injection 방지
- DOMPurify + SafeHtmlRenderer로 XSS 방지 (프론트엔드)
- bcryptjs로 비밀번호 암호화

## ✅ NestJS 마이그레이션 완료

**2024.08 Backend 프레임워크 업그레이드**:
- ✅ **Hono → NestJS** 마이그레이션 완료
- ✅ **SQLite → Neon PostgreSQL** 데이터베이스 전환
- ✅ **JWT + Passport** 인증 시스템 구현
- ✅ **class-validator** 입력 검증 시스템
- ✅ **19개 E2E 테스트** 모두 통과
- ✅ **타입 안전성** 완전 보장 (0 type errors)

ReadZone은 독서 커뮤니티 SNS 플랫폼으로, 6개 Phase에 걸쳐 완전히 구현되었으며, 현재는 안정적이고 확장 가능한 NestJS 기반으로 운영됩니다.