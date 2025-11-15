import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

/**
 * 특정 리뷰의 북마크 개수 조회
 */
export const count = query({
  args: {
    reviewId: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const bookmarks = await ctx.db
      .query('bookmarks')
      .withIndex('by_review', (q) => q.eq('reviewId', args.reviewId))
      .collect();

    return bookmarks.length;
  },
});

/**
 * 특정 유저가 북마크한 리뷰 목록
 */
export const listByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const bookmarks = await ctx.db
      .query('bookmarks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);

    return bookmarks;
  },
});

/**
 * 특정 유저가 특정 리뷰를 북마크했는지 확인
 */
export const check = query({
  args: {
    userId: v.string(),
    reviewId: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db
      .query('bookmarks')
      .withIndex('by_user_review', (q) =>
        q.eq('userId', args.userId).eq('reviewId', args.reviewId)
      )
      .unique();

    return { isBookmarked: !!bookmark };
  },
});

/**
 * 북마크 토글 (추가/제거)
 */
export const toggle = mutation({
  args: {
    reviewId: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to bookmark a review');
    }

    const userId = identity.subject;

    // 리뷰 존재 확인
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // 기존 북마크 확인
    const existingBookmark = await ctx.db
      .query('bookmarks')
      .withIndex('by_user_review', (q) =>
        q.eq('userId', userId).eq('reviewId', args.reviewId)
      )
      .unique();

    if (existingBookmark) {
      // 북마크 제거
      await ctx.db.delete(existingBookmark._id);

      // 리뷰의 bookmarkCount 감소
      await ctx.db.patch(args.reviewId, {
        bookmarkCount: Math.max(0, review.bookmarkCount - 1),
      });

      return {
        isBookmarked: false,
        bookmarkCount: Math.max(0, review.bookmarkCount - 1),
      };
    } else {
      // 북마크 추가
      await ctx.db.insert('bookmarks', {
        userId,
        reviewId: args.reviewId,
      });

      // 리뷰의 bookmarkCount 증가
      await ctx.db.patch(args.reviewId, {
        bookmarkCount: review.bookmarkCount + 1,
      });

      return {
        isBookmarked: true,
        bookmarkCount: review.bookmarkCount + 1,
      };
    }
  },
});

/**
 * 북마크한 리뷰들의 상세 정보 조회 (최신순)
 */
export const listReviewsByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const bookmarks = await ctx.db
      .query('bookmarks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);

    // 각 북마크의 리뷰 정보 가져오기
    const reviews = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const review = await ctx.db.get(bookmark.reviewId);
        return review;
      })
    );

    // null 제거 (삭제된 리뷰)
    return reviews.filter((review) => review !== null);
  },
});

/**
 * 북마크한 리뷰들의 상세 정보 + 책 정보 조회
 * 정렬 옵션 지원 (최신순/인기순)
 */
export const listReviewsWithBooksByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    sortBy: v.optional(v.union(v.literal('recent'), v.literal('popular'))),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const sortBy = args.sortBy ?? 'recent';

    const bookmarks = await ctx.db
      .query('bookmarks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);

    // 각 북마크의 리뷰 + 책 정보 가져오기
    const reviewsWithBooks = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const review = await ctx.db.get(bookmark.reviewId);
        if (!review || review.status === 'DELETED') {
          return null;
        }

        const book = await ctx.db.get(review.bookId);
        if (!book) {
          return null;
        }

        return {
          ...review,
          book,
          bookmarkedAt: bookmark._creationTime,
        };
      })
    );

    // null 제거 (삭제된 리뷰/책)
    const validReviews = reviewsWithBooks.filter((item) => item !== null);

    // 정렬
    if (sortBy === 'popular') {
      // 인기순 (likeCount 기준)
      validReviews.sort((a, b) => b.likeCount - a.likeCount);
    }
    // 'recent'는 이미 북마크 생성 시간 역순으로 정렬되어 있음

    return validReviews;
  },
});

/**
 * 북마크 제거 (ID로)
 */
export const remove = mutation({
  args: {
    id: v.id('bookmarks'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to remove a bookmark');
    }

    const bookmark = await ctx.db.get(args.id);
    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    // 본인의 북마크만 삭제 가능
    if (bookmark.userId !== identity.subject) {
      throw new Error('Forbidden: You can only remove your own bookmarks');
    }

    // 리뷰의 bookmarkCount 감소
    const review = await ctx.db.get(bookmark.reviewId);
    if (review) {
      await ctx.db.patch(bookmark.reviewId, {
        bookmarkCount: Math.max(0, review.bookmarkCount - 1),
      });
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});
