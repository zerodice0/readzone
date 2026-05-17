import { v } from 'convex/values';
import {
  query,
  mutation,
  internalMutation,
  type MutationCtx,
} from './_generated/server';

const MEMBER_NUMBER_COUNTER_NAME = 'users.memberNumber';
const MEMBER_NUMBER_MIGRATION_ADMIN_IDS_ENV =
  'MEMBER_NUMBER_MIGRATION_ADMIN_IDS';

function getMigrationAdminIds() {
  return (process.env[MEMBER_NUMBER_MIGRATION_ADMIN_IDS_ENV] ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

async function assertMigrationPermission(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const adminIds = getMigrationAdminIds();

  if (!identity || !adminIds.includes(identity.subject)) {
    throw new Error('Unauthorized: Member number migration is restricted');
  }
}

async function getMemberNumberCounter(ctx: MutationCtx) {
  return await ctx.db
    .query('counters')
    .withIndex('by_name', (q) => q.eq('name', MEMBER_NUMBER_COUNTER_NAME))
    .unique();
}

async function getNextInitialMemberNumber(ctx: MutationCtx) {
  const users = await ctx.db.query('users').collect();
  const maxMemberNumber = users.reduce(
    (maxNumber, user) => Math.max(maxNumber, user.memberNumber ?? 0),
    0
  );

  return Math.max(maxMemberNumber, users.length) + 1;
}

async function ensureMemberNumberCounterAtLeast(
  ctx: MutationCtx,
  value: number
) {
  const counter = await getMemberNumberCounter(ctx);
  const now = Date.now();

  if (!counter) {
    await ctx.db.insert('counters', {
      name: MEMBER_NUMBER_COUNTER_NAME,
      value,
      updatedAt: now,
    });
    return;
  }

  if (counter.value < value) {
    await ctx.db.patch(counter._id, {
      value,
      updatedAt: now,
    });
  }
}

async function claimNextMemberNumber(ctx: MutationCtx) {
  const counter = await getMemberNumberCounter(ctx);
  const now = Date.now();

  if (!counter) {
    const nextMemberNumber = await getNextInitialMemberNumber(ctx);

    await ctx.db.insert('counters', {
      name: MEMBER_NUMBER_COUNTER_NAME,
      value: nextMemberNumber,
      updatedAt: now,
    });

    return nextMemberNumber;
  }

  const nextMemberNumber = counter.value + 1;

  await ctx.db.patch(counter._id, {
    value: nextMemberNumber,
    updatedAt: now,
  });

  return nextMemberNumber;
}

async function backfillMissingMemberNumbers(
  ctx: MutationCtx,
  batchSize: number
) {
  const users = await ctx.db.query('users').order('asc').collect();
  const missingUsers = users.filter((user) => user.memberNumber === undefined);
  const assignedNumbers = new Set<number>();
  let maxMemberNumber = 0;
  let nextCandidate = 1;
  let assigned = 0;

  for (const user of users) {
    if (user.memberNumber !== undefined) {
      assignedNumbers.add(user.memberNumber);
      maxMemberNumber = Math.max(maxMemberNumber, user.memberNumber);
    }
  }

  const claimLowestAvailableMemberNumber = () => {
    while (assignedNumbers.has(nextCandidate)) {
      nextCandidate += 1;
    }

    const memberNumber = nextCandidate;
    assignedNumbers.add(memberNumber);
    maxMemberNumber = Math.max(maxMemberNumber, memberNumber);
    nextCandidate += 1;

    return memberNumber;
  };

  for (const user of missingUsers.slice(0, batchSize)) {
    const memberNumber = claimLowestAvailableMemberNumber();

    await ctx.db.patch(user._id, {
      memberNumber,
      updatedAt: Date.now(),
    });
    assigned += 1;
  }

  if (assigned > 0) {
    await ensureMemberNumberCounterAtLeast(ctx, maxMemberNumber);
  }

  return {
    totalUsers: users.length,
    missingBefore: missingUsers.length,
    assigned,
    remaining: missingUsers.length - assigned,
    nextMemberNumber: maxMemberNumber + 1,
  };
}

async function clearStoredDisplayNames(ctx: MutationCtx, batchSize: number) {
  const users = await ctx.db.query('users').order('asc').collect();
  const usersWithName = users.filter((user) => user.name !== undefined);
  let cleared = 0;

  for (const user of usersWithName.slice(0, batchSize)) {
    await ctx.db.patch(user._id, {
      name: undefined,
      updatedAt: Date.now(),
    });
    cleared += 1;
  }

  return {
    totalUsers: users.length,
    withNameBefore: usersWithName.length,
    cleared,
    remaining: usersWithName.length - cleared,
  };
}

function normalizeDisplayName(displayName: string | undefined) {
  return displayName?.trim() || undefined;
}

async function migrateLegacyDataByEmail(
  ctx: MutationCtx,
  email: string,
  currentClerkUserId: string
) {
  const usersWithSameEmail = await ctx.db.query('users').collect();
  const legacyUsers = usersWithSameEmail.filter(
    (user) => user.email === email && user.clerkUserId !== currentClerkUserId
  );

  for (const legacyUser of legacyUsers) {
    const legacyUserId = legacyUser.clerkUserId;

    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_user', (q) => q.eq('userId', legacyUserId))
      .collect();

    for (const review of reviews) {
      const existingReview = await ctx.db
        .query('reviews')
        .withIndex('by_user_book', (q) =>
          q.eq('userId', currentClerkUserId).eq('bookId', review.bookId)
        )
        .first();

      if (!existingReview) {
        await ctx.db.patch(review._id, { userId: currentClerkUserId });
      }
    }

    const diaries = await ctx.db
      .query('readingDiaries')
      .withIndex('by_user', (q) => q.eq('userId', legacyUserId))
      .collect();

    for (const diary of diaries) {
      await ctx.db.patch(diary._id, { userId: currentClerkUserId });
    }

    const likes = await ctx.db
      .query('likes')
      .withIndex('by_user', (q) => q.eq('userId', legacyUserId))
      .collect();

    for (const like of likes) {
      const existingLike = await ctx.db
        .query('likes')
        .withIndex('by_user_review', (q) =>
          q.eq('userId', currentClerkUserId).eq('reviewId', like.reviewId)
        )
        .unique();

      if (existingLike) {
        await ctx.db.delete(like._id);
      } else {
        await ctx.db.patch(like._id, { userId: currentClerkUserId });
      }
    }

    const bookmarks = await ctx.db
      .query('bookmarks')
      .withIndex('by_user', (q) => q.eq('userId', legacyUserId))
      .collect();

    for (const bookmark of bookmarks) {
      const existingBookmark = await ctx.db
        .query('bookmarks')
        .withIndex('by_user_review', (q) =>
          q.eq('userId', currentClerkUserId).eq('reviewId', bookmark.reviewId)
        )
        .unique();

      if (existingBookmark) {
        await ctx.db.delete(bookmark._id);
      } else {
        await ctx.db.patch(bookmark._id, { userId: currentClerkUserId });
      }
    }
  }
}

/**
 * 현재 로그인한 사용자 정보 조회 또는 생성
 * (ctx.auth.getUserIdentity() 정보로 자동 upsert)
 */
export const getOrCreateCurrentUser = mutation({
  args: {
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const clerkUserId = identity.subject;
    const name = normalizeDisplayName(args.displayName);
    const imageUrl = identity.pictureUrl ?? undefined;
    const email = identity.email ?? undefined;
    const username = identity.nickname ?? undefined;

    // 기존 사용자 조회
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkUserId', clerkUserId))
      .unique();

    if (existingUser) {
      // 정보가 변경되었으면 업데이트
      if (
        existingUser.name !== name ||
        existingUser.imageUrl !== imageUrl ||
        existingUser.email !== email ||
        existingUser.username !== username
      ) {
        await ctx.db.patch(existingUser._id, {
          name,
          imageUrl,
          email,
          username,
          updatedAt: Date.now(),
        });
      }

      if (email) {
        await migrateLegacyDataByEmail(ctx, email, clerkUserId);
      }

      return await ctx.db.get(existingUser._id);
    }

    // 새 사용자 생성
    const memberNumber = await claimNextMemberNumber(ctx);
    const userId = await ctx.db.insert('users', {
      clerkUserId,
      memberNumber,
      name,
      imageUrl: identity.pictureUrl ?? undefined,
      email: identity.email ?? undefined,
      username,
      updatedAt: Date.now(),
    });

    if (email) {
      await migrateLegacyDataByEmail(ctx, email, clerkUserId);
    }

    return await ctx.db.get(userId);
  },
});

/**
 * Clerk User ID로 사용자 조회
 */
export const getByClerkId = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkUserId', args.clerkUserId))
      .unique();
  },
});

/**
 * 여러 Clerk User ID로 사용자 일괄 조회 (N+1 방지)
 */
export const getByClerkIds = query({
  args: {
    clerkUserIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const users = await Promise.all(
      args.clerkUserIds.map(async (clerkUserId) => {
        return await ctx.db
          .query('users')
          .withIndex('by_clerk_id', (q) => q.eq('clerkUserId', clerkUserId))
          .unique();
      })
    );

    // Map으로 변환하여 반환 (clerkUserId -> user)
    const userMap: Record<string, (typeof users)[number]> = {};
    users.forEach((user, index) => {
      if (user) {
        userMap[args.clerkUserIds[index]] = user;
      }
    });

    return userMap;
  },
});

/**
 * Clerk Webhook에서 호출하는 사용자 생성/업데이트 (internal)
 */
export const upsertFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkUserId', args.clerkUserId))
      .unique();

    if (existingUser) {
      // 업데이트
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        imageUrl: args.imageUrl,
        email: args.email,
        username: args.username,
        updatedAt: Date.now(),
      });
      return existingUser._id;
    }

    // 새로 생성
    const memberNumber = await claimNextMemberNumber(ctx);

    return await ctx.db.insert('users', {
      clerkUserId: args.clerkUserId,
      memberNumber,
      name: args.name,
      imageUrl: args.imageUrl,
      email: args.email,
      username: args.username,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Clerk Webhook에서 호출하는 사용자 삭제 (internal)
 */
export const deleteFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkUserId', args.clerkUserId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
      return true;
    }

    return false;
  },
});

/**
 * 기존 사용자에게 공개용 회원 번호를 부여합니다.
 *
 * 실행 전 Convex 환경변수 MEMBER_NUMBER_MIGRATION_ADMIN_IDS에
 * 실행할 Clerk user id를 쉼표로 구분해 등록해야 합니다.
 */
export const backfillMemberNumbers = mutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertMigrationPermission(ctx);

    const batchSize = Math.min(Math.max(args.batchSize ?? 100, 1), 500);
    return await backfillMissingMemberNumbers(ctx, batchSize);
  },
});

/**
 * 기존 users.name 캐시를 비워 Clerk 실명 기반 표시 이름을 제거합니다.
 *
 * 이후 로그인/UserSync 또는 Clerk webhook은 unsafeMetadata.displayName만
 * users.name에 다시 동기화합니다.
 */
export const clearStoredNames = mutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertMigrationPermission(ctx);

    const batchSize = Math.min(Math.max(args.batchSize ?? 100, 1), 500);
    return await clearStoredDisplayNames(ctx, batchSize);
  },
});
