'use node';
import { v } from 'convex/values';
import { action } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';

// 알라딘 API 응답 타입 정의
interface AladinSearchItem {
  itemId: number;
  title: string;
  author: string;
  publisher: string;
  pubDate: string; // "2024-01-15" 형식
  cover: string; // 표지 이미지 URL
  description: string;
  isbn13: string;
  isbn: string; // ISBN10
  categoryName: string;
  customerReviewRank: number;
  link: string; // 알라딘 상품 페이지 URL
}

// 전자책 정보 타입
interface AladinEbookItem {
  itemId: number;
  link: string;
}

// ItemLookUp API 응답용 확장 타입 (ebookList 포함)
interface AladinLookupItem extends AladinSearchItem {
  subInfo?: {
    ebookList?: AladinEbookItem[];
  };
}

interface AladinSearchResponse {
  version: string;
  title: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  item: AladinLookupItem[]; // AladinLookupItem으로 변경 (ebookList 포함 가능)
  errorCode?: number;
  errorMessage?: string;
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
};

function decodeHtmlEntities(value: string) {
  return value.replace(
    /&(#\d+|#x[\da-fA-F]+|[a-zA-Z]+);/g,
    (match: string, entity: string) => {
      if (entity[0] === '#') {
        const codePoint =
          entity[1]?.toLowerCase() === 'x'
            ? Number.parseInt(entity.slice(2), 16)
            : Number.parseInt(entity.slice(1), 10);

        return Number.isNaN(codePoint) || codePoint > 0x10ffff
          ? match
          : String.fromCodePoint(codePoint);
      }

      return HTML_ENTITIES[entity] ?? match;
    }
  );
}

function normalizeAladinText(value: string | null | undefined) {
  const normalized = value ? decodeHtmlEntities(value).trim() : '';
  return normalized || null;
}

// 알라딘 API 응답을 글다락 Book 모델로 변환
function transformAladinToBook(item: AladinLookupItem) {
  // 출판일 파싱 (YYYY-MM-DD 또는 YYYY 형식)
  let publishedDate: number | null = null;
  if (item.pubDate) {
    const parsed = Date.parse(item.pubDate);
    if (!isNaN(parsed)) {
      publishedDate = parsed;
    }
  }

  // 전자책 URL 추출 (subInfo.ebookList가 있는 경우)
  const ebookUrl = item.subInfo?.ebookList?.[0]?.link || null;

  return {
    externalId: String(item.itemId),
    externalSource: 'ALADIN' as const,
    isbn: item.isbn13 || item.isbn || null,
    title: decodeHtmlEntities(item.title).replace(/ - .*$/, ''), // 부제목 제거
    author: decodeHtmlEntities(item.author).replace(/ \(지은이\).*$/, ''), // "(지은이)" 등 제거
    publisher: normalizeAladinText(item.publisher),
    publishedDate,
    coverImageUrl: item.cover || null,
    description: normalizeAladinText(item.description),
    pageCount: null, // 알라딘 검색 API에서는 페이지 수 미제공
    language: 'ko', // 알라딘은 한국어 도서 기본
    aladinUrl: item.link || null, // 알라딘 종이책 구매 URL
    ebookUrl, // 전자책 구매 URL
    category: normalizeAladinText(item.categoryName), // 장르 카테고리 (예: "국내도서>소설/시/희곡>한국소설")
  };
}

/**
 * 알라딘 API로 도서 검색 (외부 API 호출)
 * Action은 Node.js 환경에서 실행되어 fetch 사용 가능
 */
export const searchBooks = action({
  args: {
    query: v.string(),
    queryType: v.optional(
      v.union(
        v.literal('Title'),
        v.literal('Author'),
        v.literal('Publisher'),
        v.literal('Keyword')
      )
    ),
    maxResults: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const ttbKey = process.env.ALADIN_TTB_KEY;
    if (!ttbKey) {
      console.error('ALADIN_TTB_KEY 환경변수가 설정되지 않았습니다');
      throw new Error('도서 검색 서비스를 사용할 수 없습니다');
    }

    const queryType = args.queryType ?? 'Keyword';
    const maxResults = Math.min(args.maxResults ?? 10, 50); // 최대 50개 제한

    const params = new URLSearchParams({
      ttbkey: ttbKey,
      Query: args.query,
      QueryType: queryType,
      MaxResults: String(maxResults),
      start: '1',
      SearchTarget: 'Book',
      output: 'js', // JSON 응답
      Version: '20131101',
      Cover: 'Big', // 큰 표지 이미지
      OptResult: 'ebookList', // 전자책 정보 포함
    });

    const url = `http://www.aladin.co.kr/ttb/api/ItemSearch.aspx?${params.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`알라딘 API HTTP 오류: ${response.status}`);
        throw new Error('도서 검색에 실패했습니다');
      }

      // 알라딘 API는 JSON이지만 Content-Type이 text/javascript일 수 있음
      const text = await response.text();
      const data = JSON.parse(text) as AladinSearchResponse;

      // 알라딘 API 에러 체크
      if (data.errorCode) {
        console.error(
          `알라딘 API 에러: ${data.errorCode} - ${data.errorMessage}`
        );
        throw new Error('도서 검색에 실패했습니다');
      }

      // 검색 결과를 글다락 모델로 변환
      const books = (data.item || []).map(transformAladinToBook);

      return {
        totalResults: data.totalResults || 0,
        books,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('알라딘 API 응답 파싱 실패:', error);
        throw new Error('도서 검색 결과를 처리할 수 없습니다');
      }
      throw error;
    }
  },
});

/**
 * ISBN으로 알라딘에서 도서 상세 조회
 */
export const lookupByIsbn = action({
  args: {
    isbn: v.string(),
  },
  handler: async (_ctx, args) => {
    const ttbKey = process.env.ALADIN_TTB_KEY;
    if (!ttbKey) {
      console.error('ALADIN_TTB_KEY 환경변수가 설정되지 않았습니다');
      return null;
    }

    // ISBN10 또는 ISBN13 지원
    const itemIdType = args.isbn.length === 13 ? 'ISBN13' : 'ISBN';

    const params = new URLSearchParams({
      ttbkey: ttbKey,
      itemIdType,
      ItemId: args.isbn,
      output: 'js',
      Version: '20131101',
      Cover: 'Big',
      OptResult: 'ebookList', // 전자책 정보 포함 요청
    });

    const url = `http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?${params.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`알라딘 API HTTP 오류: ${response.status}`);
        return null;
      }

      const text = await response.text();
      const data = JSON.parse(text) as AladinSearchResponse;

      if (data.errorCode || !data.item || data.item.length === 0) {
        return null;
      }

      return transformAladinToBook(data.item[0]);
    } catch (error) {
      console.error('알라딘 ISBN 조회 실패:', error);
      return null;
    }
  },
});

interface MigrationBook {
  _id: Id<'books'>;
  isbn?: string;
}

interface MigrationResults {
  total: number;
  updated: number;
  failed: number;
  skipped: number;
}

/**
 * 기존 ALADIN 소스 책들의 aladinUrl, ebookUrl 필드 마이그레이션
 * ISBN이 있는 책에 대해 알라딘 API로 URL 정보를 조회하여 업데이트
 */
export const migrateAladinUrls = action({
  args: {},
  handler: async (ctx): Promise<MigrationResults> => {
    const ttbKey = process.env.ALADIN_TTB_KEY;
    if (!ttbKey) {
      throw new Error('ALADIN_TTB_KEY 환경변수가 설정되지 않았습니다');
    }

    // aladinUrl이 없는 ALADIN 소스 책들 조회
    const books: MigrationBook[] = await ctx.runQuery(
      internal.books.getBooksNeedingMigration
    );

    const results: MigrationResults = {
      total: books.length,
      updated: 0,
      failed: 0,
      skipped: 0,
    };

    for (const book of books) {
      try {
        // ISBN이 없는 책은 스킵
        if (!book.isbn) {
          results.skipped++;
          continue;
        }

        // ISBN으로 알라딘 API 조회
        const itemIdType = book.isbn.length === 13 ? 'ISBN13' : 'ISBN';
        const params = new URLSearchParams({
          ttbkey: ttbKey,
          itemIdType,
          ItemId: book.isbn,
          output: 'js',
          Version: '20131101',
          OptResult: 'ebookList',
        });

        const url = `http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          results.failed++;
          continue;
        }

        const text = await response.text();
        const data = JSON.parse(text) as AladinSearchResponse;

        if (data.errorCode || !data.item || data.item.length === 0) {
          results.skipped++;
          continue;
        }

        const item = data.item[0];
        const aladinUrl = item.link || null;
        const ebookUrl = item.subInfo?.ebookList?.[0]?.link || null;

        // DB 업데이트
        await ctx.runMutation(internal.books.updateBookAladinUrls, {
          bookId: book._id,
          aladinUrl,
          ebookUrl,
        });

        results.updated++;

        // API 호출 제한 방지를 위한 딜레이 (100ms)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`책 ${book._id} 마이그레이션 실패:`, error);
        results.failed++;
      }
    }

    return results;
  },
});

/**
 * 기존 ALADIN 소스 책들의 category 필드 마이그레이션
 * ISBN이 있는 책에 대해 알라딘 API로 categoryName을 조회하여 업데이트
 */
export const migrateCategories = action({
  args: {},
  handler: async (ctx): Promise<MigrationResults> => {
    const ttbKey = process.env.ALADIN_TTB_KEY;
    if (!ttbKey) {
      throw new Error('ALADIN_TTB_KEY 환경변수가 설정되지 않았습니다');
    }

    // category가 없는 ALADIN 소스 책들 조회
    const books: MigrationBook[] = await ctx.runQuery(
      internal.books.getBooksNeedingCategoryMigration
    );

    const results: MigrationResults = {
      total: books.length,
      updated: 0,
      failed: 0,
      skipped: 0,
    };

    console.log(`마이그레이션 시작: ${books.length}개 책 대상`);

    for (const book of books) {
      try {
        // ISBN이 없는 책은 스킵
        if (!book.isbn) {
          results.skipped++;
          continue;
        }

        // ISBN으로 알라딘 API 조회
        const itemIdType = book.isbn.length === 13 ? 'ISBN13' : 'ISBN';
        const params = new URLSearchParams({
          ttbkey: ttbKey,
          itemIdType,
          ItemId: book.isbn,
          output: 'js',
          Version: '20131101',
        });

        const url = `http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          console.error(`API 호출 실패 (${book._id}): HTTP ${response.status}`);
          results.failed++;
          continue;
        }

        const text = await response.text();
        const data = JSON.parse(text) as AladinSearchResponse;

        if (data.errorCode || !data.item || data.item.length === 0) {
          console.log(`API 응답 없음 (${book._id}): 스킵`);
          results.skipped++;
          continue;
        }

        const item = data.item[0];
        const category = item.categoryName || null;

        // DB 업데이트
        await ctx.runMutation(internal.books.updateBookCategory, {
          bookId: book._id,
          category,
        });

        console.log(`업데이트 완료 (${book._id}): ${category}`);
        results.updated++;

        // API 호출 제한 방지를 위한 딜레이 (100ms)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`책 ${book._id} 마이그레이션 실패:`, error);
        results.failed++;
      }
    }

    console.log(`마이그레이션 완료:`, results);
    return results;
  },
});
