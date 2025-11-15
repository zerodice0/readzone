import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

/**
 * 특정 리뷰의 좋아요 개수 조회
 */
export const count = query({
  args: {
    reviewId: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query('likes')
      .withIndex('by_review', (q) => q.eq('reviewId', args.reviewId))
      .collect();

    return likes.length;
  },
});

/**
 * 특정 유저가 좋아요한 리뷰 목록
 */
export const listByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const likes = await ctx.db
      .query('likes')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .take(limit);

    return likes;
  },
});

/**
 * 특정 유저가 특정 리뷰에 좋아요를 눌렀는지 확인
 */
export const check = query({
  args: {
    userId: v.string(),
    reviewId: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query('likes')
      .withIndex('by_user_review', (q) =>
        q.eq('userId', args.userId).eq('reviewId', args.reviewId)
      )
      .unique();

    return { isLiked: !!like };
  },
});

/**
 * 좋아요 토글 (추가/제거)
 */
export const toggle = mutation({
  args: {
    reviewId: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to like a review');
    }

    const userId = identity.subject;

    // 리뷰 존재 확인
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // 기존 좋아요 확인
    const existingLike = await ctx.db
      .query('likes')
      .withIndex('by_user_review', (q) =>
        q.eq('userId', userId).eq('reviewId', args.reviewId)
      )
      .unique();

    if (existingLike) {
      // 좋아요 제거
      await ctx.db.delete(existingLike._id);

      // 리뷰의 likeCount 감소
      await ctx.db.patch(args.reviewId, {
        likeCount: Math.max(0, review.likeCount - 1),
      });

      return { isLiked: false, likeCount: Math.max(0, review.likeCount - 1) };
    } else {
      // 좋아요 추가
      await ctx.db.insert('likes', {
        userId,
        reviewId: args.reviewId,
      });

      // 리뷰의 likeCount 증가
      await ctx.db.patch(args.reviewId, {
        likeCount: review.likeCount + 1,
      });

      return { isLiked: true, likeCount: review.likeCount + 1 };
    }
  },
});

/**
 * 좋아요한 리뷰들의 상세 정보 조회
 */
export const listReviewsByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const likes = await ctx.db
      .query('likes')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .take(limit);

    // 각 좋아요의 리뷰 정보 가져오기
    const reviews = await Promise.all(
      likes.map(async (like) => {
        const review = await ctx.db.get(like.reviewId);
        return review;
      })
    );

    // null 제거 (삭제된 리뷰)
    return reviews.filter((review) => review !== null);
  },
});
