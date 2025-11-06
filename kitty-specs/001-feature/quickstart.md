# Quickstart: 개발 환경 설정 가이드

**Feature**: [spec.md](./spec.md)
**Created**: 2025-11-05
**Status**: Phase 1 - Design & Contracts

## Overview

이 문서는 ReadZone 사용자 인증 시스템의 개발 환경을 설정하는 단계별 가이드입니다.

**소요 시간**: 약 30분 (모든 종속성 설치 포함)

---

## Prerequisites

### 필수 소프트웨어

| 소프트웨어 | 최소 버전 | 권장 버전 | 설치 확인 |
|-----------|----------|----------|----------|
| **Node.js** | 20.0.0 | 20.10.0 LTS | `node --version` |
| **pnpm** | 8.0.0 | 8.15.0+ | `pnpm --version` |
| **PostgreSQL** | 14.0 | 16.0+ | `psql --version` |
| **Redis** | 6.0 | 7.2+ | `redis-cli --version` |
| **Git** | 2.30 | 2.40+ | `git --version` |

### 운영체제

- **macOS**: 13+ (Ventura)
- **Ubuntu**: 22.04 LTS
- **Windows**: WSL2 (Ubuntu 22.04) 권장

---

## Installation Steps

### 1. Node.js 및 pnpm 설치

#### macOS (Homebrew)
```bash
# Node.js 설치 (LTS)
brew install node@20

# pnpm 설치
npm install -g pnpm@latest

# 설치 확인
node --version  # v20.10.0 이상
pnpm --version  # 8.15.0 이상
```

#### Ubuntu
```bash
# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm 설치
npm install -g pnpm@latest

# 설치 확인
node --version
pnpm --version
```

### 2. PostgreSQL 설치 및 설정

#### macOS (Homebrew)
```bash
# PostgreSQL 설치
brew install postgresql@16

# 서비스 시작
brew services start postgresql@16

# 설치 확인
psql --version  # psql (PostgreSQL) 16.x
```

#### Ubuntu
```bash
# PostgreSQL 16 설치
sudo apt install postgresql-16 postgresql-contrib

# 서비스 시작
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 설치 확인
psql --version
```

#### 데이터베이스 생성
```bash
# PostgreSQL 접속 (macOS)
psql postgres

# PostgreSQL 접속 (Ubuntu)
sudo -u postgres psql

# 데이터베이스 및 사용자 생성
CREATE DATABASE readzone_dev;
CREATE USER readzone_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE readzone_dev TO readzone_user;
\q

# 연결 테스트
psql -U readzone_user -d readzone_dev -h localhost
```

### 3. Redis 설치 및 설정

#### macOS (Homebrew)
```bash
# Redis 설치
brew install redis

# 서비스 시작
brew services start redis

# 설치 확인
redis-cli ping  # PONG 응답
```

#### Ubuntu
```bash
# Redis 설치
sudo apt install redis-server

# 서비스 시작
sudo systemctl start redis
sudo systemctl enable redis

# 설치 확인
redis-cli ping
```

#### Redis 설정 (선택사항)
```bash
# Redis 설정 파일 편집 (macOS)
nano /usr/local/etc/redis.conf

# Redis 설정 파일 편집 (Ubuntu)
sudo nano /etc/redis/redis.conf

# 권장 설정:
# maxmemory 512mb
# maxmemory-policy allkeys-lru
# save "" (persistence 비활성화, 세션 데이터용)

# 설정 적용
brew services restart redis  # macOS
sudo systemctl restart redis  # Ubuntu
```

---

## Repository Setup

### 1. 저장소 클론

```bash
# 저장소 클론
git clone https://github.com/your-org/readzone.git
cd readzone

# 개발 브랜치 체크아웃 (worktree 사용 시)
git worktree add .worktrees/001-feature 001-feature
cd .worktrees/001-feature
```

### 2. 환경 변수 설정

#### Backend 환경 변수

```bash
# backend/.env 파일 생성
cd packages/backend
cp .env.example .env
```

`.env` 파일 내용:

```bash
# ============================================================
# Database
# ============================================================
DATABASE_URL="postgresql://readzone_user:your_secure_password@localhost:5432/readzone_dev?schema=public&connection_limit=10&pool_timeout=20"

# ============================================================
# Redis
# ============================================================
REDIS_URL="redis://localhost:6379"
REDIS_SESSION_PREFIX="sess:"
REDIS_SESSION_TTL=86400  # 24시간 (초 단위)

# ============================================================
# JWT
# ============================================================
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_SECRET="your-super-secret-refresh-token-key-minimum-32-characters"
JWT_REFRESH_EXPIRES_IN="30d"

# ============================================================
# Session
# ============================================================
SESSION_SECRET="your-super-secret-session-key-minimum-32-characters-long"
SESSION_MAX_AGE=86400000  # 24시간 (밀리초)
SESSION_REMEMBER_ME_MAX_AGE=2592000000  # 30일 (밀리초)

# ============================================================
# Encryption (AES-256-GCM for OAuth tokens, MFA secrets)
# ============================================================
ENCRYPTION_KEY="your-256-bit-encryption-key-64-hex-characters-exactly-1234567890abcdef"

# ============================================================
# Email (개발 환경: Mailtrap 사용 권장)
# ============================================================
EMAIL_HOST="smtp.mailtrap.io"
EMAIL_PORT=2525
EMAIL_USER="your-mailtrap-username"
EMAIL_PASSWORD="your-mailtrap-password"
EMAIL_FROM="noreply@readzone.com"
EMAIL_VERIFICATION_URL="http://localhost:5173/auth/email/verify"
PASSWORD_RESET_URL="http://localhost:5173/auth/password/reset"

# ============================================================
# OAuth Providers
# ============================================================
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/oauth/google/callback"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_CALLBACK_URL="http://localhost:3000/api/v1/auth/oauth/github/callback"

# ============================================================
# Server
# ============================================================
NODE_ENV="development"
PORT=3000
HOST="localhost"
CORS_ORIGIN="http://localhost:5173"

# ============================================================
# Rate Limiting
# ============================================================
RATE_LIMIT_WINDOW_MS=60000  # 1분 (밀리초)
RATE_LIMIT_MAX_REQUESTS=100  # 1분당 최대 요청 수

# ============================================================
# Logging
# ============================================================
LOG_LEVEL="debug"  # debug, info, warn, error
LOG_FILE_PATH="./logs"
```

#### Frontend 환경 변수

```bash
# frontend/.env 파일 생성
cd ../frontend
cp .env.example .env
```

`.env` 파일 내용:

```bash
# API 엔드포인트
VITE_API_URL="http://localhost:3000/api/v1"

# OAuth 리다이렉트 URL
VITE_OAUTH_REDIRECT_URL="http://localhost:5173/auth/callback"

# 기타 설정
VITE_APP_NAME="ReadZone"
VITE_APP_ENV="development"
```

### 3. Dependencies 설치

```bash
# 프로젝트 루트로 이동
cd ../..

# 모든 패키지 의존성 설치 (monorepo)
pnpm install

# 설치 확인
pnpm list --depth=0
```

**예상 소요 시간**: 2-5분 (네트워크 속도에 따라 다름)

### 4. 데이터베이스 마이그레이션

```bash
# Backend 디렉토리로 이동
cd packages/backend

# Prisma 마이그레이션 실행
pnpm prisma migrate dev --name init-auth-system

# Prisma Client 생성 (자동 실행되지만 확인)
pnpm prisma generate

# 마이그레이션 상태 확인
pnpm prisma migrate status
```

**예상 출력**:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "readzone_dev", schema "public" at "localhost:5432"

Applying migration `20251105_init_auth_system`

The following migration(s) have been applied:

migrations/
  └─ 20251105_init_auth_system/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client in 123ms
```

### 5. Seed 데이터 생성 (선택사항)

```bash
# Seed 스크립트 실행 (관리자 계정 생성)
pnpm prisma db seed

# 또는 직접 실행
pnpm tsx prisma/seed.ts
```

**생성되는 계정**:
- **Email**: `admin@readzone.com`
- **Password**: `Admin123!@#` (첫 로그인 후 변경 필수)
- **Role**: `admin`

---

## Running the Application

### 1. 개발 서버 실행

#### 방법 1: 전체 실행 (권장)

```bash
# 프로젝트 루트에서 실행
pnpm dev

# 또는 각 패키지별 실행
pnpm --filter @readzone/backend dev &
pnpm --filter @readzone/frontend dev
```

#### 방법 2: 개별 실행

**Backend (터미널 1)**:
```bash
cd packages/backend
pnpm dev
```

**Frontend (터미널 2)**:
```bash
cd packages/frontend
pnpm dev
```

### 2. 실행 확인

#### Backend 상태 확인
```bash
# Health check
curl http://localhost:3000/health

# 예상 응답:
# {"status":"ok","timestamp":"2025-11-05T12:00:00Z"}

# API 문서 확인 (Swagger UI)
open http://localhost:3000/docs
```

#### Frontend 상태 확인
```bash
# 브라우저에서 열기
open http://localhost:5173

# 로그인 페이지 확인
open http://localhost:5173/auth/login
```

#### Redis 연결 확인
```bash
# Redis CLI 접속
redis-cli

# 세션 키 확인 (로그인 후)
KEYS sess:*

# 세션 데이터 조회
GET sess:your-session-id
```

#### PostgreSQL 연결 확인
```bash
# psql 접속
psql -U readzone_user -d readzone_dev -h localhost

# 테이블 목록 확인
\dt

# 예상 출력:
#              List of relations
#  Schema |         Name              | Type  |     Owner
# --------+---------------------------+-------+----------------
#  public | users                     | table | readzone_user
#  public | sessions                  | table | readzone_user
#  public | oauth_connections         | table | readzone_user
#  public | mfa_settings              | table | readzone_user
#  public | audit_logs                | table | readzone_user
#  public | email_verification_tokens | table | readzone_user
#  public | password_reset_tokens     | table | readzone_user

# 사용자 수 확인
SELECT COUNT(*) FROM users;

\q
```

---

## Testing

### 1. 타입 체크

```bash
# 전체 프로젝트 타입 체크
pnpm type-check

# Backend만
pnpm --filter @readzone/backend type-check

# Frontend만
pnpm --filter @readzone/frontend type-check
```

### 2. 린트

```bash
# 전체 프로젝트 린트
pnpm lint

# Backend만
pnpm --filter @readzone/backend lint

# Frontend만
pnpm --filter @readzone/frontend lint

# 자동 수정
pnpm lint --fix
```

### 3. Unit 테스트

```bash
# 전체 프로젝트 테스트
pnpm test

# Backend만
pnpm --filter @readzone/backend test

# Frontend만
pnpm --filter @readzone/frontend test

# 커버리지 포함
pnpm test --coverage

# Watch 모드
pnpm test --watch
```

### 4. Integration 테스트

```bash
# Backend integration 테스트
pnpm --filter @readzone/backend test:integration

# 테스트 DB 초기화 필요 시
pnpm --filter @readzone/backend prisma migrate reset --force
pnpm --filter @readzone/backend test:integration
```

### 5. E2E 테스트

```bash
# Playwright E2E 테스트 (frontend)
pnpm --filter @readzone/frontend test:e2e

# UI 모드로 실행 (디버깅)
pnpm --filter @readzone/frontend test:e2e:ui

# 특정 브라우저만
pnpm --filter @readzone/frontend test:e2e --project=chromium
```

---

## Useful Commands

### Database

```bash
# Prisma Studio (GUI DB 브라우저)
pnpm --filter @readzone/backend prisma studio

# 마이그레이션 생성
pnpm --filter @readzone/backend prisma migrate dev --name <migration-name>

# 마이그레이션 롤백
pnpm --filter @readzone/backend prisma migrate reset

# 데이터베이스 초기화 (개발 환경)
pnpm --filter @readzone/backend prisma migrate reset --force
pnpm --filter @readzone/backend prisma db seed
```

### Redis

```bash
# Redis CLI
redis-cli

# 모든 세션 삭제 (개발 환경)
redis-cli FLUSHDB

# 세션 TTL 확인
redis-cli TTL sess:<session-id>

# 세션 패턴 검색
redis-cli KEYS "sess:*"

# 세션 수 확인
redis-cli DBSIZE
```

### Build

```bash
# 전체 프로젝트 빌드
pnpm build

# Backend만
pnpm --filter @readzone/backend build

# Frontend만
pnpm --filter @readzone/frontend build

# 빌드 결과 확인
ls -la packages/backend/dist
ls -la packages/frontend/dist
```

### Clean

```bash
# node_modules 삭제 (전체)
pnpm clean

# 빌드 결과물 삭제
pnpm clean:build

# 전체 클린 후 재설치
pnpm clean
pnpm install
```

---

## Troubleshooting

### 1. pnpm 설치 오류

**문제**: `command not found: pnpm`

**해결**:
```bash
# npm으로 pnpm 재설치
npm install -g pnpm@latest

# 또는 Homebrew (macOS)
brew install pnpm
```

### 2. PostgreSQL 연결 오류

**문제**: `ECONNREFUSED` 또는 `authentication failed`

**해결**:
```bash
# PostgreSQL 서비스 상태 확인
brew services list  # macOS
sudo systemctl status postgresql  # Ubuntu

# 서비스 재시작
brew services restart postgresql@16  # macOS
sudo systemctl restart postgresql  # Ubuntu

# 연결 테스트
psql -U readzone_user -d readzone_dev -h localhost -c "SELECT 1;"

# .env 파일 DATABASE_URL 확인
cat packages/backend/.env | grep DATABASE_URL
```

### 3. Redis 연결 오류

**문제**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**해결**:
```bash
# Redis 서비스 상태 확인
brew services list  # macOS
sudo systemctl status redis  # Ubuntu

# 서비스 재시작
brew services restart redis  # macOS
sudo systemctl restart redis  # Ubuntu

# 연결 테스트
redis-cli ping  # PONG 응답 확인
```

### 4. Prisma 마이그레이션 오류

**문제**: `Migration failed` 또는 `Schema out of sync`

**해결**:
```bash
# 1. 마이그레이션 상태 확인
pnpm --filter @readzone/backend prisma migrate status

# 2. 스키마 재설정 (개발 환경만!)
pnpm --filter @readzone/backend prisma migrate reset --force

# 3. 새 마이그레이션 생성
pnpm --filter @readzone/backend prisma migrate dev

# 4. Prisma Client 재생성
pnpm --filter @readzone/backend prisma generate
```

### 5. TypeScript 타입 오류

**문제**: `any` 타입 사용 경고 또는 타입 불일치

**해결**:
```bash
# Prisma Client 재생성 (데이터 모델 변경 시)
pnpm --filter @readzone/backend prisma generate

# 타입 체크 (상세 오류 확인)
pnpm --filter @readzone/backend type-check

# tsconfig.json 확인
cat packages/backend/tsconfig.json | grep strict
# "strict": true 확인
```

### 6. Port 충돌

**문제**: `EADDRINUSE: address already in use`

**해결**:
```bash
# 포트 사용 프로세스 확인 (macOS/Linux)
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# 프로세스 종료
kill -9 <PID>

# 또는 다른 포트 사용 (.env 파일 수정)
PORT=3001  # Backend
VITE_PORT=5174  # Frontend
```

### 7. OAuth 설정 오류

**문제**: `invalid_client` 또는 `redirect_uri_mismatch`

**해결**:
```bash
# 1. .env 파일 확인
cat packages/backend/.env | grep -E "(GOOGLE|GITHUB)"

# 2. Callback URL 확인
# Google: http://localhost:3000/api/v1/auth/oauth/google/callback
# GitHub: http://localhost:3000/api/v1/auth/oauth/github/callback

# 3. OAuth 제공자 콘솔에서 Callback URL 등록 확인
# - Google: https://console.cloud.google.com/apis/credentials
# - GitHub: https://github.com/settings/developers
```

---

## Development Workflow

### 1. 기능 개발

```bash
# 1. 새 브랜치 생성
git checkout -b feature/new-feature-name

# 2. 개발 진행
pnpm dev

# 3. 타입 체크 및 린트
pnpm type-check
pnpm lint --fix

# 4. 테스트 작성 및 실행
pnpm test

# 5. 커밋
git add .
git commit -m "feat: 새 기능 설명"

# 6. 푸시
git push origin feature/new-feature-name
```

### 2. 데이터 모델 변경

```bash
# 1. schema.prisma 수정
nano packages/backend/prisma/schema.prisma

# 2. 마이그레이션 생성
pnpm --filter @readzone/backend prisma migrate dev --name <migration-name>

# 3. Prisma Client 확인
pnpm --filter @readzone/backend prisma generate

# 4. 타입 체크
pnpm --filter @readzone/backend type-check

# 5. 테스트 업데이트 및 실행
pnpm --filter @readzone/backend test
```

### 3. API 계약 변경

```bash
# 1. OpenAPI 스키마 수정
nano kitty-specs/001-feature/contracts/auth-api.yaml

# 2. 스키마 검증 (openapi-cli 설치 필요)
npx @redocly/cli lint kitty-specs/001-feature/contracts/auth-api.yaml

# 3. 문서 확인 (Swagger UI)
open http://localhost:3000/docs

# 4. Frontend 타입 업데이트 (필요 시)
pnpm --filter @readzone/frontend codegen
```

---

## Next Steps

Phase 1 (Design & Contracts) 완료 후 다음 단계:

1. ✅ **Phase 0**: research.md 작성 완료
2. ✅ **Phase 1**:
   - ✅ data-model.md 작성 완료
   - ✅ contracts/ 작성 완료
   - ✅ quickstart.md 작성 완료
3. ⏳ **Phase 2**: tasks.md 생성 (`/spec-kitty.tasks`)
   - Work packages 정의
   - Subtasks 세부 사항 작성
   - 우선순위 및 의존성 설정

Phase 2로 진행하려면:
```bash
# Spec Kitty tasks 명령어 실행
/spec-kitty.tasks
```

---

## References

### Documentation
- [Fastify Docs](https://fastify.dev/)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [pnpm Docs](https://pnpm.io/)

### Tools
- [Prisma Studio](https://www.prisma.io/studio)
- [Redis Commander](http://joeferner.github.io/redis-commander/)
- [Mailtrap](https://mailtrap.io/) (개발용 이메일)
- [Postman](https://www.postman.com/) (API 테스트)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [argon2 Spec](https://github.com/P-H-C/phc-winner-argon2)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-05
**Status**: Ready for development
