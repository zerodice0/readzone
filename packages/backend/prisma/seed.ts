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
  await prisma.bookmark.deleteMany();
  await prisma.like.deleteMany();
  await prisma.review.deleteMany();
  await prisma.book.deleteMany();
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

  // Create books
  const books = await Promise.all([
    prisma.book.create({
      data: {
        isbn: '9788936433598',
        title: '채식주의자',
        author: '한강',
        publisher: '창비',
        publishedDate: new Date('2007-10-30'),
        coverImageUrl:
          'https://image.aladin.co.kr/product/43/35/cover500/8936433598_1.jpg',
        description:
          '채식주의자는 한강의 장편소설이다. 세 부로 나뉘어 있으며, 각 부는 다른 화자의 시점에서 서술된다.',
        pageCount: 192,
        language: 'ko',
        externalSource: ExternalSource.ALADIN,
        externalId: 'K432433598',
      },
    }),
    prisma.book.create({
      data: {
        isbn: '9788932917245',
        title: '아몬드',
        author: '손원평',
        publisher: '창비',
        publishedDate: new Date('2017-03-30'),
        coverImageUrl:
          'https://image.aladin.co.kr/product/11/72/cover500/8932917248_1.jpg',
        description:
          '감정을 느끼지 못하는 소년 윤재의 성장 이야기. 따뜻하고 섬세한 문체로 인간 존재의 근원적 외로움과 소통의 가능성을 탐색한다.',
        pageCount: 264,
        language: 'ko',
        externalSource: ExternalSource.ALADIN,
        externalId: 'K292917245',
      },
    }),
    prisma.book.create({
      data: {
        isbn: '9788936434120',
        title: '소년이 온다',
        author: '한강',
        publisher: '창비',
        publishedDate: new Date('2014-05-19'),
        coverImageUrl:
          'https://image.aladin.co.kr/product/43/41/cover500/8936434128_1.jpg',
        description:
          '1980년 5월 광주를 배경으로 한 소설. 광주민주화운동의 참혹함을 생생하게 그려내며, 역사적 사건의 의미를 다시 생각하게 한다.',
        pageCount: 216,
        language: 'ko',
        externalSource: ExternalSource.ALADIN,
        externalId: 'K432434120',
      },
    }),
    prisma.book.create({
      data: {
        isbn: '9788954654715',
        title: '달러구트 꿈 백화점',
        author: '이미예',
        publisher: '팩토리나인',
        publishedDate: new Date('2020-07-08'),
        coverImageUrl:
          'https://image.aladin.co.kr/product/24/88/cover500/8954654711_1.jpg',
        description:
          '꿈을 사고파는 신비한 백화점 이야기. 따뜻하고 위로가 되는 판타지 소설로, 많은 독자들에게 사랑받았다.',
        pageCount: 312,
        language: 'ko',
        externalSource: ExternalSource.ALADIN,
        externalId: 'K292654715',
      },
    }),
  ]);

  console.log(`✅ Created ${books.length} books`);

  // Create reviews
  const reviews = await Promise.all([
    // Book 1: 채식주의자 - 3 reviews
    prisma.review.create({
      data: {
        userId: users[3].id, // Regular user
        bookId: books[0].id,
        title: '충격적이고 아름다운 이야기',
        content:
          '한강 작가의 문체는 정말 독특하다. 채식주의자라는 주제를 통해 인간의 근원적인 욕망과 억압을 탐구한다. 영혜라는 캐릭터가 매우 인상적이었고, 그녀의 선택이 주변 사람들에게 미치는 영향이 섬뜩하면서도 아름다웠다. 한국 문학의 저력을 보여주는 작품이라고 생각한다.',
        rating: 5,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: new Date('2024-11-01T10:30:00Z'),
      },
    }),
    prisma.review.create({
      data: {
        userId: users[4].id, // OAuth user
        bookId: books[0].id,
        title: '독특하지만 난해함',
        content:
          '채식주의자는 확실히 특별한 작품이다. 하지만 나에게는 너무 난해하고 답답했다. 인물들의 행동과 심리를 이해하기 어려웠고, 전체적으로 어두운 분위기가 불편했다. 문학적 가치는 인정하지만 개인적으로는 별로였다.',
        rating: 2,
        isRecommended: false,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: new Date('2024-10-28T14:20:00Z'),
      },
    }),
    prisma.review.create({
      data: {
        userId: users[2].id, // Moderator
        bookId: books[0].id,
        content:
          '한강 작가의 채식주의자를 읽고 나서 머릿속이 복잡하다. 영혜의 극단적인 선택과 그로 인한 파장이 인상적이었다. 특히 3부 구조로 각기 다른 시점에서 이야기를 풀어가는 방식이 참신했다.',
        rating: 4,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: new Date('2024-10-25T09:15:00Z'),
      },
    }),

    // Book 2: 아몬드 - 4 reviews
    prisma.review.create({
      data: {
        userId: users[3].id,
        bookId: books[1].id,
        title: '따뜻한 성장소설',
        content:
          '아몬드는 정말 따뜻한 소설이다. 감정을 느끼지 못하는 윤재가 곤이를 만나면서 점차 변화하는 과정이 감동적이었다. 특히 윤재가 처음으로 분노를 느끼는 장면은 가슴이 뭉클했다. 청소년은 물론 성인들도 충분히 공감할 수 있는 보편적인 주제를 다룬다.',
        rating: 5,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: new Date('2024-11-03T16:40:00Z'),
      },
    }),
    prisma.review.create({
      data: {
        userId: users[5].id,
        bookId: books[1].id,
        title: '청소년 성장소설의 정석',
        content:
          '아몬드를 읽으면서 학창 시절이 떠올랐다. 윤재와 곤이의 우정이 특히 인상적이었고, 두 인물의 대비가 명확해서 이야기가 더 흥미로웠다. 다만 후반부가 조금 빠르게 전개되어 아쉬웠다.',
        rating: 4,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: new Date('2024-11-02T11:25:00Z'),
      },
    }),
    prisma.review.create({
      data: {
        userId: users[1].id, // Admin
        bookId: books[1].id,
        content:
          '아몬드는 청소년 문학의 새로운 가능성을 보여준다. 감정을 느끼지 못하는 소년이라는 독특한 설정과 따뜻한 결말이 인상적이다.',
        rating: 4,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: new Date('2024-10-30T08:00:00Z'),
      },
    }),
    prisma.review.create({
      data: {
        userId: users[6].id, // Unverified user
        bookId: books[1].id,
        title: '기대 이하',
        content:
          '많은 사람들이 추천해서 읽었는데, 기대에 못 미쳤다. 설정은 흥미로웠지만 전개가 예측 가능하고 캐릭터가 평면적으로 느껴졌다.',
        rating: 2,
        isRecommended: false,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: new Date('2024-10-27T13:50:00Z'),
      },
    }),

    // Book 3: 소년이 온다 - 2 reviews
    prisma.review.create({
      data: {
        userId: users[3].id,
        bookId: books[2].id,
        title: '잊지 말아야 할 역사',
        content:
          '소년이 온다를 읽으면서 많이 울었다. 5·18 광주민주화운동의 참혹함을 생생하게 느낄 수 있었다. 한강 작가의 문체가 슬픔을 더욱 깊이 있게 전달한다. 이 소설을 통해 역사를 다시 생각하게 되었고, 절대 잊지 말아야 할 일이라는 것을 깨달았다.',
        rating: 5,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: new Date('2024-11-04T15:10:00Z'),
      },
    }),
    prisma.review.create({
      data: {
        userId: users[2].id,
        bookId: books[2].id,
        content:
          '소년이 온다는 무겁고 슬픈 이야기지만 반드시 읽어야 할 소설이다. 5·18의 참상을 직접 목격한 듯한 생생함이 가슴을 먹먹하게 한다.',
        rating: 5,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: new Date('2024-10-29T10:30:00Z'),
      },
    }),

    // Book 4: 달러구트 꿈 백화점 - 1 review
    prisma.review.create({
      data: {
        userId: users[4].id,
        bookId: books[3].id,
        title: '따뜻하고 위로되는 이야기',
        content:
          '달러구트 꿈 백화점은 정말 독특한 설정의 소설이다. 꿈을 사고파는 백화점이라는 아이디어가 신선했고, 각 에피소드마다 담긴 메시지가 따뜻했다. 힘들고 지친 날에 읽기 좋은 힐링 소설이다.',
        rating: 4,
        isRecommended: true,
        readStatus: ReadStatus.COMPLETED,
        status: ReviewStatus.PUBLISHED,
        publishedAt: new Date('2024-11-05T12:00:00Z'),
      },
    }),
  ]);

  console.log(`✅ Created ${reviews.length} reviews`);

  // Create likes and bookmarks
  await Promise.all([
    // Likes for reviews
    prisma.like.create({
      data: {
        userId: users[4].id,
        reviewId: reviews[0].id,
      },
    }),
    prisma.like.create({
      data: {
        userId: users[5].id,
        reviewId: reviews[0].id,
      },
    }),
    prisma.like.create({
      data: {
        userId: users[2].id,
        reviewId: reviews[3].id,
      },
    }),

    // Bookmarks for reviews
    prisma.bookmark.create({
      data: {
        userId: users[3].id,
        reviewId: reviews[8].id,
      },
    }),
    prisma.bookmark.create({
      data: {
        userId: users[4].id,
        reviewId: reviews[3].id,
      },
    }),
  ]);

  // Update review likeCount based on actual likes
  await prisma.review.update({
    where: { id: reviews[0].id },
    data: { likeCount: 2 },
  });
  await prisma.review.update({
    where: { id: reviews[3].id },
    data: { likeCount: 1, bookmarkCount: 1 },
  });
  await prisma.review.update({
    where: { id: reviews[8].id },
    data: { bookmarkCount: 1 },
  });

  console.log('✅ Created likes and bookmarks');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Seed Summary:');
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Roles: SUPERADMIN(1), ADMIN(1), MODERATOR(1), USER(5)`);
  console.log(`   - OAuth: Google(1), GitHub(1)`);
  console.log(`   - MFA Enabled: 1`);
  console.log(`   - Active Sessions: 2`);
  console.log(`   - Audit Logs: 5`);
  console.log(`   - Books: ${books.length}`);
  console.log(`   - Reviews: ${reviews.length}`);
  console.log(`   - Likes: 3`);
  console.log(`   - Bookmarks: 2`);
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
