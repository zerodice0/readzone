import { v } from 'convex/values';
import { query, mutation, internalQuery, QueryCtx } from './_generated/server';
import { paginationOptsValidator } from 'convex/server';
import { Id } from './_generated/dataModel';

/**
 * 사용자 정보를 users 테이블에서 조회하는 헬퍼 함수
 */
async function getAuthorInfo(ctx: QueryCtx, userId: string) {
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkUserId', userId))
    .unique();

  return user ? { name: user.name, imageUrl: user.imageUrl } : null;
}

/**
 * 여러 사용자 정보를 일괄 조회하는 헬퍼 함수 (N+1 방지)
 */
async function getAuthorInfoBatch(
  ctx: QueryCtx,
  userIds: string[]
): Promise<Map<string, { name?: string; imageUrl?: string }>> {
  const uniqueUserIds = [...new Set(userIds)];

  const users = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const user = await ctx.db
        .query('users')
        .withIndex('by_clerk_id', (q) => q.eq('clerkUserId', userId))
        .unique();
      return user
        ? {
            clerkUserId: user.clerkUserId,
            name: user.name,
            imageUrl: user.imageUrl,
          }
        : null;
    })
  );

  const userMap = new Map<string, { name?: string; imageUrl?: string }>();
  users.forEach((user) => {
    if (user) {
      userMap.set(user.clerkUserId, {
        name: user.name,
        imageUrl: user.imageUrl,
      });
    }
  });

  return userMap;
}

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
  returns: v.array(
    v.object({
      _id: v.id('reviews'),
      _creationTime: v.number(),
      userId: v.string(),
      bookId: v.id('books'),
      title: v.optional(v.string()),
      content: v.string(),
      isRecommended: v.boolean(),
      readStatus: v.union(
        v.literal('READING'),
        v.literal('COMPLETED'),
        v.literal('DROPPED')
      ),
      status: v.union(
        v.literal('DRAFT'),
        v.literal('PUBLISHED'),
        v.literal('DELETED')
      ),
      likeCount: v.number(),
      bookmarkCount: v.number(),
      viewCount: v.number(),
      publishedAt: v.optional(v.number()),
      deletedAt: v.optional(v.number()),
      author: v.union(
        v.object({
          name: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
        }),
        v.null()
      ),
    })
  ),
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

    // 작성자 정보 일괄 조회 (N+1 방지)
    const authorUserIds = reviews.map((review) => review.userId);
    const authorMap = await getAuthorInfoBatch(ctx, authorUserIds);

    // 각 리뷰에 작성자 정보 추가
    return reviews.map((review) => ({
      ...review,
      author: authorMap.get(review.userId) ?? null,
    }));
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

    // 사용자 정보 upsert (users 테이블에 저장)
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkUserId', userId))
      .unique();

    if (existingUser) {
      // 기존 사용자 정보 업데이트
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
    } else {
      // 새 사용자 생성
      await ctx.db.insert('users', {
        clerkUserId: userId,
        name: identity.name ?? identity.nickname ?? undefined,
        imageUrl: identity.pictureUrl ?? undefined,
        email: identity.email ?? undefined,
        username: identity.nickname ?? undefined,
        updatedAt: Date.now(),
      });
    }

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
 * 피드용 페이지네이션 리뷰 목록 (책 정보 + 작성자 정보 + 사용자 상호작용 포함)
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

    // 작성자 정보 일괄 조회 (N+1 방지)
    const authorUserIds = result.page.map((review) => review.userId);
    const authorMap = await getAuthorInfoBatch(ctx, authorUserIds);

    // 각 리뷰에 대해 책 정보와 사용자 상호작용 정보 추가
    let enrichedPage = await Promise.all(
      result.page.map(async (review) => {
        // 책 정보 가져오기
        const book = await ctx.db.get(review.bookId);

        // 작성자 정보 가져오기
        const author = authorMap.get(review.userId) ?? null;

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
          author,
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

    // 작성자 정보 일괄 조회 (N+1 방지)
    const authorUserIds = allReviews.map((review) => review.userId);
    const authorMap = await getAuthorInfoBatch(ctx, authorUserIds);

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

        // 작성자 정보 가져오기
        const author = authorMap.get(review.userId) ?? null;

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
          author,
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
 * 리뷰 상세 정보 조회 (책 정보 + 작성자 정보 + 사용자 상호작용 포함)
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

    // 같은 책의 발행된 독후감 개수 조회
    const reviewsForBook = await ctx.db
      .query('reviews')
      .withIndex('by_book', (q) =>
        q.eq('bookId', review.bookId).eq('status', 'PUBLISHED')
      )
      .collect();
    const reviewCount = reviewsForBook.length;

    // 작성자 정보 가져오기
    const author = await getAuthorInfo(ctx, review.userId);

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
      book: book
        ? {
            ...book,
            reviewCount,
          }
        : null,
      author,
      hasLiked,
      hasBookmarked,
    };
  },
});

/**
 * OG 메타데이터용 리뷰 정보 조회 (내부 쿼리)
 * HTTP 엔드포인트에서 호출하여 소셜 미디어 크롤러에 메타데이터 제공
 */
export const getForOg = internalQuery({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    // 문자열 ID를 Convex ID로 변환 시도
    let reviewId: Id<'reviews'>;
    try {
      reviewId = args.id as Id<'reviews'>;
    } catch {
      return null;
    }

    const review = await ctx.db.get(reviewId);
    if (!review || review.status !== 'PUBLISHED') {
      return null;
    }

    // 책 정보 가져오기
    const book = await ctx.db.get(review.bookId);

    // 작성자 정보 가져오기
    const author = await getAuthorInfo(ctx, review.userId);

    // 리뷰 제목 생성: 사용자 지정 제목 또는 "《책제목》 독후감"
    const title =
      review.title || (book ? `《${book.title}》 독후감` : '독후감');

    // 설명: 리뷰 내용 앞부분 (150자)
    const description = review.content
      .replace(/<[^>]*>/g, '') // HTML 태그 제거
      .slice(0, 150)
      .trim();

    return {
      title,
      description: description + (review.content.length > 150 ? '...' : ''),
      image: book?.coverImageUrl || null,
      bookTitle: book?.title || null,
      bookAuthor: book?.author || null,
      authorName: author?.name || '익명',
    };
  },
});

/**
 * 사이트맵용 리뷰 목록 조회
 * PUBLISHED 상태인 모든 리뷰의 ID와 수정 시간 반환
 */
export const listForSitemap = internalQuery({
  args: {},
  handler: async (ctx) => {
    const reviews = await ctx.db
      .query('reviews')
      .filter((q) => q.eq(q.field('status'), 'PUBLISHED'))
      .order('desc')
      .collect();

    return reviews.map((review) => ({
      id: review._id,
      lastmod: review.publishedAt || review._creationTime,
    }));
  },
});
