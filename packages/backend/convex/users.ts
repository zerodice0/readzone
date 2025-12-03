import { v } from 'convex/values';
import { query, mutation, internalMutation } from './_generated/server';

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

    // 기존 사용자 조회
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkUserId', clerkUserId))
      .unique();

    if (existingUser) {
      // 정보가 변경되었으면 업데이트
      const name = identity.name ?? identity.nickname ?? undefined;
      const imageUrl = identity.pictureUrl ?? undefined;
      const email = identity.email ?? undefined;

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

      return existingUser;
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
