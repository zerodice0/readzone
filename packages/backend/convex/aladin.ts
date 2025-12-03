'use node';
import { v } from 'convex/values';
import { action } from './_generated/server';

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
}

interface AladinSearchResponse {
  version: string;
  title: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  item: AladinSearchItem[];
  errorCode?: number;
  errorMessage?: string;
}

// 알라딘 API 응답을 ReadZone Book 모델로 변환
function transformAladinToBook(item: AladinSearchItem) {
  // 출판일 파싱 (YYYY-MM-DD 또는 YYYY 형식)
  let publishedDate: number | null = null;
  if (item.pubDate) {
    const parsed = Date.parse(item.pubDate);
    if (!isNaN(parsed)) {
      publishedDate = parsed;
    }
  }

  return {
    externalId: String(item.itemId),
    externalSource: 'ALADIN' as const,
    isbn: item.isbn13 || item.isbn || null,
    title: item.title.replace(/ - .*$/, ''), // 부제목 제거
    author: item.author.replace(/ \(지은이\).*$/, ''), // "(지은이)" 등 제거
    publisher: item.publisher || null,
    publishedDate,
    coverImageUrl: item.cover || null,
    description: item.description || null,
    pageCount: null, // 알라딘 검색 API에서는 페이지 수 미제공
    language: 'ko', // 알라딘은 한국어 도서 기본
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

      // 검색 결과를 ReadZone 모델로 변환
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
