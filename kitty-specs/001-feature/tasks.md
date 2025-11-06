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

## Work Package WP01: Setup & Monorepo Infrastructure (Priority: P0)

**Goal**: Establish monorepo skeleton, tooling, and development environment.
**Independent Test**: Project bootstraps locally with `pnpm install && pnpm dev`, linting and formatting hooks work.
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP01-setup-monorepo-infrastructure.md`

### Included Subtasks
- [ ] T001 Create monorepo structure (packages/backend, packages/frontend, packages/shared)
- [ ] T002 Initialize root package.json with pnpm workspaces configuration
- [ ] T003 [P] Setup backend package.json (Fastify, TypeScript, Prisma, dependencies per plan.md)
- [ ] T004 [P] Setup frontend package.json (React, Vite, TypeScript, dependencies per plan.md)
- [ ] T005 [P] Setup shared package.json (TypeScript, type definitions)
- [ ] T006 Configure TypeScript strict mode (tsconfig.json) for all packages
- [ ] T007 [P] Setup ESLint (Airbnb TypeScript config) and Prettier
- [ ] T008 [P] Configure Husky + lint-staged for pre-commit hooks
- [ ] T009 Create Docker Compose (PostgreSQL 16, Redis 7) per research.md
- [ ] T010 Create .env.example with all required environment variables
- [ ] T011 Document quickstart in README.md (pnpm install, docker-compose up, migrations)

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

## Work Package WP02: Database Schema & Prisma Setup (Priority: P0)

**Goal**: Define and migrate PostgreSQL schema for all entities (User, Session, OAuth, MFA, AuditLog).
**Independent Test**: `pnpm prisma migrate dev` succeeds, Prisma Client generates TypeScript types, seed data loads.
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP02-database-schema-prisma.md`

### Included Subtasks
- [ ] T012 Create packages/backend/prisma/schema.prisma with all models per spec.md Key Entities
- [ ] T013 Define User model (id, email, password_hash, name, profile_image, role, email_verified, mfa_enabled, soft_delete, timestamps)
- [ ] T014 Define Session model (id, user_id, token, expires_at, device_info, ip_address, created_at)
- [ ] T015 Define OAuthConnection model (id, user_id, provider, provider_user_id, created_at)
- [ ] T016 Define MFASettings model (id, user_id, totp_secret, backup_codes, enabled, created_at)
- [ ] T017 Define AuditLog model (id, user_id, event_type, details_jsonb, ip_address, user_agent, success, created_at)
- [ ] T018 Define EmailVerificationToken model (id, user_id, token, expires_at, used, created_at)
- [ ] T019 Define PasswordResetToken model (id, user_id, token, expires_at, used, created_at)
- [ ] T020 Add indexes (email unique, session user_id + expires_at, audit_log user_id + created_at)
- [ ] T021 Create initial migration (`pnpm prisma migrate dev --name init`)
- [ ] T022 Create seed.ts script (test users with different roles)
- [ ] T023 Document schema decisions in data-model.md (if not already created)

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

## Work Package WP03: Backend Core Infrastructure (Priority: P0)

**Goal**: Establish Fastify app structure, config management, error handling, logging, and middleware.
**Independent Test**: Fastify server starts, health endpoint returns 200, structured logging works, errors return standard format.
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP03-backend-core-infrastructure.md`

### Included Subtasks
- [ ] T024 Create packages/backend/src/server.ts (Fastify server entry point)
- [ ] T025 Create packages/backend/src/app.ts (Fastify app initialization with plugins)
- [ ] T026 Implement config/index.ts (Zod-validated environment variables per research.md)
- [ ] T027 [P] Setup Pino structured logging (packages/backend/src/common/utils/logger.ts)
- [ ] T028 [P] Implement standard error handler (packages/backend/src/common/middleware/error-handler.ts)
- [ ] T029 [P] Create standard response format helpers (packages/backend/src/common/utils/response.ts)
- [ ] T030 Register @fastify/cors plugin with secure defaults
- [ ] T031 Register @fastify/helmet plugin for security headers
- [ ] T032 Create health endpoint (GET /api/v1/health) with database/redis checks
- [ ] T033 Configure Prisma client (packages/backend/src/common/utils/prisma.ts) with connection pooling
- [ ] T034 Configure Redis client (packages/backend/src/common/utils/redis.ts) with retry logic

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

## Work Package WP04: Authentication Core (JWT + Redis Session) (Priority: P1) 🎯 MVP

**Goal**: Implement hybrid authentication strategy (JWT + Redis session) with register/login/logout.
**Independent Test**: User can register, login (receive JWT), access protected route, logout (session invalidated).
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP04-authentication-core.md`

### Included Subtasks
- [ ] T035 Register @fastify/jwt plugin (packages/backend/src/app.ts) with secret from config
- [ ] T036 Register @fastify/session plugin with Redis store
- [ ] T037 Implement password hashing service (packages/backend/src/modules/auth/services/password.service.ts) using argon2id per research.md
- [ ] T038 Create Zod schemas for auth endpoints (packages/backend/src/modules/auth/schemas/auth.schema.ts)
- [ ] T039 Implement POST /api/v1/auth/register (controller: packages/backend/src/modules/auth/controllers/register.controller.ts)
- [ ] T040 Implement POST /api/v1/auth/login (controller: packages/backend/src/modules/auth/controllers/login.controller.ts)
- [ ] T041 Implement POST /api/v1/auth/logout (controller: packages/backend/src/modules/auth/controllers/logout.controller.ts)
- [ ] T042 Create JWT authentication middleware (packages/backend/src/common/middleware/auth.middleware.ts) that verifies JWT + checks Redis session
- [ ] T043 Implement session service (packages/backend/src/modules/sessions/services/session.service.ts) for create/validate/delete in Redis
- [ ] T044 Wire auth routes (packages/backend/src/modules/auth/routes.ts) to Fastify app
- [ ] T045 Add audit logging to auth events (login success/fail, register, logout)

### Implementation Notes
- Hybrid workflow: JWT payload contains session_id, verify JWT → check Redis session exists
- argon2id config: memory=64MB, iterations=3, parallelism=4 (per research.md)
- Session TTL: 24 hours default, extendable to 30 days (remember me)
- Rate limiting: 5 attempts/5min per IP (defer to WP08)

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
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP05-email-verification-password-reset.md`

### Included Subtasks
- [ ] T046 Setup email service abstraction (packages/backend/src/common/services/email.service.ts) with mock implementation (console.log for dev)
- [ ] T047 Create token generation utility (packages/backend/src/common/utils/token.ts) with crypto.randomBytes
- [ ] T048 Implement POST /api/v1/auth/verify-email/send (send verification email with token)
- [ ] T049 Implement POST /api/v1/auth/verify-email/confirm (verify token, mark email_verified=true)
- [ ] T050 Implement POST /api/v1/auth/password-reset/request (send reset email with token)
- [ ] T051 Implement POST /api/v1/auth/password-reset/confirm (verify token, update password)
- [ ] T052 Implement token expiration logic (24 hours for verification, 1 hour for password reset)
- [ ] T053 Add rate limiting to email endpoints (3 sends/5min per email, defer actual rate limit to WP08)
- [ ] T054 Add audit logging for email verification and password reset events

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

**Goal**: Implement user CRUD, profile management, and account deletion with 30-day soft-delete.
**Independent Test**: User can view/update profile (name, profile_image), delete account (soft-delete), admin can list/manage users.
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP06-user-management-profiles.md`

### Included Subtasks
- [ ] T055 Implement GET /api/v1/users/me (get current user profile)
- [ ] T056 Implement PATCH /api/v1/users/me (update name, profile_image)
- [ ] T057 Implement DELETE /api/v1/users/me (soft-delete with 30-day grace period)
- [ ] T058 Implement cron job or scheduled task for hard-delete after 30 days (pseudocode/comment for now)
- [ ] T059 Implement GET /api/v1/users (admin only: list users with pagination, cursor-based)
- [ ] T060 Implement GET /api/v1/users/:id (admin only: view user details)
- [ ] T061 Implement PATCH /api/v1/users/:id/role (admin only: change user role)
- [ ] T062 Add authorization middleware (packages/backend/src/common/middleware/authorize.middleware.ts) for role checks
- [ ] T063 Add audit logging for profile changes, role changes, account deletions

### Implementation Notes
- Soft-delete: set deleted_at timestamp, hide from queries
- GDPR compliance: document 30-day retention, hard-delete process
- Pagination: use cursor-based (Prisma cursor, take, skip)
- Authorization: check user.role in middleware (USER, MODERATOR, ADMIN, SUPERADMIN)

### Parallel Opportunities
- T055, T056, T057 (user endpoints) can proceed in parallel
- T059, T060, T061 (admin endpoints) can proceed in parallel

### Dependencies
- Depends on WP04.

### Risks & Mitigations
- Authorization bypass → enforce role checks in middleware
- Soft-delete confusion → clear UI warnings, admin confirmation

---

## Work Package WP07: OAuth Integration (Google & GitHub) (Priority: P3)

**Goal**: Implement OAuth 2.0 login with Google and GitHub, link existing accounts.
**Independent Test**: User clicks "Login with Google" → redirected → authenticated → logged into ReadZone. Same for GitHub.
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP07-oauth-integration.md`

### Included Subtasks
- [ ] T064 Register @fastify/oauth2 plugin for Google (packages/backend/src/app.ts)
- [ ] T065 Register @fastify/oauth2 plugin for GitHub (packages/backend/src/app.ts)
- [ ] T066 Configure OAuth redirect URIs in .env.example and config
- [ ] T067 Implement GET /api/v1/auth/oauth/google (initiate OAuth flow)
- [ ] T068 Implement GET /api/v1/auth/oauth/google/callback (handle Google callback, create/link user)
- [ ] T069 Implement GET /api/v1/auth/oauth/github (initiate OAuth flow)
- [ ] T070 Implement GET /api/v1/auth/oauth/github/callback (handle GitHub callback, create/link user)
- [ ] T071 Implement OAuth service (packages/backend/src/modules/auth/services/oauth.service.ts) for user creation/linking logic
- [ ] T072 Handle case: OAuth email matches existing user → link OAuthConnection
- [ ] T073 Handle case: OAuth email is new → create User + OAuthConnection
- [ ] T074 Add audit logging for OAuth connections

### Implementation Notes
- PKCE enabled by @fastify/oauth2 (per research.md)
- State parameter for CSRF protection (auto-handled by plugin)
- OAuth profile: extract email, name, profile_image from provider
- If email unverified in local DB, mark as verified after successful OAuth

### Parallel Opportunities
- T067, T068 (Google) and T069, T070 (GitHub) can proceed in parallel
- T071 (OAuth service) should be completed before controllers

### Dependencies
- Depends on WP04, WP06.

### Risks & Mitigations
- OAuth provider downtime → show error message, fallback to email/password
- Account linking conflicts → require user confirmation before linking

---

## Work Package WP08: Rate Limiting & Security Hardening (Priority: P3)

**Goal**: Implement rate limiting, security headers, CSRF protection, and audit logging.
**Independent Test**: Exceed rate limits → receive 429 errors, security headers present, CSRF token required for state-changing operations.
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP08-rate-limiting-security.md`

### Included Subtasks
- [ ] T075 Register @fastify/rate-limit plugin with Redis store
- [ ] T076 Configure global rate limits (100 req/min/IP for anonymous, 1000 req/min for authenticated)
- [ ] T077 Configure endpoint-specific limits (login: 5/5min, password reset: 3/hour, register: 3/hour)
- [ ] T078 Add CSRF protection for state-changing endpoints (POST, PATCH, DELETE) using @fastify/csrf-protection
- [ ] T079 Enhance security headers (@fastify/helmet already registered in WP03, fine-tune CSP)
- [ ] T080 Implement audit log query endpoint GET /api/v1/admin/audit-logs (admin only, paginated)
- [ ] T081 Add IP address and User-Agent capture to all audit logs
- [ ] T082 Document security measures in README.md (rate limits, HTTPS requirement, password policy)

### Implementation Notes
- Rate limit storage: Redis (shared with sessions)
- CSRF tokens: stored in session, validated on state-changing requests
- Audit log retention: 90 days active, archive to backup (defer backup automation)
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options

### Parallel Opportunities
- T075, T076, T077 (rate limiting) can proceed together
- T078, T079 (CSRF, headers) can proceed in parallel

### Dependencies
- Depends on WP04, WP06.

### Risks & Mitigations
- False positives on rate limits → adjust thresholds based on monitoring
- CSRF bypass → enforce HTTPS, secure cookie flags

---

## Work Package WP09: Multi-Factor Authentication (MFA/TOTP) (Priority: P4)

**Goal**: Implement TOTP-based 2FA with QR code generation and backup codes.
**Independent Test**: User enables MFA → scans QR → enters TOTP → MFA active. Login requires TOTP. Backup codes work.
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP09-multi-factor-authentication.md`

### Included Subtasks
- [ ] T083 Install speakeasy and qrcode libraries (packages/backend)
- [ ] T084 Implement POST /api/v1/users/me/mfa/enable (generate TOTP secret, return QR code data URI)
- [ ] T085 Implement POST /api/v1/users/me/mfa/verify (verify TOTP code, enable MFA)
- [ ] T086 Implement POST /api/v1/users/me/mfa/disable (disable MFA after password confirmation)
- [ ] T087 Implement MFA challenge in login flow (POST /api/v1/auth/login returns mfa_required, then POST /api/v1/auth/mfa/verify)
- [ ] T088 Generate 10 backup codes (bcrypt hashed, stored in MFASettings)
- [ ] T089 Implement backup code verification in MFA challenge
- [ ] T090 Implement GET /api/v1/users/me/mfa/backup-codes (regenerate backup codes, admin action)
- [ ] T091 Add audit logging for MFA enable/disable, TOTP verification attempts

### Implementation Notes
- TOTP: 6-digit code, 30-second window, ±1 window tolerance (90 seconds total)
- QR code: data URI format (data:image/png;base64,...)
- Backup codes: 16-character alphanumeric, bcrypt hashed before storage
- MFA enforcement: optional for users, admin can enforce globally (defer global enforcement)

### Parallel Opportunities
- T084, T085, T086 (MFA endpoints) can proceed in parallel after T083
- T088, T089 (backup codes) can proceed in parallel

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
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP10-session-management.md`

### Included Subtasks
- [ ] T092 Implement GET /api/v1/sessions (list current user's active sessions)
- [ ] T093 Enhance session creation to capture device info (User-Agent parsing) and IP address
- [ ] T094 Implement DELETE /api/v1/sessions/:id (logout specific session)
- [ ] T095 Implement DELETE /api/v1/sessions (logout all sessions except current)
- [ ] T096 Enforce concurrent session limit (10 sessions per user, delete oldest if exceeded)
- [ ] T097 Update session last_activity timestamp on each authenticated request
- [ ] T098 Add audit logging for session creation, deletion

### Implementation Notes
- Session storage: Redis with TTL (24 hours default, 30 days for "remember me")
- Device info: parse User-Agent for browser, OS (use ua-parser-js or similar)
- Session listing: query Redis by user_id prefix
- Concurrency limit: check session count on login, delete oldest

### Parallel Opportunities
- T092, T093, T094, T095 (session endpoints) can proceed in parallel

### Dependencies
- Depends on WP04.

### Risks & Mitigations
- Session enumeration → require authentication, show only user's own sessions
- Redis memory pressure → monitor usage, adjust TTLs

---

## Work Package WP11: Frontend Authentication UI (Priority: P1) 🎯 MVP

**Goal**: Implement React authentication pages (login, register, email verification, password reset, profile).
**Independent Test**: User can navigate to login/register, submit forms, see errors, access protected dashboard.
**Prompt**: `kitty-specs/001-feature/tasks/planned/WP11-frontend-authentication-ui.md`

### Included Subtasks
- [ ] T099 Setup Vite React app (packages/frontend) with routing (React Router)
- [ ] T100 Create API client utility (packages/frontend/src/lib/api-client.ts) with Axios, interceptors for JWT
- [ ] T101 Create AuthContext (packages/frontend/src/lib/auth-context.tsx) for global auth state (user, token, login, logout)
- [ ] T102 [P] Create LoginPage (packages/frontend/src/features/auth/pages/LoginPage.tsx)
- [ ] T103 [P] Create RegisterPage (packages/frontend/src/features/auth/pages/RegisterPage.tsx)
- [ ] T104 [P] Create ForgotPasswordPage (packages/frontend/src/features/auth/pages/ForgotPasswordPage.tsx)
- [ ] T105 [P] Create ResetPasswordPage (packages/frontend/src/features/auth/pages/ResetPasswordPage.tsx)
- [ ] T106 [P] Create EmailVerificationBanner component (show on dashboard if email unverified)
- [ ] T107 Create ProtectedRoute component (redirect to login if not authenticated)
- [ ] T108 Create DashboardPage (packages/frontend/src/pages/DashboardPage.tsx) as authenticated home
- [ ] T109 Implement form validation (Zod schemas matching backend)
- [ ] T110 Add error handling and user feedback (toast notifications, inline errors)
- [ ] T111 Style forms with CSS or UI library (Tailwind CSS, shadcn/ui, or custom)

### Implementation Notes
- React Router v6 for routing
- Axios for HTTP client, interceptors for JWT token injection
- AuthContext with React.useContext for global state
- Form validation: Zod schemas (share types from backend via packages/shared if possible)
- Accessibility: WCAG 2.1 AA (labels, keyboard navigation, ARIA attributes)

### Parallel Opportunities
- T102, T103, T104, T105 (pages) can proceed in parallel after T099, T100, T101
- T109, T110, T111 (validation, errors, styling) can proceed in parallel

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
- [ ] T112 Create ProfilePage (packages/frontend/src/features/user/pages/ProfilePage.tsx)
- [ ] T113 Create EditProfileForm component (name, profile_image upload)
- [ ] T114 Implement profile image upload (base64 or FormData to backend)
- [ ] T115 Create ActiveSessionsPage (packages/frontend/src/features/user/pages/ActiveSessionsPage.tsx)
- [ ] T116 Create SessionListItem component (display device, IP, last activity)
- [ ] T117 Implement session logout action (delete specific session)
- [ ] T118 Create AccountSettingsPage (delete account, MFA toggle)
- [ ] T119 Add confirmation dialogs (account deletion, session logout)
- [ ] T120 Style profile and settings pages

### Implementation Notes
- Profile image upload: consider file size limits, image formats (JPEG, PNG)
- Session list: show current session highlighted
- Confirmation dialogs: use modal or native confirm (prefer accessible modal)

### Parallel Opportunities
- T112, T113, T114 (profile) and T115, T116, T117 (sessions) can proceed in parallel

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
- [ ] T121 Add OAuth login buttons to LoginPage (Google, GitHub)
- [ ] T122 Implement OAuth callback handling (parse URL params, exchange for JWT)
- [ ] T123 Create MFASetupPage (packages/frontend/src/features/user/pages/MFASetupPage.tsx)
- [ ] T124 Display QR code (render data URI from backend)
- [ ] T125 Create MFAVerifyForm component (6-digit TOTP input)
- [ ] T126 Add MFA challenge to login flow (show TOTP input if mfa_required)
- [ ] T127 Create BackupCodesDisplay component (show backup codes once after MFA enable)
- [ ] T128 Add MFA disable option in AccountSettingsPage
- [ ] T129 Style OAuth buttons and MFA UI

### Implementation Notes
- OAuth: open OAuth URL in popup or redirect (redirect simpler, better UX)
- QR code: render `<img src={qrDataUri} />` from backend response
- MFA TOTP input: 6-digit numeric, auto-focus, keyboard-friendly
- Backup codes: display once, warn user to save them

### Parallel Opportunities
- T121, T122 (OAuth) and T123, T124, T125, T126, T127, T128 (MFA) can proceed in parallel

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

| Subtask ID | Summary | Work Package | Priority | Parallel? |
|------------|---------|--------------|----------|-----------|
| T001 | Create monorepo structure | WP01 | P0 | No |
| T002 | Initialize root package.json | WP01 | P0 | No |
| T003 | Setup backend package.json | WP01 | P0 | Yes |
| T004 | Setup frontend package.json | WP01 | P0 | Yes |
| T005 | Setup shared package.json | WP01 | P0 | Yes |
| T006 | Configure TypeScript strict mode | WP01 | P0 | No |
| T007 | Setup ESLint and Prettier | WP01 | P0 | Yes |
| T008 | Configure Husky + lint-staged | WP01 | P0 | Yes |
| T009 | Create Docker Compose | WP01 | P0 | No |
| T010 | Create .env.example | WP01 | P0 | No |
| T011 | Document quickstart | WP01 | P0 | No |
| T012 | Create schema.prisma | WP02 | P0 | No |
| T013 | Define User model | WP02 | P0 | Yes |
| T014 | Define Session model | WP02 | P0 | Yes |
| T015 | Define OAuthConnection model | WP02 | P0 | Yes |
| T016 | Define MFASettings model | WP02 | P0 | Yes |
| T017 | Define AuditLog model | WP02 | P0 | Yes |
| T018 | Define EmailVerificationToken model | WP02 | P0 | Yes |
| T019 | Define PasswordResetToken model | WP02 | P0 | Yes |
| T020 | Add indexes | WP02 | P0 | No |
| T021 | Create initial migration | WP02 | P0 | No |
| T022 | Create seed.ts script | WP02 | P0 | No |
| T023 | Document schema decisions | WP02 | P0 | No |
| T024 | Create server.ts | WP03 | P0 | No |
| T025 | Create app.ts | WP03 | P0 | No |
| T026 | Implement config/index.ts | WP03 | P0 | No |
| T027 | Setup Pino logging | WP03 | P0 | Yes |
| T028 | Implement error handler | WP03 | P0 | Yes |
| T029 | Create response helpers | WP03 | P0 | Yes |
| T030 | Register @fastify/cors | WP03 | P0 | No |
| T031 | Register @fastify/helmet | WP03 | P0 | No |
| T032 | Create health endpoint | WP03 | P0 | No |
| T033 | Configure Prisma client | WP03 | P0 | No |
| T034 | Configure Redis client | WP03 | P0 | No |
| T035 | Register @fastify/jwt | WP04 | P1 | No |
| T036 | Register @fastify/session | WP04 | P1 | No |
| T037 | Implement password service | WP04 | P1 | Yes |
| T038 | Create Zod schemas | WP04 | P1 | Yes |
| T039 | Implement register endpoint | WP04 | P1 | Yes |
| T040 | Implement login endpoint | WP04 | P1 | Yes |
| T041 | Implement logout endpoint | WP04 | P1 | Yes |
| T042 | Create JWT auth middleware | WP04 | P1 | No |
| T043 | Implement session service | WP04 | P1 | No |
| T044 | Wire auth routes | WP04 | P1 | No |
| T045 | Add audit logging | WP04 | P1 | No |
| T046 | Setup email service | WP05 | P1 | Yes |
| T047 | Create token utility | WP05 | P1 | Yes |
| T048 | Implement verify-email send | WP05 | P1 | Yes |
| T049 | Implement verify-email confirm | WP05 | P1 | Yes |
| T050 | Implement password-reset request | WP05 | P1 | Yes |
| T051 | Implement password-reset confirm | WP05 | P1 | Yes |
| T052 | Implement token expiration | WP05 | P1 | No |
| T053 | Add rate limiting (placeholder) | WP05 | P1 | No |
| T054 | Add audit logging | WP05 | P1 | No |
| T055 | Implement GET /users/me | WP06 | P2 | Yes |
| T056 | Implement PATCH /users/me | WP06 | P2 | Yes |
| T057 | Implement DELETE /users/me | WP06 | P2 | Yes |
| T058 | Implement hard-delete cron | WP06 | P2 | No |
| T059 | Implement GET /users | WP06 | P2 | Yes |
| T060 | Implement GET /users/:id | WP06 | P2 | Yes |
| T061 | Implement PATCH /users/:id/role | WP06 | P2 | Yes |
| T062 | Add authorization middleware | WP06 | P2 | No |
| T063 | Add audit logging | WP06 | P2 | No |
| T064 | Register OAuth Google plugin | WP07 | P3 | No |
| T065 | Register OAuth GitHub plugin | WP07 | P3 | No |
| T066 | Configure OAuth redirect URIs | WP07 | P3 | No |
| T067 | Implement Google OAuth initiate | WP07 | P3 | Yes |
| T068 | Implement Google OAuth callback | WP07 | P3 | Yes |
| T069 | Implement GitHub OAuth initiate | WP07 | P3 | Yes |
| T070 | Implement GitHub OAuth callback | WP07 | P3 | Yes |
| T071 | Implement OAuth service | WP07 | P3 | No |
| T072 | Handle OAuth email match | WP07 | P3 | No |
| T073 | Handle OAuth new user | WP07 | P3 | No |
| T074 | Add audit logging | WP07 | P3 | No |
| T075 | Register rate-limit plugin | WP08 | P3 | No |
| T076 | Configure global rate limits | WP08 | P3 | No |
| T077 | Configure endpoint limits | WP08 | P3 | No |
| T078 | Add CSRF protection | WP08 | P3 | Yes |
| T079 | Enhance security headers | WP08 | P3 | Yes |
| T080 | Implement audit log endpoint | WP08 | P3 | No |
| T081 | Add IP/User-Agent capture | WP08 | P3 | No |
| T082 | Document security measures | WP08 | P3 | No |
| T083 | Install MFA libraries | WP09 | P4 | No |
| T084 | Implement MFA enable endpoint | WP09 | P4 | Yes |
| T085 | Implement MFA verify endpoint | WP09 | P4 | Yes |
| T086 | Implement MFA disable endpoint | WP09 | P4 | Yes |
| T087 | Implement MFA login challenge | WP09 | P4 | No |
| T088 | Generate backup codes | WP09 | P4 | Yes |
| T089 | Implement backup code verify | WP09 | P4 | Yes |
| T090 | Implement backup code regenerate | WP09 | P4 | No |
| T091 | Add audit logging | WP09 | P4 | No |
| T092 | Implement GET /sessions | WP10 | P5 | Yes |
| T093 | Enhance session device info | WP10 | P5 | No |
| T094 | Implement DELETE /sessions/:id | WP10 | P5 | Yes |
| T095 | Implement DELETE /sessions | WP10 | P5 | Yes |
| T096 | Enforce session limit | WP10 | P5 | No |
| T097 | Update session last_activity | WP10 | P5 | No |
| T098 | Add audit logging | WP10 | P5 | No |
| T099 | Setup Vite React app | WP11 | P1 | No |
| T100 | Create API client | WP11 | P1 | No |
| T101 | Create AuthContext | WP11 | P1 | No |
| T102 | Create LoginPage | WP11 | P1 | Yes |
| T103 | Create RegisterPage | WP11 | P1 | Yes |
| T104 | Create ForgotPasswordPage | WP11 | P1 | Yes |
| T105 | Create ResetPasswordPage | WP11 | P1 | Yes |
| T106 | Create EmailVerificationBanner | WP11 | P1 | Yes |
| T107 | Create ProtectedRoute | WP11 | P1 | No |
| T108 | Create DashboardPage | WP11 | P1 | No |
| T109 | Implement form validation | WP11 | P1 | Yes |
| T110 | Add error handling | WP11 | P1 | Yes |
| T111 | Style forms | WP11 | P1 | Yes |
| T112 | Create ProfilePage | WP12 | P2 | Yes |
| T113 | Create EditProfileForm | WP12 | P2 | Yes |
| T114 | Implement profile image upload | WP12 | P2 | Yes |
| T115 | Create ActiveSessionsPage | WP12 | P2 | Yes |
| T116 | Create SessionListItem | WP12 | P2 | Yes |
| T117 | Implement session logout | WP12 | P2 | Yes |
| T118 | Create AccountSettingsPage | WP12 | P2 | No |
| T119 | Add confirmation dialogs | WP12 | P2 | No |
| T120 | Style pages | WP12 | P2 | No |
| T121 | Add OAuth buttons | WP13 | P3 | Yes |
| T122 | Handle OAuth callback | WP13 | P3 | Yes |
| T123 | Create MFASetupPage | WP13 | P3 | Yes |
| T124 | Display QR code | WP13 | P3 | Yes |
| T125 | Create MFAVerifyForm | WP13 | P3 | Yes |
| T126 | Add MFA login challenge | WP13 | P3 | No |
| T127 | Create BackupCodesDisplay | WP13 | P3 | No |
| T128 | Add MFA disable option | WP13 | P3 | No |
| T129 | Style OAuth/MFA UI | WP13 | P3 | No |

---

> Tasks generated from design documents in `/kitty-specs/001-feature/`. MVP scope: WP01-WP05, WP11 (basic auth + frontend). Full feature: WP01-WP13 (OAuth, MFA, sessions, admin features).
