import { ConvexError, v } from 'convex/values';
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { genreValidator, resolveGenre, storableGenre } from './lib/genre';
import { isbn13To10, searchBookValidator } from './lib/bookSources';

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
    genre: v.optional(genreValidator),
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
 * 알라딘 시절에 ISBN-10만 저장된 책도 찾도록 ISBN-10으로 한 번 더 본다.
 */
async function findExistingBook(
  ctx: QueryCtx,
  args: { isbn: string | null; externalId: string }
): Promise<Id<'books'> | null> {
  const isbns = args.isbn
    ? [args.isbn, isbn13To10(args.isbn)].filter(
        (isbn): isbn is string => isbn !== null
      )
    : [];

  for (const isbn of isbns) {
    const byIsbn = await ctx.db
      .query('books')
      .withIndex('by_isbn', (q) => q.eq('isbn', isbn))
      .first();
    if (byIsbn) return byIsbn._id;
  }

  const byExternal = await ctx.db
    .query('books')
    .withIndex('by_external', (q) =>
      q.eq('externalSource', 'KAKAO').eq('externalId', args.externalId)
    )
    .first();

  return byExternal?._id ?? null;
}

/**
 * 검색 결과(bookSearch.searchBooks)에서 고른 책을 저장하고 책 ID를 돌려준다.
 * 이미 저장된 책이면 기존 ID를 돌려준다.
 * 새로 저장한 책은 국립중앙도서관 보강(bookSearch.enrichFromNlk)을 예약한다.
 */
export const importFromSearch = mutation({
  args: { book: searchBookValidator },
  handler: async (ctx, { book }): Promise<Id<'books'>> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('로그인이 필요합니다. 다시 로그인해주세요.');
    }

    const existing = await findExistingBook(ctx, book);
    if (existing) return existing;

    const bookId = await ctx.db.insert('books', {
      externalSource: 'KAKAO',
      externalId: book.externalId,
      isbn: book.isbn ?? undefined,
      title: book.title,
      author: book.author,
      translator: book.translator ?? undefined,
      publisher: book.publisher ?? undefined,
      publishedDate: book.publishedDate ?? undefined,
      coverImageUrl: book.coverImageUrl ?? undefined,
      description: book.description ?? undefined,
      language: 'ko',
    });

    if (book.isbn?.length === 13) {
      await ctx.scheduler.runAfter(0, internal.bookSearch.enrichFromNlk, {
        bookId,
        isbn: book.isbn,
      });
    }

    return bookId;
  },
});

/**
 * [Internal] 국립중앙도서관 정보로 비어 있는 필드만 채운다.
 */
export const applyNlkInfo = internalMutation({
  args: {
    bookId: v.id('books'),
    kdc: v.optional(v.string()),
    genre: v.optional(genreValidator),
    pageCount: v.optional(v.number()),
    coverImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { bookId, ...info }) => {
    const book = await ctx.db.get(bookId);
    if (!book) return;

    await ctx.db.patch(bookId, {
      kdc: book.kdc ?? info.kdc,
      genre: book.genre ?? storableGenre(info.genre),
      pageCount: book.pageCount ?? info.pageCount,
      coverImageUrl: book.coverImageUrl ?? info.coverImageUrl,
    });
  },
});

/**
 * [Internal] genre가 비어 있는 책에 장르를 채운다.
 * KDC, 알라딘 category 순으로 추정하고, 알 수 없으면('그 밖의 책') 비워 둔다.
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
      const genre = storableGenre(resolveGenre(book));
      if (!genre) continue;
      await ctx.db.patch(book._id, { genre });
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
