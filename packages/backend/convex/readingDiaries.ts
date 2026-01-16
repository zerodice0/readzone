import { v } from 'convex/values';
import { query, mutation, QueryCtx } from './_generated/server';

/**
 * 날짜를 UTC 자정(00:00:00)으로 정규화하는 헬퍼 함수
 * 캘린더 조회 시 날짜 비교를 위해 사용
 */
function normalizeToDateTimestamp(timestamp: number): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

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
 * 월별 캘린더 데이터 조회
 * 해당 월의 각 날짜별 책 커버 이미지 목록 반환
 */
export const getCalendarSummary = query({
  args: {
    year: v.number(),
    month: v.number(), // 1-12
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {};
    }

    const userId = identity.subject;

    // 해당 월의 시작/끝 타임스탬프 계산
    const startOfMonth = Date.UTC(args.year, args.month - 1, 1);
    const endOfMonth = Date.UTC(args.year, args.month, 0, 23, 59, 59, 999);

    // 해당 월의 모든 일기 조회
    const diaries = await ctx.db
      .query('readingDiaries')
      .withIndex('by_user_date', (q) =>
        q.eq('userId', userId).gte('date', startOfMonth)
      )
      .filter((q) => q.lte(q.field('date'), endOfMonth))
      .collect();

    // 날짜별로 그룹핑하고 책별로 일기 개수 집계
    const calendarData: Record<
      string,
      Array<{
        bookId: string;
        coverImageUrl?: string;
        diaryCount: number;
        diaryIds: string[];
      }>
    > = {};

    for (const diary of diaries) {
      const date = new Date(diary.date);
      const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;

      if (!calendarData[dateKey]) {
        calendarData[dateKey] = [];
      }

      // 같은 책이 이미 있는지 확인
      const existingBook = calendarData[dateKey].find(
        (b) => b.bookId === diary.bookId
      );

      if (existingBook) {
        // 같은 책이면 카운트 증가 및 ID 추가
        existingBook.diaryCount++;
        existingBook.diaryIds.push(diary._id);
      } else {
        // 새로운 책이면 항목 추가
        const book = await ctx.db.get(diary.bookId);
        calendarData[dateKey].push({
          bookId: diary.bookId,
          coverImageUrl: book?.coverImageUrl,
          diaryCount: 1,
          diaryIds: [diary._id],
        });
      }
    }

    return calendarData;
  },
});

/**
 * 특정 날짜의 일기 목록 조회
 */
export const getByUserAndDate = query({
  args: {
    date: v.number(), // Unix timestamp
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject;
    const normalizedDate = normalizeToDateTimestamp(args.date);

    const diaries = await ctx.db
      .query('readingDiaries')
      .withIndex('by_user_date', (q) =>
        q.eq('userId', userId).eq('date', normalizedDate)
      )
      .collect();

    // 책 정보 추가
    const enrichedDiaries = await Promise.all(
      diaries.map(async (diary) => {
        const book = await ctx.db.get(diary.bookId);
        return {
          ...diary,
          book: book
            ? {
                _id: book._id,
                title: book.title,
                author: book.author,
                coverImageUrl: book.coverImageUrl,
              }
            : null,
        };
      })
    );

    return enrichedDiaries;
  },
});

/**
 * 특정 책의 모든 일기 조회 (독후감 연동용)
 */
export const getByUserAndBook = query({
  args: {
    bookId: v.id('books'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject;

    const diaries = await ctx.db
      .query('readingDiaries')
      .withIndex('by_user_book', (q) =>
        q.eq('userId', userId).eq('bookId', args.bookId)
      )
      .order('desc') // 최신순 정렬
      .collect();

    return diaries;
  },
});

/**
 * 특정 책의 모든 공개 일기 조회 (다른 사용자 열람용)
 */
export const getPublicByBook = query({
  args: {
    bookId: v.id('books'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const diaries = await ctx.db
      .query('readingDiaries')
      .withIndex('by_book', (q) => q.eq('bookId', args.bookId))
      .filter((q) => q.eq(q.field('visibility'), 'PUBLIC'))
      .order('desc')
      .take(limit);

    // 작성자 정보 추가
    const enrichedDiaries = await Promise.all(
      diaries.map(async (diary) => {
        const author = await getAuthorInfo(ctx, diary.userId);
        return {
          ...diary,
          author,
        };
      })
    );

    return enrichedDiaries;
  },
});

/**
 * 사용자의 최근 기록한 책 목록 조회 (최대 3개)
 * - 빈 날짜에서 빠른 추가 UI에 사용
 * - 중복 책 제거하여 고유한 책만 반환
 */
export const getRecentBooks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject;

    // 최근 일기 조회 (중복 책 제거를 위해 충분히 가져옴)
    const recentDiaries = await ctx.db
      .query('readingDiaries')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(20);

    if (recentDiaries.length === 0) return [];

    // 중복 책 제거하여 최대 3개 추출
    const seenBookIds = new Set<string>();
    const uniqueDiaries: typeof recentDiaries = [];

    for (const diary of recentDiaries) {
      const bookIdStr = diary.bookId.toString();
      if (!seenBookIds.has(bookIdStr)) {
        seenBookIds.add(bookIdStr);
        uniqueDiaries.push(diary);
        if (uniqueDiaries.length >= 3) break;
      }
    }

    // 책 정보 병렬 조회
    const results = await Promise.all(
      uniqueDiaries.map(async (diary) => {
        const book = await ctx.db.get(diary.bookId);
        return book ? { diary, book } : null;
      })
    );

    return results.filter((r) => r !== null);
  },
});

/**
 * 단일 일기 상세 조회
 */
export const get = query({
  args: {
    id: v.id('readingDiaries'),
  },
  handler: async (ctx, args) => {
    const diary = await ctx.db.get(args.id);
    if (!diary) {
      return null;
    }

    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    // 비공개 일기는 본인만 조회 가능
    if (diary.visibility === 'PRIVATE' && diary.userId !== userId) {
      return null;
    }

    // 책 정보 추가
    const book = await ctx.db.get(diary.bookId);
    const author = await getAuthorInfo(ctx, diary.userId);

    return {
      ...diary,
      book: book
        ? {
            _id: book._id,
            title: book.title,
            author: book.author,
            coverImageUrl: book.coverImageUrl,
          }
        : null,
      author,
    };
  },
});

/**
 * 새 일기 작성
 */
export const create = mutation({
  args: {
    bookId: v.id('books'),
    date: v.number(), // Unix timestamp
    content: v.string(),
    visibility: v.union(v.literal('PUBLIC'), v.literal('PRIVATE')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to create a diary');
    }

    const userId = identity.subject;

    // 책이 존재하는지 확인
    const book = await ctx.db.get(args.bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    // 날짜 정규화 (UTC 자정으로)
    const normalizedDate = normalizeToDateTimestamp(args.date);

    const diaryId = await ctx.db.insert('readingDiaries', {
      userId,
      bookId: args.bookId,
      date: normalizedDate,
      content: args.content,
      visibility: args.visibility,
    });

    return diaryId;
  },
});

/**
 * 일기 수정
 */
export const update = mutation({
  args: {
    id: v.id('readingDiaries'),
    content: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal('PUBLIC'), v.literal('PRIVATE'))),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to update a diary');
    }

    const diary = await ctx.db.get(args.id);
    if (!diary) {
      throw new Error('Diary not found');
    }

    // 본인의 일기만 수정 가능
    if (diary.userId !== identity.subject) {
      throw new Error('Forbidden: You can only update your own diaries');
    }

    const updates: Partial<{
      content: string;
      visibility: 'PUBLIC' | 'PRIVATE';
      date: number;
    }> = {};

    if (args.content !== undefined) {
      updates.content = args.content;
    }
    if (args.visibility !== undefined) {
      updates.visibility = args.visibility;
    }
    if (args.date !== undefined) {
      updates.date = normalizeToDateTimestamp(args.date);
    }

    await ctx.db.patch(args.id, updates);

    return args.id;
  },
});

/**
 * 일기 삭제 (Hard Delete)
 */
export const remove = mutation({
  args: {
    id: v.id('readingDiaries'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Must be logged in to delete a diary');
    }

    const diary = await ctx.db.get(args.id);
    if (!diary) {
      throw new Error('Diary not found');
    }

    // 본인의 일기만 삭제 가능
    if (diary.userId !== identity.subject) {
      throw new Error('Forbidden: You can only delete your own diaries');
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});
