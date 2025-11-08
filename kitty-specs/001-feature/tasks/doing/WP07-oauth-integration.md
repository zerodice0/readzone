---
work_package_id: 'WP07'
title: 'OAuth Integration (Google & GitHub)'
phase: 'Phase 3 - Advanced Features'
lane: 'doing'
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
shell_pid: '48323'
history:
  - timestamp: '2025-11-06T00:00:00Z'
    lane: 'planned'
    agent: 'system'
    action: 'Prompt generated via /spec-kitty.tasks'
  - timestamp: '2025-11-08T00:00:00Z'
    lane: 'planned'
    agent: 'claude'
    action: 'Updated to NestJS + Passport.js strategy-based implementation'
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

## Activity Log

- 2025-11-06T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
- 2025-11-08T00:00:00Z – claude – lane=planned – Updated to NestJS + Passport.js implementation with detailed guidance
- 2025-11-08T08:42:39Z – claude – shell_pid=48323 – lane=doing – Started OAuth implementation
