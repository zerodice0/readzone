# Work Packages: 사용자 인증 시스템

**Inputs**: Design documents from `/kitty-specs/001-feature/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅

**Tests**: Tests are NOT explicitly requested in the spec. Focus on implementation.

**Organization**: Fine-grained subtasks (`Txxx`) roll up into work packages (`WPxx`). Each work package must be independently deliverable and testable.

**Prompt Files**: Each work package references a matching prompt file in `kitty-specs/001-feature/tasks/planned/`.

## Subtask Format: `[Txxx] [P?] Description`

- **[P]** indicates the subtask can proceed in parallel (different files/components).
- Include precise file paths or modules.

## Path Conventions

- **Backend**: `packages/backend/src/`
- **Frontend**: `packages/frontend/src/`
- **Shared**: `packages/shared/src/`
- Monorepo structure with pnpm workspaces

---

## Work Package WP01: Setup & Monorepo Infrastructure (Priority: P0) ✅

**Goal**: Establish monorepo skeleton, tooling, and development environment.
**Independent Test**: Project bootstraps locally with `pnpm install && pnpm dev`, linting and formatting hooks work.
**Prompt**: `kitty-specs/001-feature/tasks/done/WP01-setup-monorepo-infrastructure.md`
**Status**: ✅ Completed and reviewed on 2025-11-06

### Included Subtasks

- [x] T001 Create monorepo structure (packages/backend, packages/frontend, packages/shared)
- [x] T002 Initialize root package.json with pnpm workspaces configuration
- [x] T003 [P] Setup backend package.json (Fastify, TypeScript, Prisma, dependencies per plan.md)
- [x] T004 [P] Setup frontend package.json (React, Vite, TypeScript, dependencies per plan.md)
- [x] T005 [P] Setup shared package.json (TypeScript, type definitions)
- [x] T006 Configure TypeScript strict mode (tsconfig.json) for all packages
- [x] T007 [P] Setup ESLint (Airbnb TypeScript config) and Prettier
- [x] T008 [P] Configure Husky + lint-staged for pre-commit hooks
- [x] T009 Create Docker Compose (PostgreSQL 16, Redis 7) per research.md
- [x] T010 Create .env.example with all required environment variables
- [x] T011 Document quickstart in README.md (pnpm install, docker-compose up, migrations)

### Implementation Notes

- Use pnpm 8.x workspaces for monorepo management
- Ensure TypeScript strict mode, any 타입 절대 사용 금지
- Docker Compose should match research.md specifications (PostgreSQL, Redis)

### Parallel Opportunities

- T003, T004, T005 (package.json setup) can proceed in parallel
- T007, T008 (linting/formatting) can proceed in parallel

### Dependencies

- None (starting package).

### Risks & Mitigations

- Tooling compatibility → pin versions in package.json
- Environment setup errors → comprehensive .env.example with comments

---

## Work Package WP02: Database Schema & Prisma Setup (Priority: P0) ✅

**Goal**: Define and migrate PostgreSQL schema for all entities (User, Session, OAuth, MFA, AuditLog).
**Independent Test**: `pnpm prisma migrate dev` succeeds, Prisma Client generates TypeScript types, seed data loads.
**Prompt**: `kitty-specs/001-feature/tasks/done/WP02-database-schema-prisma.md`
**Status**: Completed 2025-11-06

### Included Subtasks

- [x] T012 Create packages/backend/prisma/schema.prisma with all models per spec.md Key Entities
- [x] T013 Define User model (id, email, password_hash, name, profile_image, role, email_verified, mfa_enabled, soft_delete, timestamps)
- [x] T014 Define Session model (id, user_id, token, expires_at, device_info, ip_address, created_at)
- [x] T015 Define OAuthConnection model (id, user_id, provider, provider_user_id, created_at)
- [x] T016 Define MFASettings model (id, user_id, totp_secret, backup_codes, enabled, created_at)
- [x] T017 Define AuditLog model (id, user_id, event_type, details_jsonb, ip_address, user_agent, success, created_at)
- [x] T018 Define EmailVerificationToken model (id, user_id, token, expires_at, used, created_at)
- [x] T019 Define PasswordResetToken model (id, user_id, token, expires_at, used, created_at)
- [x] T020 Add indexes (email unique, session user_id + expires_at, audit_log user_id + created_at)
- [x] T021 Create initial migration (`pnpm prisma migrate dev --name init`)
- [x] T022 Create seed.ts script (test users with different roles)
- [x] T023 Document schema decisions in data-model.md (if not already created)

### Implementation Notes

- Follow Prisma best practices (camelCase fields, @id, @unique, @@index)
- Use DateTime for timestamps, String for UUIDs
- JSONB for flexible metadata (OAuth, AuditLog details)
- Ensure relationships (User 1:N Session, User 1:N OAuth, User 1:1 MFA)

### Parallel Opportunities

- Models T013-T019 can be drafted in parallel, then combined into schema.prisma

### Dependencies

- Depends on WP01 (Docker Compose, environment variables).

### Risks & Mitigations

- Migration conflicts → enforce single developer per migration window
- Schema drift → validate migrations in CI

---

## Work Package WP03: Backend Core Infrastructure (Priority: P0) ✅ DONE

**Goal**: Establish NestJS app structure, config management, error handling, logging, and middleware.
**Independent Test**: NestJS server starts, health endpoint returns 200, structured logging works, errors return standard format.
**Prompt**: `kitty-specs/001-feature/tasks/done/WP03-backend-core-infrastructure.md`
**Status**: Approved 2025-11-06 - All verification passed, framework change from Fastify to NestJS justified

### Included Subtasks

- [x] T024 Create packages/backend/src/main.ts (NestJS server entry point)
- [x] T025 Create packages/backend/src/app.module.ts (NestJS app module with DI)
- [x] T026 Implement config/index.ts (Zod-validated environment variables per research.md)
- [x] T027 [P] Setup Pino structured logging (packages/backend/src/common/utils/logger.ts)
- [x] T028 [P] Implement standard error handler (packages/backend/src/common/filters/http-exception.filter.ts)
- [x] T029 [P] Create standard response format helpers (packages/backend/src/common/utils/response.ts)
- [x] T030 Register CORS middleware with secure defaults
- [x] T031 Register Helmet middleware for security headers
- [x] T032 Create health endpoint (GET /api/v1/health) with database/redis checks
- [x] T033 Configure Prisma client (packages/backend/src/common/utils/prisma.ts) with connection pooling
- [x] T034 Configure Redis client (packages/backend/src/common/utils/redis.ts) with retry logic

### Implementation Notes

- Use research.md error format: `{ status, error: { code, message, details } }`
- Zod schema for config validation (crash early if env vars missing)
- Pino logger with structured JSON output
- Health endpoint checks PostgreSQL + Redis connectivity

### Parallel Opportunities

- T027, T028, T029 (utils and middleware) can proceed in parallel

### Dependencies

- Depends on WP01, WP02.

### Risks & Mitigations

- Config validation errors → comprehensive error messages
- Database connection failures → retry logic with exponential backoff

---

## Work Package WP04: Authentication Core (JWT + Database Session) (Priority: P1) 🎯 MVP ✅

**Goal**: Implement hybrid authentication strategy (JWT + Database session) with register/login/logout.
**Independent Test**: User can register, login (receive JWT), access protected route, logout (session invalidated).
**Prompt**: `kitty-specs/001-feature/tasks/done/WP04-authentication-core.md`
**Status**: ✅ Completed and approved on 2025-11-06

### Included Subtasks

- [x] T035 Register @nestjs/jwt module with secret from config
- [x] T036 Implement database session management with Prisma
- [x] T037 Implement password hashing service (packages/backend/src/modules/auth/services/password.service.ts) using bcrypt per plan.md
- [x] T038 Create class-validator DTOs for auth endpoints (packages/backend/src/modules/auth/dto/)
- [x] T039 Implement POST /api/v1/auth/register (controller: packages/backend/src/modules/auth/controllers/auth.controller.ts)
- [x] T040 Implement POST /api/v1/auth/login (controller: packages/backend/src/modules/auth/controllers/auth.controller.ts)
- [x] T041 Implement POST /api/v1/auth/logout (controller: packages/backend/src/modules/auth/controllers/auth.controller.ts)
- [x] T042 Create JWT authentication strategy (packages/backend/src/modules/auth/strategies/jwt.strategy.ts) that verifies JWT + checks database session
- [x] T043 Implement session service (packages/backend/src/modules/auth/services/session.service.ts) for create/validate/revoke in database
- [x] T044 Wire auth module (packages/backend/src/modules/auth/auth.module.ts) to NestJS app
- [x] T045 Add audit logging to auth events (login success/fail, register, logout)

### Implementation Notes

- Hybrid workflow: JWT payload contains session_id, verify JWT → check database session exists
- Bcrypt config: 12 rounds (per plan.md decision based on research.md benchmarks)
- Session TTL: 24 hours default, extendable to 30 days (remember me)
- Rate limiting: 5 attempts/5min per IP (defer to WP08)
- Framework: NestJS with @nestjs/jwt, @nestjs/passport
- Validation: class-validator + class-transformer (NestJS standard)
- Session storage: PostgreSQL via Prisma (not Redis)

### Parallel Opportunities

- T037 (password service), T038 (schemas) can proceed in parallel
- T039, T040, T041 (controllers) can proceed in parallel after T037, T038

### Dependencies

- Depends on WP01, WP02, WP03.

### Risks & Mitigations

- JWT secret compromise → rotate secrets, use strong random strings
- Session fixation → regenerate session ID after login
- Timing attacks on password verification → use constant-time comparison

---

## Work Package WP05: Email Verification & Password Reset (Priority: P1) 🎯 MVP

**Goal**: Implement email verification flow and password reset flow with token-based security.
**Independent Test**: User registers → receives verification email → clicks link → email verified. User requests password reset → receives email → resets password.
**Prompt**: `kitty-specs/001-feature/tasks/done/WP05-email-verification-password-reset.md`
**Status**: ✅ Done - All phases completed (T046-T054)

### Included Subtasks

- [x] T046 Setup email service abstraction (packages/backend/src/common/services/email.service.ts) with mock implementation (console.log for dev)
- [x] T047 Create token generation utility (packages/backend/src/common/utils/token.ts) with crypto.randomBytes
- [x] T048 Implement POST /api/v1/auth/verify-email/send (send verification email with token)
- [x] T049 Implement POST /api/v1/auth/verify-email/confirm (verify token, mark email_verified=true)
- [x] T050 Implement POST /api/v1/auth/password-reset/request (send reset email with token)
- [x] T051 Implement POST /api/v1/auth/password-reset/confirm (verify token, update password)
- [x] T052 Implement token expiration logic (24 hours for verification, 1 hour for password reset)
- [x] T053 Add rate limiting to email endpoints (3 sends/5min per email, defer actual rate limit to WP08)
- [x] T054 Add audit logging for email verification and password reset events

### Implementation Notes

- Token format: URL-safe random string (32 bytes → base64url)
- Store tokens in EmailVerificationToken, PasswordResetToken tables with expires_at
- Mark token as used after confirmation (prevent replay)
- Email service: console.log for now, integrate SendGrid/AWS SES later

### Parallel Opportunities

- T046 (email service), T047 (token utility) can proceed in parallel
- T048, T049 (verification) and T050, T051 (reset) can proceed in parallel after T046, T047

### Dependencies

- Depends on WP04.

### Risks & Mitigations

- Token leakage → use HTTPS only, short expiration
- Email deliverability → log email attempts, add retry logic
- Token reuse → mark as used after first confirmation

---

## Work Package WP06: User Management & Profiles (Priority: P2)

**Goal**: Implement user CRUD, profile management, admin functions, and RBAC authorization.
**Independent Test**: User can view/update profile (email), delete account (soft-delete 30d), admin can list/manage users with role-based access control.
**Prompt**: `kitty-specs/001-feature/tasks/done/WP06-user-management-profiles.md`
**Status**: ✅ Partial Complete - T055, T056 done (2025-11-08), T057-T066 remaining

### Task Categories

**Authorization (T063)**: RBAC middleware - foundation for all protected endpoints
**User Endpoints (T055-T058)**: Profile CRUD and soft-delete
**Admin Endpoints (T059-T062)**: User management for administrators
**Audit & Quality (T064-T066)**: Logging, testing, documentation

### Included Subtasks

#### 🔐 Authorization Foundation (Priority: Critical)

- [ ] **T063**: RolesGuard + @Roles() decorator (3-4h, Medium)
  - Files: `common/guards/roles.guard.ts`, `common/decorators/roles.decorator.ts`
  - Tests: Unit tests for role checks (ADMIN, MODERATOR, USER)
  - Blocks: T059, T060, T061, T062 (all admin endpoints)

#### 👤 User Profile Endpoints

- [x] **T055**: GET /users/me - 프로필 조회 (2-3h, Low) ✅ 2025-11-08
  - Files: `users/dto/user-profile.dto.ts`, `users/users.service.ts`, `users/users.controller.ts`
  - Returns: email, role, emailVerified, mfaEnabled, oauthConnections, hasPassword
  - Tests: 4 integration tests (authenticated, unauthenticated, OAuth-only, MFA-enabled)
  - Note: See `kitty-specs/001-feature/tasks/done/WP06-user-management-profiles.md`

- [x] **T056**: PATCH /users/me - 프로필 수정 (3-4h, Medium) ✅ 2025-11-08
  - Files: `users/dto/update-profile.dto.ts`, `users/users.service.ts`, `users/users.controller.ts`
  - Features: Email 변경 시 재인증, 중복 이메일 체크, Audit log
  - Tests: 4 integration tests (email change, duplicate check, validation, audit)
  - Depends: T055
  - Note: See `kitty-specs/001-feature/tasks/done/WP06-user-management-profiles.md`

- [ ] **T057**: DELETE /users/me - 계정 삭제 (4-5h, Medium)
  - Files: `users/dto/delete-account.dto.ts`, `users/users.service.ts`, `users/users.controller.ts`
  - Features: 비밀번호 확인, soft-delete (status=DELETED, deletedAt), 30일 유예, 세션 무효화
  - Tests: 5 integration tests (valid, invalid pwd, confirm flag, session revoke, audit)
  - Depends: T055, T056

- [ ] **T058**: Cron job - 30일 경과 계정 물리 삭제 (2-3h, Low)
  - File: `users/tasks/cleanup-deleted-users.task.ts` (pseudocode)
  - Implementation: 의사코드만 작성 (실제 구현 Phase 2 범위 외)
  - Documentation: README Background Jobs 섹션 추가
  - Depends: T057

#### 👥 Admin User Management Endpoints

- [ ] **T059**: GET /admin/users - 사용자 목록 조회 (4-5h, Medium)
  - Files: `users/dto/list-users-query.dto.ts`, `users/users.service.ts`, `users/admin.controller.ts` (new)
  - Features: Pagination (offset-based), filters (role, status, search), sorting
  - Tests: 6 integration tests (admin access, user forbidden, pagination, filters, search, sort)
  - Depends: T063 (RolesGuard)

- [ ] **T060**: GET /admin/users/:id - 사용자 상세 조회 (2-3h, Low)
  - Files: `users/users.service.ts`, `users/admin.controller.ts`
  - Returns: User + 최근 세션 5개 + 최근 Audit log 10개 + OAuth connections + MFA
  - Tests: 5 integration tests (admin access, not found, no password leak, sessions, audit logs)
  - Depends: T059

- [ ] **T061**: PATCH /admin/users/:id - 사용자 정보 수정 (4-5h, Medium)
  - Files: `users/dto/update-user.dto.ts`, `users/users.service.ts`, `users/admin.controller.ts`
  - Features: 역할 변경, 상태 변경 (SUSPENDED → 세션 무효화), emailVerified 강제 설정
  - Rules: 자기 자신 수정 금지, ANONYMOUS 할당 금지, DELETED 할당 금지
  - Tests: 5 integration tests (role change, self-modify block, suspend sessions, audit critical)
  - Depends: T060

- [ ] **T062**: DELETE /admin/users/:id/force-delete - 강제 삭제 (2-3h, Low)
  - Files: `users/users.service.ts`, `users/admin.controller.ts`
  - Features: 즉시 물리 삭제 (CASCADE: sessions, OAuth, MFA, tokens), AuditLogs 보존 (userId=null)
  - Rules: 자기 자신 삭제 금지, GDPR 완전 삭제
  - Tests: 5 integration tests (delete success, self-delete block, not found, CASCADE, audit preserve)
  - Depends: T061

#### 📊 Audit, Testing & Documentation

- [ ] **T064**: Audit Logging 통합 (2h, Low)
  - Prisma schema: AuditAction enum 확장 (PROFILE_UPDATE, ACCOUNT_DELETE, ROLE_CHANGE, etc.)
  - Validation: 모든 T055-T062 엔드포인트 Audit log 호출 확인
  - Critical actions: ROLE_CHANGE, ACCOUNT_DELETE, ACCOUNT_FORCE_DELETE, ACCOUNT_SUSPEND
  - Depends: T055-T062

- [ ] **T065**: Integration Tests for WP06 (6-8h, Medium)
  - Test Files: `test/users.e2e-spec.ts`, `test/admin.e2e-spec.ts`, `test/authorization.e2e-spec.ts`
  - Coverage: User endpoints (13 tests), Admin endpoints (21 tests), Authorization (12 tests)
  - Total: 46 integration tests, code coverage ≥80%
  - Depends: T055-T064

- [ ] **T066**: Documentation (2h, Low)
  - Files: `README.md` (User Management 섹션), `docs/user-management.md` (new)
  - Content: API 사용법, RBAC 구조, Soft-delete vs Force-delete, Audit log 활용
  - OpenAPI validation: contracts/users-api.yaml, contracts/admin-api.yaml 일치 확인
  - Depends: T065

### Implementation Notes

**Authorization (T063)**:

- RolesGuard: Reflector 사용, @Roles() 메타데이터 읽기
- @Roles(UserRole.ADMIN): 데코레이터로 역할 제한
- ResourceOwnerGuard (선택): 사용자가 자신의 리소스만 접근

**Soft-Delete (T057)**:

- status = UserStatus.DELETED, deletedAt = now()
- 30일 유예 기간 (T058 cron job에서 물리 삭제)
- 모든 활성 세션 즉시 무효화 (isActive = false, revokedAt = now())

**Pagination (T059)**:

- Offset-based: `skip = (page - 1) * limit`, `take = limit`
- Cursor-based는 Phase 3에서 고려 (현재 명세에는 offset-based)

**Audit Logging (T064)**:

- 모든 User/Admin 작업에 Audit log 기록
- Severity: INFO (일반 작업), WARNING (실패), CRITICAL (역할 변경, 계정 삭제)
- Metadata: 변경 전/후 값, adminId (관리자 작업 시)

### Parallel Opportunities

**Phase 1 (Authorization + User Endpoints)**:

- T063 (Authorization) → 먼저 완료 (다른 작업의 기반)
- T055, T056, T057 → 병렬 가능 (서로 독립적, T063 완료 후)

**Phase 2 (Admin Endpoints)**:

- T059, T060 → 병렬 가능 (T063 완료 후)
- T061, T062 → 병렬 가능 (T060 완료 후)

**Phase 3 (Quality)**:

- T064, T065, T066 → 순차 실행 (모든 구현 완료 후)

### Dependencies

**External Dependencies**:

- WP04 (Authentication Core) - JWT, Session 기반 필수
- WP05 (Email Verification) - EmailService 사용 (T056)

**Internal Dependencies**:

```
T063 (AuthZ) → T059, T060, T061, T062 (Admin endpoints)
T055 → T056 → T057 → T058 (User endpoints chain)
T059 → T060 → T061 → T062 (Admin endpoints chain)
T055-T062 → T064 → T065 → T066 (Quality chain)
```

### Risks & Mitigations

**High Risk**:

- **Authorization bypass** (T063): RolesGuard 모든 admin 엔드포인트에 일관되게 적용, unit tests 필수
- **Soft-delete 세션 누락** (T057): 세션 무효화 로직 integration test 필수
- **자기 자신 수정** (T061, T062): adminId !== userId 검증 로직 필수

**Medium Risk**:

- **Audit log 누락** (T064): 모든 작업에 Audit log 호출 체크리스트 작성
- **CASCADE 삭제 실패** (T062): Prisma onDelete 설정 확인, integration test 필수

**Mitigation**:

- Code review: Security-critical 코드 (T063, T061, T062) 우선 리뷰
- Integration tests: 46 tests로 모든 엣지 케이스 커버
- OpenAPI validation: contracts/\*.yaml과 실제 구현 일치 확인 (T066)

---

## Work Package WP07: OAuth Integration (Google & GitHub) (Priority: P3) ✅

**Goal**: Implement OAuth 2.0 login with Google and GitHub using Passport.js strategies, link existing accounts.
**Independent Test**: User clicks "Login with Google" → redirected → authenticated → logged into ReadZone. Same for GitHub.
**Prompt**: `kitty-specs/001-feature/tasks/done/WP07-oauth-integration.md`
**Status**: ✅ Approved (2025-11-08, shell_pid=36480)

### Included Subtasks

- [x] T064 Install OAuth dependencies (passport-google-oauth20, passport-github2)
- [x] T065 Configure OAuth credentials in .env.example and config module
- [x] T066 Create GoogleStrategy (packages/backend/src/modules/auth/strategies/google.strategy.ts)
- [x] T067 Create GitHubStrategy (packages/backend/src/modules/auth/strategies/github.strategy.ts)
- [x] T068 Implement OAuthService (packages/backend/src/modules/auth/services/oauth.service.ts) for user creation/linking logic
- [x] T069 Implement GET /api/v1/auth/oauth/google (initiate OAuth flow with AuthGuard('google'))
- [x] T070 Implement GET /api/v1/auth/oauth/google/callback (handle Google callback, create session, return JWT)
- [x] T071 Implement GET /api/v1/auth/oauth/github (initiate OAuth flow with AuthGuard('github'))
- [x] T072 Implement GET /api/v1/auth/oauth/github/callback (handle GitHub callback, create session, return JWT)
- [x] T073 Handle case: OAuth email matches existing user → link OAuthConnection
- [x] T074 Handle case: OAuth email is new → create User + OAuthConnection, mark emailVerified=true
- [x] T075 Add audit logging for OAuth connection events (success, failure, account linking)

### Implementation Notes

**NestJS + Passport.js Integration**:

- Use @nestjs/passport with passport-google-oauth20 and passport-github2 strategies
- Strategies extend PassportStrategy and implement validate() method
- AuthGuard('google'), AuthGuard('github') for route protection
- State parameter and PKCE handled by Passport strategies (per research.md)

**OAuth Profile Extraction**:

- Google: profile.emails[0].value, profile.displayName, profile.photos[0].value
- GitHub: profile.emails[0].value, profile.displayName, profile.photos[0].value

**Account Linking Logic**:

- If OAuth email matches existing user → link OAuthConnection, preserve existing password
- If OAuth email is new → create User + OAuthConnection, no password (OAuth-only), emailVerified=true
- If user already has OAuth provider → update existing OAuthConnection (provider_user_id)

**Security**:

- Redirect URIs: whitelist in environment config (e.g., http://localhost:3000/auth/google/callback)
- State parameter: CSRF protection (auto-handled by Passport)
- Session creation: generate JWT token after successful OAuth validation

### Parallel Opportunities

- T066, T067 (Google, GitHub strategies) can proceed in parallel after T064, T065
- T069, T070 (Google endpoints) and T071, T072 (GitHub endpoints) can proceed in parallel after T068
- T073, T074 (account linking logic) can be implemented within OAuthService (T068)

### Dependencies

- Depends on WP04 (JWT authentication, session management).
- Depends on WP06 (User management, OAuthConnection model).

### Risks & Mitigations

- OAuth provider downtime → show error message, fallback to email/password login
- Account linking conflicts → check existing OAuthConnection before creating, update if exists
- Email verification bypass → OAuth users automatically get emailVerified=true (trust provider)
- Redirect URI mismatch → validate redirect URIs in config, return 400 for invalid URIs

---

## Work Package WP08: Rate Limiting & Security Hardening (Priority: P3) ✅

**Goal**: Implement rate limiting, security headers, CSRF protection, and audit logging.
**Independent Test**: Exceed rate limits → receive 429 errors, security headers present, CSRF token required for state-changing operations.
**Prompt**: `kitty-specs/001-feature/tasks/done/WP08-rate-limiting-security.md`
**Status**: ✅ Approved (2025-11-08, shell_pid=67475)

### Included Subtasks

- [x] T076 Register @fastify/rate-limit plugin with Redis store
- [x] T077 Configure global rate limits (100 req/min/IP for anonymous, 1000 req/min for authenticated)
- [x] T078 Configure endpoint-specific limits (login: 5/5min, password reset: 3/hour, register: 3/hour)
- [x] T079 Add CSRF protection for state-changing endpoints (POST, PATCH, DELETE) using @fastify/csrf-protection
- [x] T080 Enhance security headers (@fastify/helmet already registered in WP03, fine-tune CSP)
- [x] T081 Implement audit log query endpoint GET /api/v1/admin/audit-logs (admin only, paginated)
- [x] T082 Add IP address and User-Agent capture to all audit logs
- [x] T083 Document security measures in README.md (rate limits, HTTPS requirement, password policy)

### Implementation Notes

- Rate limit storage: Redis (shared with sessions)
- CSRF tokens: stored in session, validated on state-changing requests
- Audit log retention: 90 days active, archive to backup (defer backup automation)
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options

### Parallel Opportunities

- T076, T077, T078 (rate limiting) can proceed together
- T079, T080 (CSRF, headers) can proceed in parallel

### Dependencies

- Depends on WP04, WP06.

### Risks & Mitigations

- False positives on rate limits → adjust thresholds based on monitoring
- CSRF bypass → enforce HTTPS, secure cookie flags

---

## Work Package WP09: Multi-Factor Authentication (MFA/TOTP) (Priority: P4) ✅

**Goal**: Implement TOTP-based 2FA with QR code generation and backup codes.
**Independent Test**: User enables MFA → scans QR → enters TOTP → MFA active. Login requires TOTP. Backup codes work.
**Prompt**: `kitty-specs/001-feature/tasks/done/WP09-multi-factor-authentication.md`
**Status**: ✅ Completed and reviewed on 2025-11-08

### Included Subtasks

- [x] T084 Install speakeasy and qrcode libraries (packages/backend)
- [x] T085 Implement POST /api/v1/users/me/mfa/enable (generate TOTP secret, return QR code data URI)
- [x] T086 Implement POST /api/v1/users/me/mfa/verify (verify TOTP code, enable MFA)
- [x] T087 Implement POST /api/v1/users/me/mfa/disable (disable MFA after password confirmation)
- [x] T088 Implement MFA challenge in login flow (POST /api/v1/auth/login returns mfa_required, then POST /api/v1/auth/mfa/verify)
- [x] T089 Generate 10 backup codes (bcrypt hashed, stored in MFASettings)
- [x] T090 Implement backup code verification in MFA challenge
- [x] T091 Implement GET /api/v1/users/me/mfa/backup-codes (regenerate backup codes, admin action)
- [x] T092 Add audit logging for MFA enable/disable, TOTP verification attempts

### Implementation Notes

- TOTP: 6-digit code, 30-second window, ±1 window tolerance (90 seconds total)
- QR code: data URI format (data:image/png;base64,...)
- Backup codes: 16-character alphanumeric, bcrypt hashed before storage
- MFA enforcement: optional for users, admin can enforce globally (defer global enforcement)

### Parallel Opportunities

- T085, T086, T087 (MFA endpoints) can proceed in parallel after T084
- T089, T090 (backup codes) can proceed in parallel

### Dependencies

- Depends on WP04, WP06.

### Risks & Mitigations

- Clock skew → use time window tolerance (±30s)
- Backup code leakage → bcrypt hashing, secure display (show once)
- Lost TOTP device → backup codes, admin recovery process

---

## Work Package WP10: Session Management & Active Sessions (Priority: P5)

**Goal**: Implement session listing, individual session logout, and concurrent session limits.
**Independent Test**: User views active sessions (devices, IPs, last activity), logs out specific session, limit enforced (10 sessions max).
**Prompt**: `kitty-specs/001-feature/tasks/done/WP10-session-management.md`
**Status**: ✅ Completed and reviewed on 2025-11-09

### Included Subtasks

- [x] T093 Implement GET /api/v1/sessions (list current user's active sessions)
- [x] T094 Enhance session creation to capture device info (User-Agent parsing) and IP address
- [x] T095 Implement DELETE /api/v1/sessions/:id (logout specific session)
- [x] T096 Implement DELETE /api/v1/sessions (logout all sessions except current)
- [x] T097 Enforce concurrent session limit (10 sessions per user, delete oldest if exceeded)
- [x] T098 Update session last_activity timestamp on each authenticated request
- [x] T099 Add audit logging for session creation, deletion

### Implementation Notes

- Session storage: Redis with TTL (24 hours default, 30 days for "remember me")
- Device info: parse User-Agent for browser, OS (use ua-parser-js or similar)
- Session listing: query Redis by user_id prefix
- Concurrency limit: check session count on login, delete oldest

### Parallel Opportunities

- T093, T094, T095, T096 (session endpoints) can proceed in parallel

### Dependencies

- Depends on WP04.

### Risks & Mitigations

- Session enumeration → require authentication, show only user's own sessions
- Redis memory pressure → monitor usage, adjust TTLs

---

## Work Package WP11: Frontend Authentication UI (Priority: P1) 🎯 MVP ✅

**Goal**: Implement React authentication pages (login, register, email verification, password reset, profile).
**Independent Test**: User can navigate to login/register, submit forms, see errors, access protected dashboard.
**Prompt**: `kitty-specs/001-feature/tasks/done/WP11-frontend-authentication-ui.md`
**Status**: ✅ Approved (2025-11-09, shell_pid=24924)

### Included Subtasks

- [x] T100 Setup Vite React app (packages/frontend) with routing (React Router)
- [x] T101 Create API client utility (packages/frontend/src/lib/api-client.ts) with Axios, interceptors for JWT
- [x] T102 Create AuthContext (packages/frontend/src/lib/auth-context.tsx) for global auth state (user, token, login, logout)
- [x] T103 [P] Create LoginPage (packages/frontend/src/features/auth/pages/LoginPage.tsx)
- [x] T104 [P] Create RegisterPage (packages/frontend/src/features/auth/pages/RegisterPage.tsx)
- [x] T105 [P] Create ForgotPasswordPage (packages/frontend/src/features/auth/pages/ForgotPasswordPage.tsx)
- [x] T106 [P] Create ResetPasswordPage (packages/frontend/src/features/auth/pages/ResetPasswordPage.tsx)
- [x] T107 [P] Create EmailVerificationBanner component (show on dashboard if email unverified)
- [x] T108 Create ProtectedRoute component (redirect to login if not authenticated)
- [x] T109 Create DashboardPage (packages/frontend/src/pages/DashboardPage.tsx) as authenticated home
- [x] T110 Implement form validation (Zod schemas matching backend)
- [x] T111 Add error handling and user feedback (toast notifications, inline errors)
- [x] T112 Style forms with CSS or UI library (Tailwind CSS, shadcn/ui, or custom)

### Implementation Notes

- React Router v6 for routing
- Axios for HTTP client, interceptors for JWT token injection
- AuthContext with React.useContext for global state
- Form validation: Zod schemas (share types from backend via packages/shared if possible)
- Accessibility: WCAG 2.1 AA (labels, keyboard navigation, ARIA attributes)

### Parallel Opportunities

- T103, T104, T105, T106 (pages) can proceed in parallel after T100, T101, T102
- T110, T111, T112 (validation, errors, styling) can proceed in parallel

### Dependencies

- Depends on WP04, WP05.

### Risks & Mitigations

- XSS attacks → sanitize user inputs, use React's built-in escaping
- Token storage → use httpOnly cookies or secure localStorage

---

## Work Package WP12: Frontend User Profile & Sessions (Priority: P2)

**Goal**: Implement React UI for user profile management and session management.
**Independent Test**: User can view/edit profile, view active sessions, logout specific sessions.
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP12-frontend-user-profile-sessions.md`

### Included Subtasks

- [ ] T113 Create ProfilePage (packages/frontend/src/features/user/pages/ProfilePage.tsx)
- [ ] T114 Create EditProfileForm component (name, profile_image upload)
- [ ] T115 Implement profile image upload (base64 or FormData to backend)
- [ ] T116 Create ActiveSessionsPage (packages/frontend/src/features/user/pages/ActiveSessionsPage.tsx)
- [ ] T117 Create SessionListItem component (display device, IP, last activity)
- [ ] T118 Implement session logout action (delete specific session)
- [ ] T119 Create AccountSettingsPage (delete account, MFA toggle)
- [ ] T120 Add confirmation dialogs (account deletion, session logout)
- [ ] T121 Style profile and settings pages

### Implementation Notes

- Profile image upload: consider file size limits, image formats (JPEG, PNG)
- Session list: show current session highlighted
- Confirmation dialogs: use modal or native confirm (prefer accessible modal)

### Parallel Opportunities

- T113, T114, T115 (profile) and T116, T117, T118 (sessions) can proceed in parallel

### Dependencies

- Depends on WP06, WP10, WP11.

### Risks & Mitigations

- Large image uploads → enforce size limits (2MB), validate MIME types
- Accidental account deletion → require password confirmation

---

## Work Package WP13: Frontend OAuth & MFA UI (Priority: P3)

**Goal**: Implement React UI for OAuth login buttons and MFA setup/verification.
**Independent Test**: User clicks "Login with Google/GitHub" → OAuth flow → logged in. User enables MFA → scans QR → enters code → MFA active.
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP13-frontend-oauth-mfa-ui.md`

### Included Subtasks

- [ ] T122 Add OAuth login buttons to LoginPage (Google, GitHub)
- [ ] T123 Implement OAuth callback handling (parse URL params, exchange for JWT)
- [ ] T124 Create MFASetupPage (packages/frontend/src/features/user/pages/MFASetupPage.tsx)
- [ ] T125 Display QR code (render data URI from backend)
- [ ] T126 Create MFAVerifyForm component (6-digit TOTP input)
- [ ] T127 Add MFA challenge to login flow (show TOTP input if mfa_required)
- [ ] T128 Create BackupCodesDisplay component (show backup codes once after MFA enable)
- [ ] T129 Add MFA disable option in AccountSettingsPage
- [ ] T130 Style OAuth buttons and MFA UI

### Implementation Notes

- OAuth: open OAuth URL in popup or redirect (redirect simpler, better UX)
- QR code: render `<img src={qrDataUri} />` from backend response
- MFA TOTP input: 6-digit numeric, auto-focus, keyboard-friendly
- Backup codes: display once, warn user to save them

### Parallel Opportunities

- T122, T123 (OAuth) and T124, T125, T126, T127, T128, T129 (MFA) can proceed in parallel

### Dependencies

- Depends on WP07, WP09, WP11.

### Risks & Mitigations

- OAuth popup blocking → detect and show instructions to allow popups
- QR code not scanning → provide manual TOTP secret entry option

---

## Dependency & Execution Summary

- **Sequence**:
  - Phase 0 Setup: WP01 → WP02 → WP03
  - Phase 1 Core Auth: WP04 → WP05 → WP11 (MVP: basic auth + frontend)
  - Phase 2 User Management: WP06 → WP12
  - Phase 3 Advanced Features: WP07, WP08, WP09, WP10, WP13 (can proceed in parallel after Phase 1)

- **Parallelization**:
  - After WP03: WP04 (auth core) can start
  - After WP04: WP05, WP06, WP11 can start in parallel
  - After WP05, WP06: WP07, WP08, WP09, WP10 can start in parallel
  - After WP11: WP12, WP13 can start (depending on backend readiness)

- **MVP Scope** (Minimal Release): WP01, WP02, WP03, WP04, WP05, WP11
  - Basic authentication (register, login, logout)
  - Email verification and password reset
  - Minimal frontend (login, register, dashboard)

---

## Subtask Index (Reference)

| Subtask ID | Summary                             | Work Package | Priority | Parallel? |
| ---------- | ----------------------------------- | ------------ | -------- | --------- |
| T001       | Create monorepo structure           | WP01         | P0       | No        |
| T002       | Initialize root package.json        | WP01         | P0       | No        |
| T003       | Setup backend package.json          | WP01         | P0       | Yes       |
| T004       | Setup frontend package.json         | WP01         | P0       | Yes       |
| T005       | Setup shared package.json           | WP01         | P0       | Yes       |
| T006       | Configure TypeScript strict mode    | WP01         | P0       | No        |
| T007       | Setup ESLint and Prettier           | WP01         | P0       | Yes       |
| T008       | Configure Husky + lint-staged       | WP01         | P0       | Yes       |
| T009       | Create Docker Compose               | WP01         | P0       | No        |
| T010       | Create .env.example                 | WP01         | P0       | No        |
| T011       | Document quickstart                 | WP01         | P0       | No        |
| T012       | Create schema.prisma                | WP02         | P0       | No        |
| T013       | Define User model                   | WP02         | P0       | Yes       |
| T014       | Define Session model                | WP02         | P0       | Yes       |
| T015       | Define OAuthConnection model        | WP02         | P0       | Yes       |
| T016       | Define MFASettings model            | WP02         | P0       | Yes       |
| T017       | Define AuditLog model               | WP02         | P0       | Yes       |
| T018       | Define EmailVerificationToken model | WP02         | P0       | Yes       |
| T019       | Define PasswordResetToken model     | WP02         | P0       | Yes       |
| T020       | Add indexes                         | WP02         | P0       | No        |
| T021       | Create initial migration            | WP02         | P0       | No        |
| T022       | Create seed.ts script               | WP02         | P0       | No        |
| T023       | Document schema decisions           | WP02         | P0       | No        |
| T024       | Create server.ts                    | WP03         | P0       | No        |
| T025       | Create app.ts                       | WP03         | P0       | No        |
| T026       | Implement config/index.ts           | WP03         | P0       | No        |
| T027       | Setup Pino logging                  | WP03         | P0       | Yes       |
| T028       | Implement error handler             | WP03         | P0       | Yes       |
| T029       | Create response helpers             | WP03         | P0       | Yes       |
| T030       | Register @fastify/cors              | WP03         | P0       | No        |
| T031       | Register @fastify/helmet            | WP03         | P0       | No        |
| T032       | Create health endpoint              | WP03         | P0       | No        |
| T033       | Configure Prisma client             | WP03         | P0       | No        |
| T034       | Configure Redis client              | WP03         | P0       | No        |
| T035       | Register @fastify/jwt               | WP04         | P1       | No        |
| T036       | Register @fastify/session           | WP04         | P1       | No        |
| T037       | Implement password service          | WP04         | P1       | Yes       |
| T038       | Create Zod schemas                  | WP04         | P1       | Yes       |
| T039       | Implement register endpoint         | WP04         | P1       | Yes       |
| T040       | Implement login endpoint            | WP04         | P1       | Yes       |
| T041       | Implement logout endpoint           | WP04         | P1       | Yes       |
| T042       | Create JWT auth middleware          | WP04         | P1       | No        |
| T043       | Implement session service           | WP04         | P1       | No        |
| T044       | Wire auth routes                    | WP04         | P1       | No        |
| T045       | Add audit logging                   | WP04         | P1       | No        |
| T046       | Setup email service                 | WP05         | P1       | Yes       |
| T047       | Create token utility                | WP05         | P1       | Yes       |
| T048       | Implement verify-email send         | WP05         | P1       | Yes       |
| T049       | Implement verify-email confirm      | WP05         | P1       | Yes       |
| T050       | Implement password-reset request    | WP05         | P1       | Yes       |
| T051       | Implement password-reset confirm    | WP05         | P1       | Yes       |
| T052       | Implement token expiration          | WP05         | P1       | No        |
| T053       | Add rate limiting (placeholder)     | WP05         | P1       | No        |
| T054       | Add audit logging                   | WP05         | P1       | No        |
| T055       | Implement GET /users/me             | WP06         | P2       | Yes       |
| T056       | Implement PATCH /users/me           | WP06         | P2       | Yes       |
| T057       | Implement DELETE /users/me          | WP06         | P2       | Yes       |
| T058       | Implement hard-delete cron          | WP06         | P2       | No        |
| T059       | Implement GET /users                | WP06         | P2       | Yes       |
| T060       | Implement GET /users/:id            | WP06         | P2       | Yes       |
| T061       | Implement PATCH /users/:id/role     | WP06         | P2       | Yes       |
| T062       | Add authorization middleware        | WP06         | P2       | No        |
| T063       | Add audit logging                   | WP06         | P2       | No        |
| T064       | Install OAuth dependencies          | WP07         | P3       | No        |
| T065       | Configure OAuth credentials         | WP07         | P3       | No        |
| T066       | Create GoogleStrategy               | WP07         | P3       | Yes       |
| T067       | Create GitHubStrategy               | WP07         | P3       | Yes       |
| T068       | Implement OAuthService              | WP07         | P3       | No        |
| T069       | Implement Google OAuth initiate     | WP07         | P3       | Yes       |
| T070       | Implement Google OAuth callback     | WP07         | P3       | Yes       |
| T071       | Implement GitHub OAuth initiate     | WP07         | P3       | Yes       |
| T072       | Implement GitHub OAuth callback     | WP07         | P3       | Yes       |
| T073       | Handle OAuth email match            | WP07         | P3       | No        |
| T074       | Handle OAuth new user               | WP07         | P3       | No        |
| T075       | Add OAuth audit logging             | WP07         | P3       | No        |
| T076       | Register rate-limit plugin          | WP08         | P3       | No        |
| T077       | Configure global rate limits        | WP08         | P3       | No        |
| T078       | Configure endpoint limits           | WP08         | P3       | No        |
| T079       | Add CSRF protection                 | WP08         | P3       | Yes       |
| T080       | Enhance security headers            | WP08         | P3       | Yes       |
| T081       | Implement audit log endpoint        | WP08         | P3       | No        |
| T082       | Add IP/User-Agent capture           | WP08         | P3       | No        |
| T083       | Document security measures          | WP08         | P3       | No        |
| T084       | Install MFA libraries               | WP09         | P4       | No        |
| T085       | Implement MFA enable endpoint       | WP09         | P4       | Yes       |
| T086       | Implement MFA verify endpoint       | WP09         | P4       | Yes       |
| T087       | Implement MFA disable endpoint      | WP09         | P4       | Yes       |
| T088       | Implement MFA login challenge       | WP09         | P4       | No        |
| T089       | Generate backup codes               | WP09         | P4       | Yes       |
| T090       | Implement backup code verify        | WP09         | P4       | Yes       |
| T091       | Implement backup code regenerate    | WP09         | P4       | No        |
| T092       | Add audit logging                   | WP09         | P4       | No        |
| T093       | Implement GET /sessions             | WP10         | P5       | Yes       |
| T094       | Enhance session device info         | WP10         | P5       | No        |
| T095       | Implement DELETE /sessions/:id      | WP10         | P5       | Yes       |
| T096       | Implement DELETE /sessions          | WP10         | P5       | Yes       |
| T097       | Enforce session limit               | WP10         | P5       | No        |
| T098       | Update session last_activity        | WP10         | P5       | No        |
| T099       | Add audit logging                   | WP10         | P5       | No        |
| T100       | Setup Vite React app                | WP11         | P1       | No        |
| T101       | Create API client                   | WP11         | P1       | No        |
| T102       | Create AuthContext                  | WP11         | P1       | No        |
| T103       | Create LoginPage                    | WP11         | P1       | Yes       |
| T104       | Create RegisterPage                 | WP11         | P1       | Yes       |
| T105       | Create ForgotPasswordPage           | WP11         | P1       | Yes       |
| T106       | Create ResetPasswordPage            | WP11         | P1       | Yes       |
| T107       | Create EmailVerificationBanner      | WP11         | P1       | Yes       |
| T108       | Create ProtectedRoute               | WP11         | P1       | No        |
| T109       | Create DashboardPage                | WP11         | P1       | No        |
| T110       | Implement form validation           | WP11         | P1       | Yes       |
| T111       | Add error handling                  | WP11         | P1       | Yes       |
| T112       | Style forms                         | WP11         | P1       | Yes       |
| T113       | Create ProfilePage                  | WP12         | P2       | Yes       |
| T114       | Create EditProfileForm              | WP12         | P2       | Yes       |
| T115       | Implement profile image upload      | WP12         | P2       | Yes       |
| T116       | Create ActiveSessionsPage           | WP12         | P2       | Yes       |
| T117       | Create SessionListItem              | WP12         | P2       | Yes       |
| T118       | Implement session logout            | WP12         | P2       | Yes       |
| T119       | Create AccountSettingsPage          | WP12         | P2       | No        |
| T120       | Add confirmation dialogs            | WP12         | P2       | No        |
| T121       | Style pages                         | WP12         | P2       | No        |
| T122       | Add OAuth buttons                   | WP13         | P3       | Yes       |
| T123       | Handle OAuth callback               | WP13         | P3       | Yes       |
| T124       | Create MFASetupPage                 | WP13         | P3       | Yes       |
| T125       | Display QR code                     | WP13         | P3       | Yes       |
| T126       | Create MFAVerifyForm                | WP13         | P3       | Yes       |
| T127       | Add MFA login challenge             | WP13         | P3       | No        |
| T128       | Create BackupCodesDisplay           | WP13         | P3       | No        |
| T129       | Add MFA disable option              | WP13         | P3       | No        |
| T130       | Style OAuth/MFA UI                  | WP13         | P3       | No        |

---

> Tasks generated from design documents in `/kitty-specs/001-feature/`. MVP scope: WP01-WP05, WP11 (basic auth + frontend). Full feature: WP01-WP13 (OAuth, MFA, sessions, admin features).
