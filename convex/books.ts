import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

/**
 * 모든 책 목록 조회
 * 페이지네이션 지원
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const books = await ctx.db.query('books').order('desc').take(limit);

    return books;
  },
});

/**
 * 책 목록 + 리뷰 통계 조회
 * 페이지네이션 지원
 */
export const listWithStats = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const books = await ctx.db.query('books').order('desc').take(limit);

    // 각 책의 리뷰 통계 계산
    const booksWithStats = await Promise.all(
      books.map(async (book) => {
        const reviews = await ctx.db
          .query('reviews')
          .withIndex('by_book', (q) =>
            q.eq('bookId', book._id).eq('status', 'PUBLISHED')
          )
          .collect();

        const reviewCount = reviews.length;
        const averageRating =
          reviewCount > 0
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
            : 0;

        const recommendedCount = reviews.filter((r) => r.isRecommended).length;
        const recommendationRate =
          reviewCount > 0 ? (recommendedCount / reviewCount) * 100 : 0;

        return {
          ...book,
          reviewCount,
          averageRating: Math.round(averageRating * 10) / 10, // 소수점 1자리
          recommendationRate: Math.round(recommendationRate),
        };
      })
    );

    return booksWithStats;
  },
});

/**
 * 책 ID로 특정 책 조회
 */
export const get = query({
  args: {
    id: v.id('books'),
  },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.id);
    return book;
  },
});

/**
 * ISBN으로 책 조회
 */
export const getByIsbn = query({
  args: {
    isbn: v.string(),
  },
  handler: async (ctx, args) => {
    const book = await ctx.db
      .query('books')
      .withIndex('by_isbn', (q) => q.eq('isbn', args.isbn))
      .unique();

    return book;
  },
});

/**
 * 책 검색 (제목 또는 저자)
 */
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchQuery = args.query.toLowerCase();

    // Convex는 full-text search가 제한적이므로 클라이언트 필터링 사용
    const allBooks = await ctx.db.query('books').collect();

    const filtered = allBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery) ||
        book.author.toLowerCase().includes(searchQuery)
    );

    return filtered.slice(0, limit);
  },
});

/**
 * 저자별 책 조회
 */
export const getByAuthor = query({
  args: {
    author: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const books = await ctx.db
      .query('books')
      .withIndex('by_author', (q) => q.eq('author', args.author))
      .take(limit);

    return books;
  },
});

/**
 * 새 책 생성
 * 인증 필요
 */
export const create = mutation({
  args: {
    isbn: v.optional(v.string()),
    title: v.string(),
    author: v.string(),
    publisher: v.optional(v.string()),
    publishedDate: v.optional(v.number()),
    coverImageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    language: v.optional(v.string()),
    externalId: v.optional(v.string()),
    externalSource: v.optional(
      v.union(
        v.literal('GOOGLE_BOOKS'),
        v.literal('ALADIN'),
        v.literal('MANUAL')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Clerk 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to create a book');
    }

    // ISBN 중복 체크
    if (args.isbn) {
      const existing = await ctx.db
        .query('books')
        .withIndex('by_isbn', (q) => q.eq('isbn', args.isbn))
        .unique();

      if (existing) {
        throw new Error(`Book with ISBN ${args.isbn} already exists`);
      }
    }

    // 외부 소스 중복 체크
    if (args.externalSource && args.externalId) {
      const existing = await ctx.db
        .query('books')
        .withIndex('by_external', (q) =>
          q
            .eq('externalSource', args.externalSource)
            .eq('externalId', args.externalId)
        )
        .unique();

      if (existing) {
        throw new Error(
          `Book from ${args.externalSource} with ID ${args.externalId} already exists`
        );
      }
    }

    const bookId = await ctx.db.insert('books', {
      isbn: args.isbn,
      title: args.title,
      author: args.author,
      publisher: args.publisher,
      publishedDate: args.publishedDate,
      coverImageUrl: args.coverImageUrl,
      description: args.description,
      pageCount: args.pageCount,
      language: args.language,
      externalId: args.externalId,
      externalSource: args.externalSource,
    });

    return bookId;
  },
});

/**
 * 책 정보 수정
 * 인증 필요 (관리자만 가능하도록 확장 가능)
 */
export const update = mutation({
  args: {
    id: v.id('books'),
    isbn: v.optional(v.string()),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    publisher: v.optional(v.string()),
    publishedDate: v.optional(v.number()),
    coverImageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to update a book');
    }

    const { id, ...updates } = args;

    await ctx.db.patch(id, updates);

    return id;
  },
});

/**
 * 책 삭제
 * 인증 필요 (관리자만 가능하도록 확장 가능)
 */
export const remove = mutation({
  args: {
    id: v.id('books'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to delete a book');
    }

    // 관련 리뷰가 있는지 확인 (soft delete 고려)
    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_book', (q) => q.eq('bookId', args.id))
      .collect();

    if (reviews.length > 0) {
      throw new Error(
        `Cannot delete book: ${reviews.length} review(s) exist. Please delete reviews first.`
      );
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});
