/* eslint-disable no-console, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await, @typescript-eslint/no-misused-promises */

import {
  PrismaClient,
  UserRole,
  UserStatus,
  OAuthProvider,
  AuditAction,
  AuditSeverity,
} from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Seed script for ReadZone User Authentication System
 * Creates test users with different roles and authentication methods
 *
 * NOTE: This is a development/testing seed script.
 * Console statements and type safety relaxations are intentional.
 */

async function generatePasswordHash(password: string): Promise<string> {
  // Placeholder: In production, use argon2id
  // For now, just return a mock hash for testing
  return `hashed_${password}_${crypto.randomBytes(16).toString('hex')}`;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.passwordResetToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.mFASettings.deleteMany();
  await prisma.oAuthConnection.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create test users with different roles
  const users = await Promise.all([
    // 1. Super Admin (email + MFA enabled)
    prisma.user.create({
      data: {
        email: 'admin@readzone.com',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        passwordHash: await generatePasswordHash('Admin123!'),
        name: '시스템 관리자',
        role: UserRole.SUPERADMIN,
        status: UserStatus.ACTIVE,
        mfaEnabled: true,
        lastLoginAt: new Date(),
        lastLoginIp: '127.0.0.1',
      },
    }),

    // 2. Regular Admin (email only)
    prisma.user.create({
      data: {
        email: 'admin2@readzone.com',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        passwordHash: await generatePasswordHash('Admin456!'),
        name: '일반 관리자',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
    }),

    // 3. Moderator (email verified)
    prisma.user.create({
      data: {
        email: 'moderator@readzone.com',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        passwordHash: await generatePasswordHash('Mod123!'),
        name: '모더레이터',
        role: UserRole.MODERATOR,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
    }),

    // 4. Regular User (email verified, with profile image)
    prisma.user.create({
      data: {
        email: 'user@readzone.com',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        passwordHash: await generatePasswordHash('User123!'),
        name: '일반 사용자',
        profileImage: 'https://i.pravatar.cc/150?u=user@readzone.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
    }),

    // 5. OAuth User (Google, no password)
    prisma.user.create({
      data: {
        email: 'oauth.google@readzone.com',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        passwordHash: null, // OAuth-only account
        name: 'Google OAuth 사용자',
        profileImage: 'https://lh3.googleusercontent.com/a/default-user',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
    }),

    // 6. OAuth User (GitHub, no password)
    prisma.user.create({
      data: {
        email: 'oauth.github@readzone.com',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        passwordHash: null, // OAuth-only account
        name: 'GitHub OAuth 사용자',
        profileImage: 'https://avatars.githubusercontent.com/u/12345?v=4',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
    }),

    // 7. Unverified User (email not verified)
    prisma.user.create({
      data: {
        email: 'unverified@readzone.com',
        emailVerified: false,
        emailVerifiedAt: null,
        passwordHash: await generatePasswordHash('Unverified123!'),
        name: '미인증 사용자',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
      },
    }),

    // 8. Suspended User
    prisma.user.create({
      data: {
        email: 'suspended@readzone.com',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        passwordHash: await generatePasswordHash('Suspended123!'),
        name: '정지된 사용자',
        role: UserRole.USER,
        status: UserStatus.SUSPENDED,
        mfaEnabled: false,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} test users`);

  // Create MFA settings for admin user
  await prisma.mFASettings.create({
    data: {
      userId: users[0].id, // Super admin
      enabled: true,
      secret: crypto.randomBytes(20).toString('base64'), // Mock TOTP secret
      backupCodes: Array.from({ length: 10 }, () =>
        crypto.createHash('sha256').update(crypto.randomBytes(16)).digest('hex')
      ),
      verifiedAt: new Date(),
    },
  });

  console.log('✅ Created MFA settings for super admin');

  // Create OAuth connections
  await Promise.all([
    prisma.oAuthConnection.create({
      data: {
        userId: users[4].id, // Google OAuth user
        provider: OAuthProvider.GOOGLE,
        providerId: '12345678901234567890',
        email: 'oauth.google@readzone.com',
        profile: {
          name: 'Google OAuth 사용자',
          picture: 'https://lh3.googleusercontent.com/a/default-user',
          locale: 'ko',
        },
      },
    }),
    prisma.oAuthConnection.create({
      data: {
        userId: users[5].id, // GitHub OAuth user
        provider: OAuthProvider.GITHUB,
        providerId: '12345',
        email: 'oauth.github@readzone.com',
        profile: {
          name: 'GitHub OAuth 사용자',
          avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4',
          bio: 'Test GitHub user',
        },
      },
    }),
  ]);

  console.log('✅ Created OAuth connections');

  // Create active sessions for some users
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.session.create({
      data: {
        userId: users[0].id, // Super admin
        expiresAt: tomorrow,
        ipAddress: '127.0.0.1',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        deviceInfo: {
          browser: 'Chrome',
          os: 'macOS',
          device: 'Desktop',
        },
        isActive: true,
      },
    }),
    prisma.session.create({
      data: {
        userId: users[3].id, // Regular user
        expiresAt: thirtyDays,
        refreshExpiresAt: thirtyDays,
        ipAddress: '192.168.1.100',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
        deviceInfo: {
          browser: 'Safari',
          os: 'iOS',
          device: 'Mobile',
        },
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Created active sessions');

  // Create email verification token for unverified user
  const verificationExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await prisma.emailVerificationToken.create({
    data: {
      userId: users[6].id, // Unverified user
      token: generateToken(),
      expiresAt: verificationExpiry,
    },
  });

  console.log('✅ Created email verification token');

  // Create audit logs for various events
  await Promise.all([
    prisma.auditLog.create({
      data: {
        userId: users[0].id,
        action: AuditAction.LOGIN,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        metadata: { method: 'email_password', mfa: true },
        severity: AuditSeverity.INFO,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: users[0].id,
        action: AuditAction.MFA_ENABLE,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        metadata: { method: 'totp' },
        severity: AuditSeverity.CRITICAL,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: users[3].id,
        action: AuditAction.LOGIN,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
        metadata: { method: 'email_password', remember_me: true },
        severity: AuditSeverity.INFO,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: users[7].id,
        action: AuditAction.ACCOUNT_SUSPEND,
        ipAddress: '10.0.0.1',
        userAgent: 'ReadZone Admin Tool',
        metadata: {
          reason: 'Spam activity detected',
          suspended_by: users[0].id,
        },
        severity: AuditSeverity.CRITICAL,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: null, // Failed login (pre-auth)
        action: AuditAction.LOGIN_FAILED,
        ipAddress: '203.0.113.42',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        metadata: {
          email: 'unknown@example.com',
          reason: 'invalid_credentials',
        },
        severity: AuditSeverity.WARNING,
      },
    }),
  ]);

  console.log('✅ Created audit logs');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Seed Summary:');
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Roles: SUPERADMIN(1), ADMIN(1), MODERATOR(1), USER(5)`);
  console.log(`   - OAuth: Google(1), GitHub(1)`);
  console.log(`   - MFA Enabled: 1`);
  console.log(`   - Active Sessions: 2`);
  console.log(`   - Audit Logs: 5`);
  console.log('\n🔑 Test Credentials:');
  console.log('   admin@readzone.com / Admin123! (SUPERADMIN, MFA enabled)');
  console.log('   admin2@readzone.com / Admin456! (ADMIN)');
  console.log('   moderator@readzone.com / Mod123! (MODERATOR)');
  console.log('   user@readzone.com / User123! (USER)');
  console.log(
    '   unverified@readzone.com / Unverified123! (USER, email not verified)'
  );
}

main()
  .catch((error: Error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
