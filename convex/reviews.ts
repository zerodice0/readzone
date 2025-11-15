import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { paginationOptsValidator } from 'convex/server';

/**
 * 특정 책의 모든 리뷰 조회
 */
export const listByBook = query({
  args: {
    bookId: v.id('books'),
    status: v.optional(
      v.union(v.literal('DRAFT'), v.literal('PUBLISHED'), v.literal('DELETED'))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const status = args.status ?? 'PUBLISHED';

    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_book', (q) =>
        q.eq('bookId', args.bookId).eq('status', status)
      )
      .order('desc')
      .take(limit);

    return reviews;
  },
});

/**
 * 특정 유저의 모든 리뷰 조회
 */
export const listByUser = query({
  args: {
    userId: v.string(),
    status: v.optional(
      v.union(v.literal('DRAFT'), v.literal('PUBLISHED'), v.literal('DELETED'))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let q = ctx.db
      .query('reviews')
      .withIndex('by_user', (q) => q.eq('userId', args.userId));

    if (args.status) {
      q = q.filter((q) => q.eq(q.field('status'), args.status));
    }

    const reviews = await q.order('desc').take(limit);

    return reviews;
  },
});

/**
 * 최신 리뷰 목록 조회 (피드)
 */
export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_status', (q) => q.eq('status', 'PUBLISHED'))
      .order('desc')
      .take(limit);

    return reviews;
  },
});

/**
 * 리뷰 ID로 특정 리뷰 조회
 */
export const get = query({
  args: {
    id: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id);
    return review;
  },
});

/**
 * 특정 유저가 특정 책에 대해 작성한 리뷰 조회
 */
export const getByUserAndBook = query({
  args: {
    userId: v.string(),
    bookId: v.id('books'),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query('reviews')
      .withIndex('by_user_book', (q) =>
        q.eq('userId', args.userId).eq('bookId', args.bookId)
      )
      .first();

    return review;
  },
});

/**
 * 새 리뷰 작성
 */
export const create = mutation({
  args: {
    bookId: v.id('books'),
    title: v.optional(v.string()),
    content: v.string(),
    rating: v.optional(v.number()),
    isRecommended: v.boolean(),
    readStatus: v.union(
      v.literal('READING'),
      v.literal('COMPLETED'),
      v.literal('DROPPED')
    ),
    status: v.optional(v.union(v.literal('DRAFT'), v.literal('PUBLISHED'))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to create a review');
    }

    const userId = identity.subject;

    // 책이 존재하는지 확인
    const book = await ctx.db.get(args.bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    // 중복 리뷰 체크 (같은 유저가 같은 책에 여러 리뷰 작성 방지)
    const existingReview = await ctx.db
      .query('reviews')
      .withIndex('by_user_book', (q) =>
        q.eq('userId', userId).eq('bookId', args.bookId)
      )
      .first();

    if (existingReview && existingReview.status !== 'DELETED') {
      throw new Error('You have already written a review for this book');
    }

    // Rating 유효성 검사
    if (args.rating !== undefined && (args.rating < 1 || args.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const status = args.status ?? 'PUBLISHED';
    const reviewId = await ctx.db.insert('reviews', {
      userId,
      bookId: args.bookId,
      title: args.title,
      content: args.content,
      rating: args.rating,
      isRecommended: args.isRecommended,
      readStatus: args.readStatus,
      status,
      likeCount: 0,
      bookmarkCount: 0,
      viewCount: 0,
      publishedAt: status === 'PUBLISHED' ? Date.now() : undefined,
    });

    return reviewId;
  },
});

/**
 * 리뷰 수정
 */
export const update = mutation({
  args: {
    id: v.id('reviews'),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    rating: v.optional(v.number()),
    isRecommended: v.optional(v.boolean()),
    readStatus: v.optional(
      v.union(
        v.literal('READING'),
        v.literal('COMPLETED'),
        v.literal('DROPPED')
      )
    ),
    status: v.optional(
      v.union(v.literal('DRAFT'), v.literal('PUBLISHED'), v.literal('DELETED'))
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to update a review');
    }

    const review = await ctx.db.get(args.id);
    if (!review) {
      throw new Error('Review not found');
    }

    // 본인의 리뷰만 수정 가능
    if (review.userId !== identity.subject) {
      throw new Error('Forbidden: You can only update your own reviews');
    }

    const { id, ...updates } = args;

    // Rating 유효성 검사
    if (
      updates.rating !== undefined &&
      (updates.rating < 1 || updates.rating > 5)
    ) {
      throw new Error('Rating must be between 1 and 5');
    }

    // DRAFT → PUBLISHED 변경 시 publishedAt 설정
    if (updates.status === 'PUBLISHED' && review.status === 'DRAFT') {
      await ctx.db.patch(id, {
        ...updates,
        publishedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(id, updates);
    }

    return id;
  },
});

/**
 * 리뷰 삭제 (Soft Delete)
 */
export const remove = mutation({
  args: {
    id: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to delete a review');
    }

    const review = await ctx.db.get(args.id);
    if (!review) {
      throw new Error('Review not found');
    }

    // 본인의 리뷰만 삭제 가능
    if (review.userId !== identity.subject) {
      throw new Error('Forbidden: You can only delete your own reviews');
    }

    // Soft delete
    await ctx.db.patch(args.id, {
      status: 'DELETED',
      deletedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * 리뷰 조회수 증가
 */
export const incrementViewCount = mutation({
  args: {
    id: v.id('reviews'),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id);
    if (!review) {
      throw new Error('Review not found');
    }

    await ctx.db.patch(args.id, {
      viewCount: review.viewCount + 1,
    });

    return { viewCount: review.viewCount + 1 };
  },
});

/**
 * 피드용 페이지네이션 리뷰 목록 (책 정보 + 사용자 상호작용 포함)
 */
export const getFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, userId } = args;

    // 페이지네이션 쿼리
    const result = await ctx.db
      .query('reviews')
      .withIndex('by_status', (q) => q.eq('status', 'PUBLISHED'))
      .order('desc')
      .paginate(paginationOpts);

    // 각 리뷰에 대해 책 정보와 사용자 상호작용 정보 추가
    const enrichedPage = await Promise.all(
      result.page.map(async (review) => {
        // 책 정보 가져오기
        const book = await ctx.db.get(review.bookId);

        // 사용자가 로그인한 경우에만 상호작용 정보 조회
        let hasLiked = false;
        let hasBookmarked = false;

        // Type narrowing: userId가 undefined가 아닌 경우에만 쿼리 실행
        const currentUserId = userId;
        if (currentUserId) {
          // 좋아요 여부 확인
          const like = await ctx.db
            .query('likes')
            .withIndex('by_user_review', (q) =>
              q.eq('userId', currentUserId).eq('reviewId', review._id)
            )
            .first();
          hasLiked = !!like;

          // 북마크 여부 확인
          const bookmark = await ctx.db
            .query('bookmarks')
            .withIndex('by_user_review', (q) =>
              q.eq('userId', currentUserId).eq('reviewId', review._id)
            )
            .first();
          hasBookmarked = !!bookmark;
        }

        return {
          ...review,
          book,
          hasLiked,
          hasBookmarked,
        };
      })
    );

    return {
      ...result,
      page: enrichedPage,
    };
  },
});

/**
 * 리뷰 상세 정보 조회 (책 정보 + 사용자 상호작용 포함)
 */
export const getDetail = query({
  args: {
    id: v.id('reviews'),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id);
    if (!review) {
      return null;
    }

    // 책 정보 가져오기
    const book = await ctx.db.get(review.bookId);

    // 사용자가 로그인한 경우에만 상호작용 정보 조회
    let hasLiked = false;
    let hasBookmarked = false;

    const userId = args.userId;
    if (userId) {
      // 좋아요 여부 확인
      const like = await ctx.db
        .query('likes')
        .withIndex('by_user_review', (q) =>
          q.eq('userId', userId).eq('reviewId', args.id)
        )
        .first();
      hasLiked = !!like;

      // 북마크 여부 확인
      const bookmark = await ctx.db
        .query('bookmarks')
        .withIndex('by_user_review', (q) =>
          q.eq('userId', userId).eq('reviewId', args.id)
        )
        .first();
      hasBookmarked = !!bookmark;
    }

    return {
      ...review,
      book,
      hasLiked,
      hasBookmarked,
    };
  },
});
