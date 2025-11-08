---
work_package_id: 'WP07'
title: 'OAuth Integration (Google & GitHub)'
phase: 'Phase 3 - Advanced Features'
lane: 'planned'
subtasks:
  [
    'T064',
    'T065',
    'T066',
    'T067',
    'T068',
    'T069',
    'T070',
    'T071',
    'T072',
    'T073',
    'T074',
    'T075',
  ]
agent: 'claude'
shell_pid: '9940'
history:
  - timestamp: '2025-11-06T00:00:00Z'
    lane: 'planned'
    agent: 'system'
    action: 'Prompt generated via /spec-kitty.tasks'
  - timestamp: '2025-11-08T00:00:00Z'
    lane: 'planned'
    agent: 'claude'
    action: 'Updated to NestJS + Passport.js strategy-based implementation'
  - timestamp: '2025-11-08T17:42:00Z'
    lane: 'doing'
    agent: 'claude'
    action: 'Started implementation - OAuth dependencies, strategies, and endpoints'
  - timestamp: '2025-11-08T18:30:00Z'
    lane: 'for_review'
    agent: 'claude'
    action: 'Implementation completed - Ready for code review'
---

# Work Package Prompt: WP07 – OAuth Integration (Google & GitHub)

## Objectives & Success Criteria

**Goal**: Implement OAuth 2.0 authentication with Google and GitHub using NestJS + Passport.js strategies, enabling users to sign up and log in with their existing accounts.

**Success Criteria**:

- User can click "Login with Google" → redirected to Google → authenticated → logged into ReadZone with JWT token
- User can click "Login with GitHub" → redirected to GitHub → authenticated → logged into ReadZone with JWT token
- OAuth email matches existing user → OAuthConnection created/updated, user logged in
- OAuth email is new → User + OAuthConnection created, emailVerified=true, user logged in
- Audit logs record all OAuth connection events (success, failure, account linking)

## Context & Constraints

**Framework**: NestJS 10.x with @nestjs/passport integration
**Passport Strategies**: passport-google-oauth20, passport-github2
**OAuth Providers**: Google OAuth 2.0, GitHub OAuth Apps

**Key Architectural Decisions** (from research.md):

- Passport.js strategies extend `PassportStrategy` and implement `validate()` method
- `AuthGuard('google')` and `AuthGuard('github')` for route protection
- State parameter and PKCE handled automatically by Passport strategies
- OAuth profile: extract email, name, profile_image from provider response

**Supporting Documents**:

- tasks.md WP07: Full subtask list, implementation notes, parallel opportunities
- plan.md: Tech stack (NestJS + Passport), OAuth integration patterns
- research.md: OAuth 2.0 security best practices, Passport strategy configuration
- data-model.md: OAuthConnection entity schema

## Subtasks & Detailed Guidance

### T064: Install OAuth Dependencies

**Task**: Install passport-google-oauth20 and passport-github2 packages

**Commands**:

```bash
cd packages/backend
pnpm add passport-google-oauth20 passport-github2
pnpm add -D @types/passport-google-oauth20 @types/passport-github2
```

**Validation**: Check package.json includes both packages and their types

---

### T065: Configure OAuth Credentials

**Task**: Add OAuth client credentials to .env.example and config module

**Files**:

- `packages/backend/.env.example`: Add OAuth environment variables
- `packages/backend/src/config/index.ts`: Add OAuth config schema validation

**Environment Variables to Add**:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/oauth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/oauth/github/callback
```

**Config Schema** (add to config/index.ts):

```typescript
oauth: z.object({
  google: z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    callbackUrl: z.string().url(),
  }),
  github: z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    callbackUrl: z.string().url(),
  }),
}),
```

**Validation**:

- Config validation fails if OAuth credentials missing
- Callback URLs must be valid URLs

---

### T066: Create GoogleStrategy

**Task**: Implement Passport Google OAuth 2.0 strategy

**File**: `packages/backend/src/modules/auth/strategies/google.strategy.ts`

**Implementation**:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthService } from '../services/oauth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private oauthService: OAuthService
  ) {
    super({
      clientID: configService.get('oauth.google.clientId'),
      clientSecret: configService.get('oauth.google.clientSecret'),
      callbackURL: configService.get('oauth.google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    const { emails, displayName, photos } = profile;

    const oauthProfile = {
      provider: 'GOOGLE' as const,
      providerId: profile.id,
      email: emails[0].value,
      name: displayName,
      profileImage: photos?.[0]?.value,
    };

    const user = await this.oauthService.handleOAuthLogin(oauthProfile);
    done(null, user);
  }
}
```

**Key Points**:

- Strategy name: 'google' (used in AuthGuard('google'))
- Scope: ['email', 'profile'] to access user info
- validate() calls OAuthService to handle user creation/linking
- Returns user object that will be attached to request

**Validation**:

- TypeScript compiles without errors
- Strategy registered in AuthModule providers

---

### T067: Create GitHubStrategy

**Task**: Implement Passport GitHub OAuth strategy

**File**: `packages/backend/src/modules/auth/strategies/github.strategy.ts`

**Implementation**:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { OAuthService } from '../services/oauth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private oauthService: OAuthService
  ) {
    super({
      clientID: configService.get('oauth.github.clientId'),
      clientSecret: configService.get('oauth.github.clientSecret'),
      callbackURL: configService.get('oauth.github.callbackUrl'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<any> {
    const { emails, displayName, photos } = profile;

    const oauthProfile = {
      provider: 'GITHUB' as const,
      providerId: profile.id,
      email: emails[0].value,
      name: displayName || profile.username,
      profileImage: photos?.[0]?.value,
    };

    const user = await this.oauthService.handleOAuthLogin(oauthProfile);
    return user;
  }
}
```

**Key Points**:

- Strategy name: 'github' (used in AuthGuard('github'))
- Scope: ['user:email'] to access email addresses
- GitHub may not provide displayName, use username as fallback
- validate() calls OAuthService for consistent user handling

**Validation**:

- TypeScript compiles without errors
- Strategy registered in AuthModule providers

---

### T068: Implement OAuthService

**Task**: Create OAuthService to handle OAuth user creation and account linking

**File**: `packages/backend/src/modules/auth/services/oauth.service.ts`

**Service Methods**:

1. **handleOAuthLogin(oauthProfile)**:
   - Check if user exists by email
   - If exists: link/update OAuthConnection, return user
   - If new: create User + OAuthConnection, return user

2. **createOrUpdateOAuthConnection(userId, provider, providerId)**:
   - Check if OAuthConnection exists for this user + provider
   - If exists: update provider_user_id
   - If not: create new OAuthConnection

**Implementation Skeleton**:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/utils/prisma.service';
import { OAuthProvider } from '@prisma/client';

interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  name: string;
  profileImage?: string;
}

@Injectable()
export class OAuthService {
  constructor(private prisma: PrismaService) {}

  async handleOAuthLogin(profile: OAuthProfile) {
    // T073: Check if user exists by email
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
      include: { oauthConnections: true },
    });

    if (user) {
      // T073: Existing user - link/update OAuth connection
      await this.createOrUpdateOAuthConnection(
        user.id,
        profile.provider,
        profile.providerId
      );
    } else {
      // T074: New user - create User + OAuthConnection
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          profileImage: profile.profileImage,
          emailVerified: true, // OAuth users are auto-verified
          oauthConnections: {
            create: {
              provider: profile.provider,
              providerUserId: profile.providerId,
            },
          },
        },
        include: { oauthConnections: true },
      });
    }

    return user;
  }

  private async createOrUpdateOAuthConnection(
    userId: string,
    provider: OAuthProvider,
    providerId: string
  ) {
    const existing = await this.prisma.oAuthConnection.findFirst({
      where: { userId, provider },
    });

    if (existing) {
      // Update provider ID if changed
      return this.prisma.oAuthConnection.update({
        where: { id: existing.id },
        data: { providerUserId: providerId },
      });
    } else {
      // Create new connection
      return this.prisma.oAuthConnection.create({
        data: { userId, provider, providerUserId: providerId },
      });
    }
  }
}
```

**Key Points**:

- Handles both existing user (T073) and new user (T074) cases
- OAuth users get emailVerified=true automatically
- Updates OAuthConnection if provider ID changes
- Returns full user object with oauthConnections included

**Validation**:

- Service registered in AuthModule providers
- Prisma queries execute without errors
- User created with emailVerified=true for OAuth signup

---

### T069: Implement Google OAuth Initiate Endpoint

**Task**: Add GET /api/v1/auth/oauth/google route to start OAuth flow

**File**: `packages/backend/src/modules/auth/controllers/auth.controller.ts`

**Implementation**:

```typescript
@Get('oauth/google')
@UseGuards(AuthGuard('google'))
googleAuth() {
  // Passport handles redirect to Google
}
```

**Key Points**:

- AuthGuard('google') triggers GoogleStrategy
- No response needed - Passport redirects to Google OAuth page
- State parameter automatically generated for CSRF protection

**Validation**:

- GET /api/v1/auth/oauth/google redirects to Google login page

---

### T070: Implement Google OAuth Callback Endpoint

**Task**: Add GET /api/v1/auth/oauth/google/callback to handle OAuth response

**File**: `packages/backend/src/modules/auth/controllers/auth.controller.ts`

**Implementation**:

```typescript
@Get('oauth/google/callback')
@UseGuards(AuthGuard('google'))
async googleAuthCallback(@Req() req, @Res() res) {
  // req.user populated by GoogleStrategy.validate()
  const user = req.user;

  // Create session and JWT token
  const session = await this.sessionService.createSession(user.id, {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  const token = this.jwtService.sign({
    sub: user.id,
    sessionId: session.id
  });

  // T075: Audit log OAuth login
  await this.auditService.log({
    userId: user.id,
    action: 'OAUTH_LOGIN',
    details: { provider: 'GOOGLE' },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: true,
  });

  // Redirect to frontend with token
  res.redirect(`${this.configService.get('frontend.url')}/auth/callback?token=${token}`);
}
```

**Key Points**:

- AuthGuard('google') validates OAuth callback
- req.user contains user from GoogleStrategy.validate()
- Create session and JWT token (same as regular login)
- Audit log records OAuth login event
- Redirect to frontend with token in query string

**Validation**:

- OAuth flow completes successfully
- JWT token generated and valid
- Session created in database
- Audit log entry created

---

### T071: Implement GitHub OAuth Initiate Endpoint

**Task**: Add GET /api/v1/auth/oauth/github route to start OAuth flow

**File**: `packages/backend/src/modules/auth/controllers/auth.controller.ts`

**Implementation**:

```typescript
@Get('oauth/github')
@UseGuards(AuthGuard('github'))
githubAuth() {
  // Passport handles redirect to GitHub
}
```

**Key Points**:

- AuthGuard('github') triggers GitHubStrategy
- Identical pattern to Google OAuth initiate

**Validation**:

- GET /api/v1/auth/oauth/github redirects to GitHub login page

---

### T072: Implement GitHub OAuth Callback Endpoint

**Task**: Add GET /api/v1/auth/oauth/github/callback to handle OAuth response

**File**: `packages/backend/src/modules/auth/controllers/auth.controller.ts`

**Implementation**:

```typescript
@Get('oauth/github/callback')
@UseGuards(AuthGuard('github'))
async githubAuthCallback(@Req() req, @Res() res) {
  const user = req.user;

  const session = await this.sessionService.createSession(user.id, {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  const token = this.jwtService.sign({
    sub: user.id,
    sessionId: session.id
  });

  // T075: Audit log OAuth login
  await this.auditService.log({
    userId: user.id,
    action: 'OAUTH_LOGIN',
    details: { provider: 'GITHUB' },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: true,
  });

  res.redirect(`${this.configService.get('frontend.url')}/auth/callback?token=${token}`);
}
```

**Key Points**:

- Identical pattern to Google OAuth callback
- Audit log specifies provider: 'GITHUB'

**Validation**:

- OAuth flow completes successfully
- JWT token generated and valid
- Session created in database
- Audit log entry created

---

### T073: Handle Existing User Account Linking

**Task**: Implement logic in OAuthService.handleOAuthLogin() for existing users

**Implementation** (already included in T068):

- Check if user exists by email
- If exists: call createOrUpdateOAuthConnection()
- Update OAuthConnection if provider ID changed
- Return user object

**Edge Cases**:

- User has password + OAuth: both auth methods work
- User switches Google account: provider_user_id updated
- Multiple OAuth providers: each creates separate OAuthConnection

**Validation**:

- Existing user can log in via OAuth
- OAuthConnection created/updated in database
- User's password (if exists) remains unchanged

---

### T074: Handle New User Account Creation

**Task**: Implement logic in OAuthService.handleOAuthLogin() for new users

**Implementation** (already included in T068):

- Create User with email, name, profileImage from OAuth profile
- Set emailVerified=true (trust OAuth provider)
- Create OAuthConnection in same transaction
- No password field (OAuth-only user)

**Edge Cases**:

- OAuth user later sets password: now has both auth methods
- OAuth email changes: user must re-register (rare, provider-dependent)

**Validation**:

- New user created with emailVerified=true
- OAuthConnection created with correct provider
- User has no password (password_hash is null)

---

### T075: Add Audit Logging for OAuth Events

**Task**: Add audit logs for OAuth connection events

**Events to Log**:

- OAUTH_LOGIN: Successful OAuth login (T070, T072)
- OAUTH_CONNECTION_CREATED: New OAuthConnection linked
- OAUTH_CONNECTION_UPDATED: Provider ID updated
- OAUTH_LOGIN_FAILED: OAuth validation failed

**Implementation** (add to OAuthService):

```typescript
// In handleOAuthLogin() after user creation/linking
await this.auditService.log({
  userId: user.id,
  action:
    user.oauthConnections.length === 1
      ? 'OAUTH_CONNECTION_CREATED'
      : 'OAUTH_CONNECTION_UPDATED',
  details: {
    provider: profile.provider,
    providerId: profile.providerId,
  },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  success: true,
});
```

**Key Points**:

- OAUTH_LOGIN logged in controllers (T070, T072)
- OAUTH_CONNECTION_CREATED/UPDATED logged in OAuthService
- Include provider and providerId in audit details
- Severity: INFO for success, WARNING for failure

**Validation**:

- Audit logs created for all OAuth events
- AuditLog table contains provider details in JSONB

---

## Module Integration

**AuthModule Updates**:

Register new strategies and services in `auth.module.ts`:

```typescript
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [
    AuthService,
    PasswordService,
    SessionService,
    OAuthService, // T068
    JwtStrategy,
    GoogleStrategy, // T066
    GitHubStrategy, // T067
  ],
  controllers: [AuthController],
})
export class AuthModule {}
```

**Key Points**:

- GoogleStrategy and GitHubStrategy must be in providers array
- OAuthService injected into strategies
- Passport strategies auto-register by name

---

## Testing Strategy

**Manual Testing**:

1. Start backend server
2. Navigate to http://localhost:3000/api/v1/auth/oauth/google
3. Redirected to Google login page
4. Authorize app
5. Redirected back with token in query string
6. Verify user created in database
7. Verify OAuthConnection created
8. Verify audit log entry
9. Repeat for GitHub

**Edge Case Testing**:

- Existing user logs in via OAuth → OAuthConnection created
- OAuth user sets password → both auth methods work
- User with password logs in via OAuth → password preserved

**Error Testing**:

- Invalid OAuth callback → error message
- OAuth provider returns no email → error (email required)
- Redirect URI mismatch → 400 error

---

## Definition of Done

- [ ] T064: passport-google-oauth20, passport-github2 installed
- [ ] T065: OAuth credentials configured in .env.example and config module
- [ ] T066: GoogleStrategy implemented and registered
- [ ] T067: GitHubStrategy implemented and registered
- [ ] T068: OAuthService handles user creation and account linking
- [ ] T069: GET /oauth/google initiates OAuth flow
- [ ] T070: GET /oauth/google/callback returns JWT token
- [ ] T071: GET /oauth/github initiates OAuth flow
- [ ] T072: GET /oauth/github/callback returns JWT token
- [ ] T073: Existing user OAuth login creates/updates OAuthConnection
- [ ] T074: New user OAuth signup creates User + OAuthConnection
- [ ] T075: Audit logs record all OAuth events
- [ ] Manual testing: Google OAuth flow works end-to-end
- [ ] Manual testing: GitHub OAuth flow works end-to-end
- [ ] Code reviewed and follows NestJS + Passport best practices
- [ ] tasks.md checkboxes updated

## Risks & Reviewer Guidance

**High-Risk Areas**:

- OAuth callback handling: ensure JWT token generation is secure
- Account linking: verify existing user detection by email
- Audit logging: ensure all OAuth events are logged

**Review Checklist**:

- [ ] Passport strategies extend PassportStrategy correctly
- [ ] OAuth credentials not hardcoded (use ConfigService)
- [ ] OAuthService handles both new and existing users
- [ ] Session created after successful OAuth validation
- [ ] Audit logs include provider and providerId
- [ ] Redirect URIs validated against whitelist
- [ ] No sensitive data (access tokens) logged or stored

**Security Considerations**:

- State parameter auto-handled by Passport (CSRF protection)
- OAuth tokens not stored (only provider ID)
- Email from OAuth trusted (emailVerified=true)
- Redirect URIs must be whitelisted in config

## Review Feedback

### 검토 결과 (2025-11-08, claude, shell_pid=9940)

**상태**: **변경사항 필요 (Return to planned)**

#### 🔴 Critical Issues

1. **TypeScript 빌드 실패 (13개 오류)**

   **오류 1**: google.strategy.ts:23:5 - TS6133

   ```typescript
   // 파일: packages/backend/src/modules/auth/strategies/google.strategy.ts:23
   // 문제: refreshToken 매개변수가 선언되었지만 사용되지 않음
   async validate(
     accessToken: string,
     refreshToken: string,  // ❌ TS6133: 'refreshToken' is declared but its value is never read
     profile: Profile,
     done: VerifyCallback
   )

   // 수정 방안:
   // Option 1: 언더스코어 프리픽스로 의도적 미사용 표시
   async validate(
     accessToken: string,
     _refreshToken: string,
     profile: Profile,
     done: VerifyCallback
   )

   // Option 2: OAuthConnection에 refreshToken 저장 (추천)
   await this.oauthService.handleOAuthLogin({
     ...oauthProfile,
     accessToken,
     refreshToken,
   });
   ```

   **오류 2**: google.strategy.ts:44:18 - TS2345

   ```typescript
   // 파일: packages/backend/src/modules/auth/strategies/google.strategy.ts:44
   // 문제: Prisma User 타입이 Passport User 타입과 호환되지 않음
   const user = await this.oauthService.handleOAuthLogin(oauthProfile);
   done(null, user);  // ❌ TS2345: Type mismatch

   // 수정 방안:
   // OAuthService.handleOAuthLogin() 반환 타입 조정
   // packages/backend/src/modules/auth/services/oauth.service.ts
   async handleOAuthLogin(profile: OAuthProfile): Promise<User> {
     // Passport가 기대하는 User 인터페이스 반환
     // 또는 타입 단언 사용: done(null, user as any);
   }
   ```

   **오류 3**: request-with-user.interface.ts:1:25 - TS2307

   ```typescript
   // 파일: packages/backend/src/modules/users/interfaces/request-with-user.interface.ts:1
   // 문제: express 타입 선언이 없음
   import { Request } from 'express';  // ❌ Cannot find module 'express'

   // 수정 방안:
   // package.json에 devDependencies 추가
   {
     "devDependencies": {
       "@types/express": "^4.17.21"
     }
   }
   ```

2. **중복 파일 존재**
   - **위치**: `/src/modules/auth/services/oauth.service.ts`
   - **문제**: oauth.service.ts가 잘못된 위치에 중복 생성됨
   - **올바른 위치**: `/packages/backend/src/modules/auth/services/oauth.service.ts`
   - **조치**: `/src/modules/auth/services/oauth.service.ts` 삭제 필요

#### 🟡 Medium Issues

3. **OAuthConnection accessToken/refreshToken 미저장**
   - **파일**: packages/backend/src/modules/auth/services/oauth.service.ts
   - **Prisma Schema**: OAuthConnection 모델에 `accessToken`, `refreshToken`, `tokenExpiresAt` 필드 존재
   - **현재 상태**: OAuthService.createOrUpdateOAuthConnection()에서 토큰 필드를 저장하지 않음
   - **보안 고려사항**:
     - OAuth 토큰을 DB에 저장하지 않는 것이 보안상 더 안전할 수 있음 (의도적 미구현)
     - 하지만 Schema에 필드가 있다면 향후 사용 계획이 있는 것으로 보임
   - **권장사항**:
     ```typescript
     // packages/backend/src/modules/auth/services/oauth.service.ts
     private async createOrUpdateOAuthConnection(
       userId: string,
       provider: OAuthProvider,
       providerId: string,
       email: string,
       name: string,
       profileImage?: string,
       accessToken?: string,      // ✅ 추가
       refreshToken?: string,     // ✅ 추가
       tokenExpiresAt?: Date      // ✅ 추가
     ) {
       // ... 기존 코드에 토큰 필드 추가
       data: {
         providerId,
         email,
         accessToken,           // ✅ 저장
         refreshToken,          // ✅ 저장
         tokenExpiresAt,        // ✅ 저장
         profile: { name, profileImage },
         updatedAt: new Date(),
       }
     }
     ```

#### ✅ 완료된 작업

- **T064**: ✅ passport-google-oauth20, passport-github2 설치 완료
  - `packages/backend/package.json`에 의존성 확인됨
  - `@types/passport-google-oauth20`, `@types/passport-github2` devDependencies 확인됨

- **T065**: ✅ OAuth 자격증명 설정 완료
  - `.env.example`에 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL 추가됨
  - `.env.example`에 GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL 추가됨
  - ConfigService를 통한 환경 변수 로드 확인됨

- **T066**: ✅ GoogleStrategy 구현 및 등록 완료
  - `packages/backend/src/modules/auth/strategies/google.strategy.ts` 구현됨
  - `auth.module.ts`에 GoogleStrategy 등록 확인됨
  - PassportStrategy 상속 패턴 올바름

- **T067**: ✅ GitHubStrategy 구현 및 등록 완료
  - `packages/backend/src/modules/auth/strategies/github.strategy.ts` 구현됨
  - `auth.module.ts`에 GitHubStrategy 등록 확인됨
  - PassportStrategy 상속 패턴 올바름

- **T068**: ✅ OAuthService 사용자 생성 및 계정 연결 처리 완료
  - `packages/backend/src/modules/auth/services/oauth.service.ts` 구현됨
  - `handleOAuthLogin()`: 기존 사용자와 신규 사용자 로직 분리
  - `createOrUpdateOAuthConnection()`: OAuth 연결 생성/업데이트 로직 구현

- **T069**: ✅ GET /oauth/google 엔드포인트 구현 완료
  - `packages/backend/src/modules/auth/controllers/auth.controller.ts:184-187`
  - `@UseGuards(AuthGuard('google'))` 적용
  - Passport가 Google로 리다이렉트 처리

- **T070**: ✅ GET /oauth/google/callback 엔드포인트 구현 완료
  - `packages/backend/src/modules/auth/controllers/auth.controller.ts:189-197`
  - `@UseGuards(AuthGuard('google'))` 적용
  - JWT 토큰 생성 후 프론트엔드로 리다이렉트

- **T071**: ✅ GET /oauth/github 엔드포인트 구현 완료
  - `packages/backend/src/modules/auth/controllers/auth.controller.ts:199-202`
  - `@UseGuards(AuthGuard('github'))` 적용
  - Passport가 GitHub로 리다이렉트 처리

- **T072**: ✅ GET /oauth/github/callback 엔드포인트 구현 완료
  - `packages/backend/src/modules/auth/controllers/auth.controller.ts:204-212`
  - `@UseGuards(AuthGuard('github'))` 적용
  - JWT 토큰 생성 후 프론트엔드로 리다이렉트

- **T073**: ✅ 기존 사용자 OAuth 로그인 시 OAuthConnection 생성/업데이트 완료
  - `oauth.service.ts:30-45` 기존 사용자 로직 구현
  - 이메일로 사용자 조회 후 OAuth 연결 업데이트

- **T074**: ✅ 신규 사용자 OAuth 가입 시 User + OAuthConnection 생성 완료
  - `oauth.service.ts:46-68` 신규 사용자 로직 구현
  - Prisma nested create로 User와 OAuthConnection 동시 생성
  - `emailVerified: true` 자동 설정 (OAuth 이메일은 신뢰됨)

- **T075**: ✅ Audit 로그 기록 완료
  - `auth.service.ts:623-630` OAuth 로그인 이벤트 기록
  - `action: 'OAUTH_LOGIN'`, `severity: 'INFO'`
  - Provider 정보 metadata에 포함

#### 📋 통계

- **완료**: 12/12 subtasks (100%)
- **파일 생성**: 3개 (google.strategy.ts, github.strategy.ts, oauth.service.ts)
- **파일 수정**: 3개 (auth.controller.ts, auth.service.ts, auth.module.ts)
- **빌드 상태**: ❌ 실패 (13개 TypeScript 오류)

#### 🔧 수정 필요 사항 요약

1. **google.strategy.ts**: refreshToken 매개변수 처리 (언더스코어 또는 저장 로직 추가)
2. **google.strategy.ts**: Passport User 타입 호환성 수정
3. **package.json**: `@types/express` devDependency 추가
4. **중복 파일 삭제**: `/src/modules/auth/services/oauth.service.ts` 제거
5. **(선택) oauth.service.ts**: accessToken/refreshToken 저장 로직 추가 (보안 요구사항 확인 후)

#### ✅ 잘된 점

- NestJS + Passport.js 아키텍처 패턴 정확하게 적용
- Google과 GitHub 전략 구현이 일관된 패턴 유지
- OAuthService의 신규/기존 사용자 로직 분리가 명확함
- Audit 로깅 적절히 구현됨
- 환경 변수를 통한 설정 관리 올바름
- Session 생성 및 JWT 토큰 발급 로직 적절함

## Activity Log

- 2025-11-06T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
- 2025-11-08T00:00:00Z – claude – lane=planned – Updated to NestJS + Passport.js implementation with detailed guidance
- 2025-11-08T08:42:39Z – claude – shell_pid=48323 – lane=doing – Started OAuth implementation
- 2025-11-08T09:30:00Z – claude – shell_pid=48323 – lane=for_review – Implementation completed, ready for review
- 2025-11-08T10:15:00Z – claude – shell_pid=9940 – lane=for_review → planned – Build errors detected, returned to planned for fixes
- 2025-11-08T09:05:52Z – claude – shell_pid=9940 – lane=planned – Build errors - TypeScript compilation failed (13 errors). Requires fixes: refreshToken parameter, Passport User type, @types/express, duplicate file removal
