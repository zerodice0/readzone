# Implementation Plan: 사용자 인증 시스템
*Path: [kitty-specs/001-feature/plan.md](kitty-specs/001-feature/plan.md)*

**Branch**: `001-feature` | **Date**: 2025-11-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/kitty-specs/001-feature/spec.md`

**Note**: This file is filled in by the `/spec-kitty.plan` command.

Planning answers confirmed during discovery phase. All technical decisions documented below.

## Summary

사용자 인증 시스템은 ReadZone 플랫폼의 핵심 기반 시설로, 안전하고 확장 가능한 사용자 관리를 제공합니다. 이메일/비밀번호 기본 인증, OAuth 소셜 로그인(카카오, 네이버, 구글), 세션 관리, 계정 복구 기능을 포함합니다.

**업데이트 (2025-01-06)**: 기술 스택 재검토 완료
- 기존 계획(Fastify)에서 NestJS로 변경
- 더 구조화된 프레임워크와 엔터프라이즈급 아키텍처 지원
- Passport.js 통합으로 다양한 OAuth 제공업체 지원

**기술 접근 방식**:
- Monorepo 구조 (pnpm workspaces)로 backend(NestJS + TypeScript)와 frontend(React + Vite + TypeScript) 통합 관리
- JWT 기반 인증 전략: @nestjs/jwt + @nestjs/passport로 표준 JWT 토큰 관리
- Prisma ORM으로 PostgreSQL 데이터 모델 관리 및 타입 안전성 보장
- Passport.js 전략: passport-kakao, passport-naver, passport-google-oauth20
- SendGrid를 통한 이메일 인증 및 비밀번호 재설정

## Technical Context

### Core Stack

**Language/Version**:
- Backend: Node.js 20 LTS + TypeScript 5.3+ (strict mode, **any 타입 절대 사용 금지**)
- Frontend: TypeScript 5.3+ (strict mode, **any 타입 절대 사용 금지**)

**Primary Dependencies**:
- Backend Framework: NestJS 10.x
- Frontend Framework: React 18.x
- Build Tool: Vite 5.x
- ORM: Prisma 5.x
- Authentication: @nestjs/jwt, @nestjs/passport, passport (v0.7.x)
- Passport Strategies: passport-local, passport-jwt, passport-kakao, passport-naver-v2, passport-google-oauth20
- Password Hashing: bcrypt
- Email Service: @sendgrid/mail
- Validation: class-validator + class-transformer (NestJS 표준)

**Storage**:
- Database: PostgreSQL 16+ (관계형 데이터, 사용자/세션/감사로그)
- Cache/Session: Redis 7+ (선택사항 - 세션 캐싱, rate limiting)
- File Storage: 로컬 파일 시스템 (프로필 이미지, 임시 업로드)

**Testing**:
- Backend: Jest (NestJS 기본 테스트 프레임워크), Supertest (API 통합 테스트)
- Frontend: Vitest + React Testing Library (컴포넌트 테스트)
- E2E: Playwright (사용자 시나리오 검증)
- Contract: Swagger/OpenAPI 스키마 검증 (@nestjs/swagger)

**Target Platform**:
- Deployment: 우분투 기반 미니PC (self-hosted)
- Runtime: Node.js 20 LTS
- Database: PostgreSQL 16 (로컬 설치)
- Cache/Session: Redis 7 (로컬 설치)
- Web Server: Nginx (리버스 프록시, HTTPS 종료)

**Project Type**: Monorepo web application (backend + frontend)

**Performance Goals**:
- API 응답 시간: p95 <200ms (읽기), p95 <500ms (쓰기)
- 동시 사용자: 1,000명 처리 가능
- 세션 조회: <50ms (데이터베이스), <10ms (Redis 캐시 사용 시)
- 로그인 완료: 1초 이내 (소셜 로그인), 2분 이내 (이메일 회원가입 → 인증 → 첫 로그인)
- 이메일 발송: 5분 이내 도착 (SendGrid SLA)

**Constraints**:
- TypeScript strict mode 필수, any 타입 절대 사용 금지
- 모든 API 엔드포인트 Swagger/OpenAPI 문서화 (@nestjs/swagger 데코레이터)
- 80% 이상 코드 커버리지 (critical paths)
- HTTPS 필수 (Let's Encrypt)
- 개인정보 보호: 30일 탈퇴 유예 정책, 비밀번호 암호화, 민감 정보 로깅 금지

**Scale/Scope**:
- 초기 목표: 1,000 동시 사용자
- 확장 계획: 무상태 서비스 설계로 수평 확장 가능
- 데이터베이스: 읽기 레플리카 지원 준비
- 세션: Redis 클러스터 확장 가능

### Development Environment

**Monorepo Structure**: pnpm workspaces
**Package Manager**: pnpm 8.x
**Code Quality**:
- Linting: ESLint (Airbnb TypeScript config 기반 커스터마이징)
- Formatting: Prettier
- Type Checking: TypeScript compiler (strict mode)
- Pre-commit: Husky + lint-staged

**CI/CD**:
- Version Control: Git
- CI: GitHub Actions 또는 로컬 GitLab Runner
- Deployment: Docker Compose (우분투 미니PC)
- Monitoring: Prometheus + Grafana (메트릭), Loki (로그)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. User-Centric Design ✅ PASS

**요구사항**:
- Accessibility: 익명 사용자 접근 가능
- Responsive Design: 모든 디바이스 지원
- Progressive Enhancement: 인증 전/후 기능 구분
- Intuitive Navigation: 3클릭 이내 접근

**구현 계획**:
- ✅ 익명 사용자는 로그인/회원가입 페이지 접근 가능
- ✅ React 반응형 UI 컴포넌트로 모바일/태블릿/데스크톱 지원
- ✅ 이메일 미인증 사용자는 제한된 기능 제공 (명세서 FR-011)
- ✅ 명확한 네비게이션: 로그인 → 회원가입 → 이메일 인증 흐름

**평가**: **적합**. 인증 시스템은 사용자 경험을 저해하지 않으며, 점진적 기능 제공을 지원합니다.

### II. Content First ✅ PASS (해당 없음)

**요구사항**: 콘텐츠 품질 및 검색/발견 기능

**평가**: **해당 없음**. 인증 시스템은 콘텐츠 관리와 직접적 관련 없음. 향후 독후감 작성 기능에서 검증 필요.

### III. Security & Privacy ✅ PASS

**요구사항**:
- Authentication: MFA 지원, OAuth 통합
- Authorization: RBAC (anonymous, user, moderator, admin)
- Data Protection: 암호화, GDPR 준수
- Rate Limiting: 엔드포인트 보호
- Audit Logging: 보안 이벤트 기록

**구현 계획**:
- ✅ OAuth: 카카오, 네이버, 구글 통합 (명세서 FR-005, FR-012, Passport 전략)
- ✅ 암호화: bcrypt (비밀번호), TLS 1.3 (전송), PostgreSQL 암호화 (저장)
- ✅ 개인정보 보호: 30일 탈퇴 유예 정책 (명세서 FR-024-1, FR-024-2)
- ✅ Rate Limiting: @nestjs/throttler (IP별 제한, 명세서 FR-014-1: 10회/15분)
- ✅ Audit Log: Prisma 모델 + 비동기 기록 (명세서 FR-025)
- ✅ 세션 보안: JWT 기반 인증, 세션 만료 정책 (24시간/30일)

**평가**: **적합**. 모든 보안 요구사항을 충족하며, 헌장의 보안 표준을 초과 달성.

### IV. Scalable Architecture ✅ PASS

**요구사항**:
- Stateless Services: 수평 확장 가능
- Caching Strategy: 캐시 전략 명시
- Database Design: 정규화, 읽기 레플리카
- Pagination: 커서 기반 페이지네이션
- Background Jobs: 비동기 처리

**구현 계획**:
- ✅ Stateless: JWT 기반 인증, NestJS 무상태 설계
- ✅ Caching: Redis (선택사항 - 세션 캐싱, rate limit 카운터), 명시적 TTL 설정
- ✅ Database: Prisma 정규화 스키마, 읽기 레플리카 준비 가능
- ✅ Pagination: cursor 기반 (사용자 목록, 감사 로그 조회)
- ✅ Background Jobs: 이메일 발송 (SendGrid), 감사 로그 기록

**평가**: **적합**. 확장 가능한 아키텍처 원칙을 준수하며, 초기부터 확장성을 고려한 설계.

### V. API-First Development ✅ PASS

**요구사항**:
- RESTful Design: REST 원칙, 버전 관리
- OpenAPI Documentation: 모든 엔드포인트 문서화
- Contract Testing: API 계약 테스트
- Error Handling: 구조화된 오류 응답
- Response Standards: 일관된 응답 포맷

**구현 계획**:
- ✅ RESTful: `/api/v1/auth/*`, `/api/v1/users/*` 엔드포인트 설계 (@Controller 데코레이터)
- ✅ OpenAPI: @nestjs/swagger (자동 생성, @ApiTags, @ApiOperation 데코레이터)
- ✅ Contract Testing: class-validator DTO + Supertest 검증
- ✅ Error Handling: NestJS 표준 예외 필터 (`HttpException`, 커스텀 필터)
- ✅ Response Standards: 일관된 응답 포맷 (인터셉터로 래핑)

**평가**: **적합**. API 우선 개발 원칙을 완전히 준수하며, OpenAPI 문서화 자동화.

### VI. Test-Driven Quality ✅ PASS

**요구사항**:
- Test-First: 구현 전 테스트 작성
- Testing Pyramid: Unit 70%, Integration 20%, E2E 10%
- Contract Tests: API 스키마 검증
- Edge Cases: 보안/검증 시나리오
- CI/CD Integration: 테스트 통과 필수

**구현 계획**:
- ✅ Test-First: Jest (NestJS 기본) + TDD 워크플로우 (Red-Green-Refactor)
- ✅ Testing Pyramid:
  - Unit: Jest (서비스 로직, 유틸리티)
  - Integration: Supertest (API 엔드포인트)
  - E2E: Playwright (명세서 사용자 시나리오)
- ✅ Contract Tests: class-validator DTO + OpenAPI 검증
- ✅ Edge Cases: 명세서 acceptance scenarios 완전 커버
- ✅ CI/CD: GitHub Actions, 테스트 실패 시 머지 차단

**평가**: **적합**. 테스트 주도 품질 원칙을 준수하며, 80% 커버리지 목표 설정.

### VII. Performance & Reliability ✅ PASS

**요구사항**:
- Response Time: p95 <200ms (읽기), <500ms (쓰기)
- Uptime Target: 99.5% 가동시간
- Monitoring: 모니터링 및 알림
- Graceful Degradation: 핵심 기능 유지
- Database Performance: 인덱싱, N+1 제거

**구현 계획**:
- ✅ Response Time: 명세서 목표 (p95 200ms 읽기, 500ms 쓰기) 준수
- ✅ Uptime: Docker health checks, 자동 재시작 (PM2 또는 Docker restart policy)
- ✅ Monitoring: Prometheus (메트릭), Grafana (대시보드), 로그 집계
- ✅ Graceful Degradation: 인증 실패 시에도 익명 사용자 기능 유지
- ✅ Database Performance:
  - Prisma 자동 인덱싱 (@@unique, @@index 지시어)
  - N+1 방지: Prisma include/select로 eager loading
  - 쿼리 모니터링: Prisma query logging + slow query 탐지

**평가**: **적합**. 성능 및 안정성 목표를 명시적으로 설정하고, 모니터링 인프라 계획.

### Constitution Check Summary

**전체 평가**: ✅ **모든 헌장 원칙 준수**

- 7개 핵심 원칙 중 6개 직접 적용 (II. Content First는 해당 없음)
- 보안 요구사항 100% 충족
- 개발 워크플로우 준수 (TypeScript strict, linting, PR 리뷰)
- 성능 및 확장성 목표 명시
- 위반 사항 없음 → Complexity Tracking 섹션 생략

**재검증 필요 시점**: Phase 1 설계 완료 후, 데이터 모델 및 API 계약 확정 시

## Project Structure

### Documentation (this feature)

```
kitty-specs/001-feature/
├── spec.md              # Feature specification (완료)
├── plan.md              # This file (진행 중)
├── research.md          # Phase 0 output (예정)
├── data-model.md        # Phase 1 output (예정)
├── quickstart.md        # Phase 1 output (예정)
├── contracts/           # Phase 1 output (예정)
│   ├── auth-api.yaml    # 인증 API OpenAPI 스키마
│   ├── users-api.yaml   # 사용자 관리 API 스키마
│   └── admin-api.yaml   # 관리자 API 스키마
├── checklists/          # 품질 체크리스트
│   └── requirements.md  # 요구사항 체크리스트 (완료)
└── tasks.md             # Phase 2 output (/spec-kitty.tasks - 미생성)
```

### Source Code (repository root)

Monorepo 구조 (pnpm workspaces):

```
packages/
├── backend/
│   ├── src/
│   │   ├── auth/               # 인증 모듈
│   │   │   ├── controllers/
│   │   │   │   └── auth.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── email.service.ts
│   │   │   ├── strategies/     # Passport 전략
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── local.strategy.ts
│   │   │   │   ├── kakao.strategy.ts
│   │   │   │   ├── naver.strategy.ts
│   │   │   │   └── google.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── local-auth.guard.ts
│   │   │   ├── dto/            # Data Transfer Objects
│   │   │   │   ├── signup.dto.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── reset-password.dto.ts
│   │   │   ├── entities/       # Prisma 엔티티 타입
│   │   │   └── auth.module.ts
│   │   ├── users/              # 사용자 관리 모듈
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   └── users.module.ts
│   │   ├── common/
│   │   │   ├── decorators/     # 커스텀 데코레이터
│   │   │   ├── filters/        # 예외 필터
│   │   │   ├── interceptors/   # 인터셉터
│   │   │   ├── pipes/          # 파이프
│   │   │   └── utils/
│   │   ├── config/
│   │   │   └── configuration.ts # 환경 변수 관리
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts
│   │   │   └── schema.prisma   # 데이터베이스 스키마
│   │   ├── app.module.ts       # 루트 모듈
│   │   └── main.ts             # 서버 엔트리포인트
│   ├── tests/
│   │   ├── unit/               # 단위 테스트
│   │   ├── integration/        # API 통합 테스트
│   │   └── fixtures/           # 테스트 데이터
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/           # 인증 UI
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── pages/
│   │   │   │   └── api/        # API 클라이언트
│   │   │   └── user/           # 사용자 프로필 UI
│   │   ├── shared/
│   │   │   ├── components/     # 공통 UI 컴포넌트
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── lib/
│   │   │   ├── api-client.ts   # Axios 설정
│   │   │   └── auth-context.tsx # 인증 상태 관리
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── e2e/                # Playwright 테스트
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── playwright.config.ts
│
├── shared/                     # 공유 타입 및 유틸리티 (선택사항)
│   ├── src/
│   │   └── types/
│   │       └── api.ts          # API 타입 정의
│   ├── package.json
│   └── tsconfig.json
│
├── pnpm-workspace.yaml
├── package.json                # 루트 package.json (스크립트 통합)
├── .eslintrc.js                # ESLint 설정
├── .prettierrc                 # Prettier 설정
├── docker-compose.yml          # PostgreSQL + Redis 로컬 개발 환경
└── README.md
```

**Structure Decision**:

Monorepo 구조를 선택한 이유:
1. **통합 관리**: 백엔드/프론트엔드 동시 개발 및 배포
2. **타입 공유**: TypeScript 타입을 packages/shared로 공유 가능
3. **일관된 도구**: ESLint, Prettier, TypeScript 설정 통일
4. **원자적 커밋**: API 변경 시 프론트엔드 동시 업데이트 가능

모듈화 접근 (NestJS):
- 백엔드: NestJS 모듈 시스템 활용 (auth, users 모듈)
  - 각 모듈은 controllers, services, dto, entities로 구성
  - @Module() 데코레이터로 의존성 주입 및 모듈 간 관계 정의
  - Passport 전략은 auth 모듈 내 strategies 디렉토리에 배치
- 프론트엔드: Feature-based 구조 (auth, user)
- 공통: shared 패키지로 API 타입 공유

**NestJS 아키텍처 장점**:
- 의존성 주입(DI)으로 테스트 용이성 향상
- 데코레이터 기반 라우팅 및 검증 (@Controller, @ApiTags, @IsEmail 등)
- @nestjs/swagger로 OpenAPI 문서 자동 생성
- Passport.js와의 긴밀한 통합 (@nestjs/passport)

## Complexity Tracking

*헌장 위반 사항 없음. 이 섹션은 생략됩니다.*

## Phase 0: Research & Discovery

**Status**: 기술 스택 확정 완료, 상세 연구 진행 예정

**Planning Answers Confirmed (2025-01-06)**:
- Backend: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Email: SendGrid
- OAuth: Passport.js (카카오, 네이버, 구글 전략)
- Frontend: React + Vite

**Objectives**:
- NestJS + Passport.js OAuth 통합 패턴 검증
- Passport 전략 구현 best practices (카카오/네이버/구글)
- SendGrid 이메일 템플릿 및 발송 로직 설계
- JWT 토큰 + Prisma 세션 관리 전략
- Prisma 스키마 설계 패턴 (User, Session, EmailVerification, PasswordReset 등)
- Rate limiting 전략 (@nestjs/throttler)

**Output**: research.md (다음 단계에서 생성 또는 업데이트)

## Phase 1: Design & Contracts

**Status**: Phase 0 완료 후 진행

**Objectives**:
- Prisma 데이터 모델 정의 (data-model.md)
  - User, Session, EmailVerification, PasswordReset, LoginAttempt, DeletedAccount 엔티티
  - 관계 정의 및 인덱스 전략
- OpenAPI 계약 생성 (contracts/)
  - auth-api.yaml: 회원가입, 로그인, OAuth, 비밀번호 재설정
  - users-api.yaml: 프로필 조회/수정, 계정 관리
  - @nestjs/swagger 데코레이터 기반 자동 생성
- 개발 환경 설정 가이드 (quickstart.md)
  - NestJS 프로젝트 초기화
  - Prisma 설정 및 마이그레이션
  - SendGrid API 키 설정
  - OAuth 앱 등록 (카카오/네이버/구글)
  - 로컬 PostgreSQL + Redis 설정

**Output**: data-model.md, contracts/, quickstart.md

---

**Next Steps**:
1. Phase 0 Research 시작 → `/spec-kitty.research` (기존 research.md 업데이트)
2. Phase 1 Design 진행 → data-model.md, contracts/ 생성
3. Phase 2 Tasks 생성 → `/spec-kitty.tasks`

**계획 업데이트 완료 (2025-01-06)**: 기술 스택이 NestJS + Prisma + SendGrid + Passport.js로 확정되었습니다.
