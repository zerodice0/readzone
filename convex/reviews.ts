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

    const status = args.status ?? 'PUBLISHED';
    const reviewId = await ctx.db.insert('reviews', {
      userId,
      bookId: args.bookId,
      title: args.title,
      content: args.content,
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
 * 정렬 및 필터링 지원
 */
export const getFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,
    userId: v.optional(v.string()),
    sortBy: v.optional(v.union(v.literal('recent'), v.literal('popular'))),
    recommendFilter: v.optional(
      v.union(
        v.literal('all'),
        v.literal('recommended'),
        v.literal('not-recommended')
      )
    ),
  },
  handler: async (ctx, args) => {
    const {
      paginationOpts,
      userId,
      sortBy = 'recent',
      recommendFilter = 'all',
    } = args;

    // 페이지네이션 쿼리
    const result = await ctx.db
      .query('reviews')
      .withIndex('by_status', (q) => q.eq('status', 'PUBLISHED'))
      .order('desc')
      .paginate(paginationOpts);

    // 각 리뷰에 대해 책 정보와 사용자 상호작용 정보 추가
    let enrichedPage = await Promise.all(
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

    // 필터링: 추천 여부
    if (recommendFilter === 'recommended') {
      enrichedPage = enrichedPage.filter((review) => review.isRecommended);
    } else if (recommendFilter === 'not-recommended') {
      enrichedPage = enrichedPage.filter((review) => !review.isRecommended);
    }

    // 정렬
    if (sortBy === 'popular') {
      // 인기순: 좋아요 수 기준
      enrichedPage.sort((a, b) => b.likeCount - a.likeCount);
    }
    // 'recent'는 이미 기본 정렬(최신순)로 되어 있음

    return {
      ...result,
      page: enrichedPage,
    };
  },
});

/**
 * 리뷰 검색 (제목, 책 제목, 저자 검색)
 */
export const searchFeed = query({
  args: {
    searchQuery: v.string(),
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchQuery, userId } = args;
    const limit = args.limit ?? 50;

    // 검색어가 비어있으면 빈 배열 반환
    if (!searchQuery.trim()) {
      return [];
    }

    const lowerQuery = searchQuery.toLowerCase().trim();

    // 모든 발행된 리뷰 가져오기
    const allReviews = await ctx.db
      .query('reviews')
      .withIndex('by_status', (q) => q.eq('status', 'PUBLISHED'))
      .order('desc')
      .take(limit);

    // 각 리뷰에 책 정보 추가 및 검색 필터링
    const enrichedReviews = await Promise.all(
      allReviews.map(async (review) => {
        const book = await ctx.db.get(review.bookId);
        if (!book) return null;

        // 검색어가 리뷰 제목, 책 제목, 저자에 포함되는지 확인
        const matchesSearch =
          (review.title?.toLowerCase().includes(lowerQuery) ?? false) ||
          book.title.toLowerCase().includes(lowerQuery) ||
          book.author.toLowerCase().includes(lowerQuery);

        if (!matchesSearch) return null;

        // 사용자 상호작용 정보
        let hasLiked = false;
        let hasBookmarked = false;

        if (userId) {
          const like = await ctx.db
            .query('likes')
            .withIndex('by_user_review', (q) =>
              q.eq('userId', userId).eq('reviewId', review._id)
            )
            .first();
          hasLiked = !!like;

          const bookmark = await ctx.db
            .query('bookmarks')
            .withIndex('by_user_review', (q) =>
              q.eq('userId', userId).eq('reviewId', review._id)
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

    // null 제거 (검색에 매치되지 않은 항목)
    return enrichedReviews.filter((review) => review !== null);
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
