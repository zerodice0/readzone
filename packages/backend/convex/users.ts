import { v } from 'convex/values';
import {
  query,
  mutation,
  internalMutation,
  type MutationCtx,
} from './_generated/server';

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
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const clerkUserId = identity.subject;
    const name = identity.name ?? identity.nickname ?? undefined;
    const imageUrl = identity.pictureUrl ?? undefined;
    const email = identity.email ?? undefined;

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
        existingUser.email !== email
      ) {
        await ctx.db.patch(existingUser._id, {
          name,
          imageUrl,
          email,
          updatedAt: Date.now(),
        });
      }

      if (email) {
        await migrateLegacyDataByEmail(ctx, email, clerkUserId);
      }

      return await ctx.db.get(existingUser._id);
    }

    // 새 사용자 생성
    const userId = await ctx.db.insert('users', {
      clerkUserId,
      name: identity.name ?? identity.nickname ?? undefined,
      imageUrl: identity.pictureUrl ?? undefined,
      email: identity.email ?? undefined,
      username: identity.nickname ?? undefined,
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
    return await ctx.db.insert('users', {
      clerkUserId: args.clerkUserId,
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
