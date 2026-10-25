import { v } from 'convex/values';
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { resolveGenre } from './lib/genre';

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

        const recommendedCount = reviews.filter((r) => r.isRecommended).length;
        const recommendationRate =
          reviewCount > 0 ? (recommendedCount / reviewCount) * 100 : 0;

        return {
          ...book,
          reviewCount,
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
        v.literal('KAKAO'),
        v.literal('MANUAL')
      )
    ),
    genre: v.optional(v.string()),
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
      genre: args.genre,
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

/**
 * ISBN 또는 외부 출처 ID로 이미 저장된 책을 찾는다.
 * ISBN이 같으면 출처가 달라도 같은 책으로 본다.
 */
async function findExistingBook(
  ctx: QueryCtx,
  args: { isbn?: string; externalSource: 'KAKAO'; externalId: string }
): Promise<Id<'books'> | null> {
  if (args.isbn) {
    const byIsbn = await ctx.db
      .query('books')
      .withIndex('by_isbn', (q) => q.eq('isbn', args.isbn))
      .first();
    if (byIsbn) return byIsbn._id;
  }

  const byExternal = await ctx.db
    .query('books')
    .withIndex('by_external', (q) =>
      q
        .eq('externalSource', args.externalSource)
        .eq('externalId', args.externalId)
    )
    .first();

  return byExternal?._id ?? null;
}

/**
 * [Internal] 책 가져오기 전에 이미 저장된 책인지 확인
 */
export const findExisting = internalQuery({
  args: {
    isbn: v.optional(v.string()),
    externalSource: v.literal('KAKAO'),
    externalId: v.string(),
  },
  handler: async (ctx, args) => findExistingBook(ctx, args),
});

/**
 * [Internal] 검색 결과로 고른 책을 저장 (bookSearch.importBook에서 호출)
 * 그사이 다른 사용자가 같은 책을 저장했으면 그 책 ID를 돌려준다.
 */
export const insertFromSearch = internalMutation({
  args: {
    externalSource: v.literal('KAKAO'),
    externalId: v.string(),
    isbn: v.optional(v.string()),
    title: v.string(),
    author: v.string(),
    translator: v.optional(v.string()),
    publisher: v.optional(v.string()),
    publishedDate: v.optional(v.number()),
    coverImageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    genre: v.optional(v.string()),
    kdc: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await findExistingBook(ctx, args);
    if (existing) return existing;

    return await ctx.db.insert('books', { ...args, language: 'ko' });
  },
});

/**
 * [Internal] genre가 비어 있는 책에 장르를 채운다.
 * 알라딘 category, KDC 순으로 추정하고, 둘 다 없으면 '그 밖의 책'으로 둔다.
 * 한 번 실행하면 끝까지 스스로 이어서 돈다:
 *   npx convex run books:backfillGenres
 */
export const backfillGenres = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    updatedSoFar: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query('books')
      .paginate({ cursor: args.cursor ?? null, numItems: 100 });

    let updated = args.updatedSoFar ?? 0;
    for (const book of page.page) {
      if (book.genre) continue;
      await ctx.db.patch(book._id, { genre: resolveGenre(book) });
      updated += 1;
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.books.backfillGenres, {
        cursor: page.continueCursor,
        updatedSoFar: updated,
      });
    } else {
      console.log(`장르 채우기 완료: ${updated}권`);
    }

    return { updated, isDone: page.isDone };
  },
});

/**
 * OG 메타데이터용 책 조회
 * 소셜 미디어 크롤러가 책 페이지 공유 시 필요한 정보 반환
 */
export const getForOg = internalQuery({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    // 문자열 ID를 Convex ID로 변환 후 책 조회
    const bookId = ctx.db.normalizeId('books', args.id);
    if (!bookId) {
      return null;
    }

    const book = await ctx.db.get(bookId);
    if (!book) {
      return null;
    }

    // 해당 책의 리뷰 통계 계산
    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_book', (q) =>
        q.eq('bookId', book._id).eq('status', 'PUBLISHED')
      )
      .collect();

    const reviewCount = reviews.length;
    const recommendedCount = reviews.filter((r) => r.isRecommended).length;
    const recommendationRate =
      reviewCount > 0 ? Math.round((recommendedCount / reviewCount) * 100) : 0;

    return {
      title: book.title,
      author: book.author,
      description: book.description ?? null,
      coverImageUrl: book.coverImageUrl ?? null,
      publisher: book.publisher ?? null,
      reviewCount,
      recommendationRate,
    };
  },
});

/**
 * 사이트맵용 책 목록 조회
 * 모든 책의 ID와 수정 시간 반환
 */
export const listForSitemap = internalQuery({
  args: {},
  handler: async (ctx) => {
    const books = await ctx.db.query('books').order('desc').collect();

    return books.map((book) => ({
      id: book._id,
      lastmod: book._creationTime,
    }));
  },
});
