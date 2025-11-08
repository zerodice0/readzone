# ReadZone Backend

NestJS-based backend API for ReadZone user authentication system.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [User Management](#user-management)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Documentation](#documentation)

## Overview

ReadZone Backend provides a comprehensive authentication and user management system with:

- **Email/Password Authentication**: Secure password-based authentication with bcrypt hashing
- **OAuth Integration**: Google and GitHub OAuth providers
- **Multi-Factor Authentication (MFA)**: TOTP-based 2FA
- **Session Management**: Hybrid JWT + Redis session storage
- **Role-Based Access Control (RBAC)**: 5-level permission system
- **Audit Logging**: Comprehensive security and compliance logging
- **User Profile Management**: Self-service and admin-managed profiles

## Tech Stack

- **Runtime**: Node.js 20.x
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x (strict mode)
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5.x
- **Cache**: Redis 7.x
- **Authentication**: JWT + Passport.js
- **Testing**: Jest + Supertest
- **Validation**: class-validator + class-transformer

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- pnpm 8.x
- Docker & Docker Compose (for PostgreSQL and Redis)

### Installation

```bash
# Install dependencies
pnpm install

# Start PostgreSQL and Redis
docker-compose up -d

# Run database migrations
pnpm prisma migrate dev

# Seed database (optional)
pnpm prisma db seed

# Start development server
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/readzone"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Email
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"

# Application
NODE_ENV="development"
PORT=3000
API_PREFIX="/api/v1"
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Email/password login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and revoke tokens
- `POST /auth/verify-email` - Verify email address
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - GitHub OAuth callback

### User Profile

- `GET /users/me` - Get authenticated user profile
- `PATCH /users/me` - Update user profile
- `DELETE /users/me` - Delete user account (soft-delete with 30-day grace period)

### Admin User Management

**Role Required:** ADMIN or SUPERADMIN

- `GET /admin/users` - List all users (with pagination, filtering, sorting)
- `GET /admin/users/:id` - Get user details (includes sessions and audit logs)
- `PATCH /admin/users/:id` - Update user (role, status, email verification)
- `DELETE /admin/users/:id/force-delete` - Permanently delete user account

## User Management

### Self-Service Profile Management

Users can manage their own profiles through the `/users/me` endpoints:

**Get Profile:**

```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>"
```

**Update Profile:**

```bash
curl -X PATCH http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "name": "New Name"
  }'
```

**Delete Account:**

```bash
curl -X DELETE http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "UserPassword123!",
    "confirmDeletion": true
  }'
```

### Administrative User Management

Admins can manage all users through the `/admin/users` endpoints:

**List Users:**

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?page=1&limit=20&role=USER&status=ACTIVE" \
  -H "Authorization: Bearer <admin_token>"
```

**Get User Details:**

```bash
curl -X GET http://localhost:3000/api/v1/admin/users/<user_id> \
  -H "Authorization: Bearer <admin_token>"
```

**Update User:**

```bash
curl -X PATCH http://localhost:3000/api/v1/admin/users/<user_id> \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "MODERATOR",
    "status": "ACTIVE",
    "emailVerified": true
  }'
```

**Force Delete User:**

```bash
curl -X DELETE http://localhost:3000/api/v1/admin/users/<user_id>/force-delete \
  -H "Authorization: Bearer <admin_token>"
```

### Role-Based Access Control (RBAC)

| Role       | Level | Description                        |
| ---------- | ----- | ---------------------------------- |
| ANONYMOUS  | 0     | Non-logged-in users (read-only)    |
| USER       | 1     | Regular authenticated users        |
| MODERATOR  | 2     | Content moderators                 |
| ADMIN      | 3     | System administrators              |
| SUPERADMIN | 4     | Super administrators (full access) |

### Account Deletion

**Soft-Delete (User):**

- 30-day grace period before permanent deletion
- All sessions immediately revoked
- User can contact support to restore account
- Background job permanently deletes after 30 days

**Force-Delete (Admin):**

- Immediate permanent deletion
- No grace period
- CASCADE deletes related records (sessions, OAuth, MFA, tokens)
- Preserves audit logs with `userId = null`
- GDPR "right to be forgotten" compliant

### Audit Logging

All critical user management actions are logged:

| Action               | Severity | Trigger                     |
| -------------------- | -------- | --------------------------- |
| PROFILE_UPDATE       | MEDIUM   | User updates email/name     |
| ROLE_CHANGE          | CRITICAL | Admin changes user role     |
| ACCOUNT_SUSPEND      | CRITICAL | Admin suspends user         |
| ACCOUNT_DELETE       | CRITICAL | User soft-deletes account   |
| ACCOUNT_FORCE_DELETE | CRITICAL | Admin force-deletes account |

For detailed documentation, see [docs/user-management.md](./docs/user-management.md).

## Architecture

### Module Structure

```
src/
├── app.module.ts                 # Root module
├── common/                       # Shared utilities and services
│   ├── decorators/              # Custom decorators (@Roles, etc.)
│   ├── guards/                  # Guards (RolesGuard, etc.)
│   ├── filters/                 # Exception filters
│   ├── services/                # Shared services (Audit, Email)
│   └── utils/                   # Utilities (Prisma, crypto)
├── modules/
│   ├── auth/                    # Authentication module
│   │   ├── controllers/         # Auth controllers
│   │   ├── services/            # Auth services
│   │   ├── strategies/          # Passport strategies
│   │   ├── guards/              # JWT guards
│   │   └── dto/                 # DTOs
│   └── users/                   # User management module
│       ├── controllers/         # User & Admin controllers
│       ├── services/            # User service
│       ├── dto/                 # DTOs
│       └── tasks/               # Background jobs (pseudocode)
└── prisma/
    ├── schema.prisma            # Database schema
    ├── migrations/              # Database migrations
    └── seed.ts                  # Seed data
```

### Database Schema

Key entities:

- **User**: Core user entity with email, password, role, status
- **Session**: JWT session management
- **OAuthConnection**: Google/GitHub OAuth links
- **MFASettings**: TOTP secrets and backup codes
- **AuditLog**: Security and compliance logging
- **EmailVerificationToken**: Email verification tokens
- **PasswordResetToken**: Password reset tokens

### Security Features

#### Authentication & Authorization
- **Password Hashing**: bcrypt with salt rounds = 10
- **JWT Tokens**: Short-lived access tokens (1h) + long-lived refresh tokens (7d)
- **Session Revocation**: Immediate revocation on logout, deletion, suspension
- **MFA Support**: TOTP-based 2FA with backup codes
- **Role-Based Access Control (RBAC)**: 5 role levels with granular permissions

#### Request Protection
- **CSRF Protection**: Double-submit cookie pattern with timing-safe token comparison
  - Required for all state-changing operations (POST, PUT, PATCH, DELETE)
  - Safe methods (GET, HEAD, OPTIONS) allowed without token
  - Public endpoints (login, register, OAuth) properly excluded
  - Get token: `GET /api/v1/csrf/token`
- **Rate Limiting**: Distributed rate limiting with Redis storage
  - Global: 100 req/min (anonymous), 1000 req/min (authenticated)
  - Login: 5 attempts per 5 minutes per IP
  - Register: 3 attempts per hour per IP
  - Password Reset: 3 attempts per hour per IP
- **Input Validation**: class-validator for all DTOs with strict whitelist mode

#### Data Protection
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Helmet.js security headers (CSP, X-Frame-Options, etc.)
- **Audit Logging**: Comprehensive security event logging with IP and User-Agent capture

## Development

### Code Quality

```bash
# Lint
pnpm lint

# Format
pnpm format

# Type check
pnpm tsc --noEmit

# Run all checks
pnpm lint && pnpm format && pnpm tsc --noEmit
```

### Database

```bash
# Create migration
pnpm prisma migrate dev --name <migration_name>

# Apply migrations
pnpm prisma migrate deploy

# Reset database (⚠️ deletes all data)
pnpm prisma migrate reset

# Open Prisma Studio
pnpm prisma studio
```

## Testing

### Unit Tests

```bash
# Run unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov
```

### Integration Tests (E2E)

```bash
# Run all e2e tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e test/users.e2e-spec.ts

# Watch mode
pnpm test:e2e --watch
```

**Test Coverage:**

- User endpoints: 13 tests
- Admin endpoints: 21 tests
- Authorization & RBAC: 12 tests
- **Total:** 46 integration tests

### Test Files

- `test/users.e2e-spec.ts` - User profile endpoints (T055-T057)
- `test/admin.e2e-spec.ts` - Admin user management (T059-T062)
- `test/authorization.e2e-spec.ts` - RBAC and authorization (T063)

## Documentation

- [User Management Guide](./docs/user-management.md) - Comprehensive guide to user management APIs
- [API Reference](./docs/api-reference.md) - Detailed API documentation
- [Database Schema](./docs/database-schema.md) - Database design and relationships
- [Audit Logging](./docs/audit-logging.md) - Security and compliance logging
- [Development Guide](./docs/development.md) - Development workflows and best practices

## Contributing

Please read [CONTRIBUTING.md](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

This project is licensed under the MIT License - see [LICENSE](../../LICENSE) file for details.

## Support

For questions or issues:

- GitHub Issues: [https://github.com/your-org/readzone/issues](https://github.com/your-org/readzone/issues)
- Documentation: [./docs/](./docs/)
- Email: support@readzone.com
