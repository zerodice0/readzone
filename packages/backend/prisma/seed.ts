/* eslint-disable no-console, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await, @typescript-eslint/no-misused-promises */

import {
  PrismaClient,
  UserRole,
  UserStatus,
  OAuthProvider,
  AuditAction,
  AuditSeverity,
  ExternalSource,
  ReadStatus,
  ReviewStatus,
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
  await prisma.bookmark.deleteMany();
  await prisma.like.deleteMany();
  await prisma.review.deleteMany();
  await prisma.book.deleteMany();
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

  // Create sample books (Feature: 002-feature)
  const books = await Promise.all([
    prisma.book.create({
      data: {
        isbn: '9788936433598',
        title: '채식주의자',
        author: '한강',
        publisher: '창비',
        publishedDate: new Date('2007-10-30'),
        coverImageUrl:
          'https://image.aladin.co.kr/product/43/35/cover150/8936433598_1.jpg',
        description:
          '채식주의자는 한강의 장편소설이다. 맨부커 인터내셔널상을 수상한 작품으로, 육식을 거부하는 한 여성의 이야기를 통해 인간 내면의 폭력성과 억압을 탐구한다.',
        pageCount: 192,
        language: 'ko',
        externalSource: ExternalSource.ALADIN,
        externalId: 'K432433598',
      },
    }),
    prisma.book.create({
      data: {
        isbn: '9788954609142',
        title: '달러구트 꿈 백화점',
        author: '이미예',
        publisher: '팩토리나인',
        publishedDate: new Date('2020-07-10'),
        coverImageUrl:
          'https://image.aladin.co.kr/product/24/31/cover150/8954609147_1.jpg',
        description:
          '우연히 꿈 백화점에 들어가게 된 주인공 페니의 성장 이야기. 다양한 꿈들이 판매되는 신비로운 백화점을 배경으로 한 따뜻한 판타지 소설.',
        pageCount: 304,
        language: 'ko',
        externalSource: ExternalSource.ALADIN,
        externalId: 'K546091424',
      },
    }),
    prisma.book.create({
      data: {
        isbn: '9788954675642',
        title: '파친코',
        author: '이민진',
        publisher: '문학사상',
        publishedDate: new Date('2018-03-15'),
        coverImageUrl:
          'https://image.aladin.co.kr/product/13/67/cover150/8954675646_1.jpg',
        description:
          '일제강점기부터 1980년대까지 재일 한국인 가족 4대의 이야기를 그린 대하소설. 뉴욕타임스 베스트셀러에 오른 작품.',
        pageCount: 764,
        language: 'ko',
        externalSource: ExternalSource.ALADIN,
        externalId: 'K546756424',
      },
    }),
    prisma.book.create({
      data: {
        isbn: '9788936434267',
        title: '작별하지 않는다',
        author: '한강',
        publisher: '창비',
        publishedDate: new Date('2021-11-15'),
        coverImageUrl:
          'https://image.aladin.co.kr/product/27/84/cover150/8936434268_1.jpg',
        description:
          '한강 작가의 장편소설. 상실과 애도, 그리고 재생에 관한 이야기.',
        pageCount: 224,
        language: 'ko',
        externalSource: ExternalSource.ALADIN,
        externalId: 'K432434267',
      },
    }),
  ]);

  console.log(`✅ Created ${books.length} sample books`);

  // Create sample reviews (Feature: 002-feature)
  const reviewNow = new Date();
  const oneDayAgo = new Date(reviewNow.getTime() - 1 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(reviewNow.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(reviewNow.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(reviewNow.getTime() - 7 * 24 * 60 * 60 * 1000);

  const reviews = await Promise.all([
    // Reviews for 채식주의자
    prisma.review.create({
      data: {
        userId: users[3].id, // Regular user
        bookId: books[0].id,
        title: '충격적이고 아름다운 이야기',
        content:
          '한강 작가의 문체는 정말 독특하다. 채식주의자라는 주제를 통해 인간 내면의 폭력성과 억압을 다루는 방식이 인상적이었다. 처음엔 이해하기 어려웠지만, 읽고 나서 한참을 생각하게 만드는 작품이다.',
        rating: 5,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: threeDaysAgo,
        likeCount: 15,
        bookmarkCount: 8,
        viewCount: 142,
      },
    }),
    prisma.review.create({
      data: {
        userId: users[1].id, // Admin
        bookId: books[0].id,
        title: '무거운 주제, 깊은 울림',
        content:
          '맨부커상을 받은 이유를 알 것 같다. 여성의 신체와 자유의지에 대한 깊은 성찰을 담고 있다.',
        rating: 4,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: oneWeekAgo,
        likeCount: 8,
        bookmarkCount: 3,
        viewCount: 89,
      },
    }),

    // Reviews for 달러구트 꿈 백화점
    prisma.review.create({
      data: {
        userId: users[4].id, // OAuth user
        bookId: books[1].id,
        title: '따뜻하고 위로가 되는 이야기',
        content:
          '독특한 설정의 판타지 소설. 꿈을 파는 백화점이라는 아이디어가 신선했고, 각각의 에피소드마다 감동이 있었다. 힘들 때 읽으면 위로받을 수 있는 책.',
        rating: 5,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: twoDaysAgo,
        likeCount: 23,
        bookmarkCount: 12,
        viewCount: 201,
      },
    }),
    prisma.review.create({
      data: {
        userId: users[2].id, // Moderator
        bookId: books[1].id,
        title: '가볍게 읽기 좋은 판타지',
        content:
          '출퇴근길에 읽기 좋았다. 무겁지 않으면서도 생각할 거리를 주는 소설이다.',
        rating: 4,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: oneDayAgo,
        likeCount: 7,
        bookmarkCount: 4,
        viewCount: 67,
      },
    }),

    // Reviews for 파친코
    prisma.review.create({
      data: {
        userId: users[3].id, // Regular user
        bookId: books[2].id,
        title: '재일 한국인의 삶을 그린 대서사시',
        content:
          '4대에 걸친 가족사를 통해 역사의 무게를 느낄 수 있었다. 700페이지가 넘는 분량이지만 지루하지 않았고, 각 인물들의 삶이 생생하게 그려져 있다. 다만 번역이 조금 아쉬운 부분도 있었다.',
        rating: 5,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: oneWeekAgo,
        likeCount: 31,
        bookmarkCount: 18,
        viewCount: 287,
      },
    }),
    prisma.review.create({
      data: {
        userId: users[5].id, // GitHub OAuth user
        bookId: books[2].id,
        content:
          '분량이 길어서 중간에 포기할 뻔했지만, 끝까지 읽길 잘했다. 역사 속 개인의 삶이 어떻게 펼쳐지는지 잘 보여주는 작품. 특히 후반부가 감동적이었다.',
        rating: 4,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: twoDaysAgo,
        likeCount: 12,
        bookmarkCount: 6,
        viewCount: 124,
      },
    }),

    // Reviews for 작별하지 않는다
    prisma.review.create({
      data: {
        userId: users[1].id, // Admin
        bookId: books[3].id,
        title: '상실과 재생에 대한 깊은 성찰',
        content:
          '한강 작가 특유의 시적인 문체로 죽음과 상실, 그리고 다시 살아가는 것에 대해 이야기한다. 느린 호흡으로 읽어야 하는 책.',
        rating: 5,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: oneDayAgo,
        likeCount: 19,
        bookmarkCount: 11,
        viewCount: 156,
      },
    }),
    prisma.review.create({
      data: {
        userId: users[4].id, // OAuth user
        bookId: books[3].id,
        title: '아름답지만 무거운 이야기',
        content:
          '한강 작가의 작품은 항상 읽고 나면 여운이 길게 남는다. 이 작품도 마찬가지였다.',
        rating: 4,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: threeDaysAgo,
        likeCount: 9,
        bookmarkCount: 5,
        viewCount: 78,
      },
    }),

    // Reading status variations
    prisma.review.create({
      data: {
        userId: users[2].id, // Moderator
        bookId: books[2].id,
        title: '읽는 중이지만 매우 흥미롭다',
        content:
          '아직 절반 정도밖에 못 읽었지만 벌써부터 몰입도가 높다. 재일 한국인의 역사를 이렇게 디테일하게 다룬 소설은 처음 본다.',
        rating: null,
        isRecommended: true,
        readStatus: ReadStatus.READING,
        status: ReviewStatus.PUBLISHED,
        publishedAt: oneDayAgo,
        likeCount: 3,
        bookmarkCount: 1,
        viewCount: 34,
      },
    }),

    // Not recommended review
    prisma.review.create({
      data: {
        userId: users[3].id, // Regular user
        bookId: books[1].id,
        title: '기대에 못 미쳤다',
        content:
          '많은 사람들이 추천해서 읽어봤는데, 개인적으로는 조금 아쉬웠다. 설정은 참신했지만 스토리 전개가 너무 예측 가능했고, 캐릭터들의 깊이가 부족한 느낌이었다. 가볍게 읽기에는 좋지만 큰 감동은 없었다.',
        rating: 2,
        isRecommended: false,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: oneDayAgo,
        likeCount: 4,
        bookmarkCount: 1,
        viewCount: 52,
      },
    }),

    // Draft review (not published)
    prisma.review.create({
      data: {
        userId: users[3].id, // Regular user
        bookId: books[3].id,
        title: '임시 저장',
        content: '아직 작성 중...',
        rating: null,
        isRecommended: true,
        readStatus: ReadStatus.READING,
        status: ReviewStatus.DRAFT,
        publishedAt: null,
        likeCount: 0,
        bookmarkCount: 0,
        viewCount: 0,
      },
    }),
  ]);

  console.log(`✅ Created ${reviews.length} sample reviews`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Seed Summary:');
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Roles: SUPERADMIN(1), ADMIN(1), MODERATOR(1), USER(5)`);
  console.log(`   - OAuth: Google(1), GitHub(1)`);
  console.log(`   - MFA Enabled: 1`);
  console.log(`   - Active Sessions: 2`);
  console.log(`   - Audit Logs: 5`);
  console.log(`   - Books: ${books.length}`);
  console.log(
    `   - Reviews: ${reviews.length} (Published: ${reviews.filter((r) => r.status === ReviewStatus.PUBLISHED).length}, Draft: ${reviews.filter((r) => r.status === ReviewStatus.DRAFT).length})`
  );
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
