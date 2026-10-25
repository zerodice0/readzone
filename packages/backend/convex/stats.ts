import { v } from 'convex/values';
import { query } from './_generated/server';
import { FALLBACK_GENRE, resolveGenre } from './lib/genre';

/**
 * 장르별 통계 타입
 */
interface GenreStats {
  genre: string;
  count: number;
  percentage: number;
}

/**
 * 사용자의 장르별 독서 통계 조회
 * 기간 필터 지원 (startDate, endDate)
 */
export const getGenreStats = query({
  args: {
    startDate: v.optional(v.number()), // Unix timestamp (ms)
    endDate: v.optional(v.number()), // Unix timestamp (ms)
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    topGenres: GenreStats[];
    allGenres: GenreStats[];
    totalReviews: number;
  }> => {
    // 인증 확인
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { topGenres: [], allGenres: [], totalReviews: 0 };
    }

    const userId = identity.subject;

    // 사용자의 PUBLISHED 리뷰 조회
    let reviews = await ctx.db
      .query('reviews')
      .withIndex('by_user', (q) =>
        q.eq('userId', userId).eq('status', 'PUBLISHED')
      )
      .collect();

    // 기간 필터 적용 (publishedAt 기준)
    if (args.startDate !== undefined) {
      reviews = reviews.filter(
        (r) => r.publishedAt !== undefined && r.publishedAt >= args.startDate!
      );
    }
    if (args.endDate !== undefined) {
      reviews = reviews.filter(
        (r) => r.publishedAt !== undefined && r.publishedAt <= args.endDate!
      );
    }

    if (reviews.length === 0) {
      return { topGenres: [], allGenres: [], totalReviews: 0 };
    }

    // 각 리뷰에 연결된 책의 장르 집계
    const genreCountMap = new Map<string, number>();

    for (const review of reviews) {
      const book = await ctx.db.get(review.bookId);
      if (book) {
        const genre = resolveGenre(book);
        genreCountMap.set(genre, (genreCountMap.get(genre) || 0) + 1);
      }
    }

    const totalReviews = reviews.length;

    // Map을 배열로 변환하고 정렬
    const allGenres: GenreStats[] = Array.from(genreCountMap.entries())
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: Math.round((count / totalReviews) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // 상위 5개 장르 + 나머지는 '그 밖의 책'으로 합산 (항상 마지막에 둔다)
    const TOP_N = 5;
    let topGenres: GenreStats[];

    if (allGenres.length <= TOP_N + 1) {
      topGenres = allGenres;
    } else {
      const named = allGenres.filter((g) => g.genre !== FALLBACK_GENRE);
      const otherCount =
        (genreCountMap.get(FALLBACK_GENRE) ?? 0) +
        named.slice(TOP_N).reduce((sum, g) => sum + g.count, 0);

      topGenres = named.slice(0, TOP_N);
      if (otherCount > 0) {
        topGenres.push({
          genre: FALLBACK_GENRE,
          count: otherCount,
          percentage: Math.round((otherCount / totalReviews) * 100),
        });
      }
    }

    return {
      topGenres,
      allGenres,
      totalReviews,
    };
  },
});

/**
 * 사용자의 전체 독서 통계 요약
 */
export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = identity.subject;

    // 전체 리뷰 수
    const allReviews = await ctx.db
      .query('reviews')
      .withIndex('by_user', (q) =>
        q.eq('userId', userId).eq('status', 'PUBLISHED')
      )
      .collect();

    // 고유 책 수 (같은 책에 여러 리뷰 가능하지 않지만 확인 차원)
    const uniqueBookIds = new Set(allReviews.map((r) => r.bookId));

    // 총 좋아요 수
    const totalLikes = allReviews.reduce((sum, r) => sum + r.likeCount, 0);

    // 총 북마크 수
    const totalBookmarks = allReviews.reduce(
      (sum, r) => sum + r.bookmarkCount,
      0
    );

    return {
      totalReviews: allReviews.length,
      totalBooks: uniqueBookIds.size,
      totalLikes,
      totalBookmarks,
    };
  },
});
