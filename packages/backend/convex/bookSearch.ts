import { v } from 'convex/values';
import { action } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import {
  parseKakaoResponse,
  parseNlkResponse,
  type KakaoBookResponse,
  type NlkBookInfo,
  type SearchBook,
} from './lib/bookSources';

/**
 * 책 검색과 가져오기
 *
 * - 검색: 카카오 책 검색 (KAKAO_REST_API_KEY, 하루 30,000건)
 * - 보강: 국립중앙도서관 ISBN 서지정보 (NLK_CERT_KEY, 선택)
 *   고른 책의 ISBN으로 KDC, 쪽수, 표지를 채운다. 키가 없거나 실패해도 저장은 된다.
 *
 * 알라딘 OpenAPI는 2026-10-30에 종료되어 더 이상 쓰지 않는다.
 */

const KAKAO_BOOK_SEARCH_URL = 'https://dapi.kakao.com/v3/search/book';
const NLK_SEOJI_URL = 'https://www.nl.go.kr/seoji/SearchApi.do';
const KAKAO_TIMEOUT_MS = 8000;
const NLK_TIMEOUT_MS = 5000;

class TimeoutError extends Error {}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), timeoutMs);
  });

  try {
    return await Promise.race([fetch(url, init), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function requireUser(ctx: {
  auth: { getUserIdentity: () => Promise<unknown> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthorized: Must be logged in');
  }
}

/**
 * 카카오 책 검색
 */
export const searchBooks = action({
  args: {
    query: v.string(),
    target: v.optional(
      v.union(
        v.literal('title'),
        v.literal('person'),
        v.literal('publisher'),
        v.literal('isbn')
      )
    ),
    size: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ totalResults: number; books: SearchBook[] }> => {
    // 쿼터를 지키기 위해 로그인 사용자만 검색할 수 있다 (검색 화면은 모두 로그인 필요)
    await requireUser(ctx);

    const query = args.query.trim();
    if (query.length < 2) {
      return { totalResults: 0, books: [] };
    }

    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
      console.error('KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다');
      throw new Error('도서 검색 서비스를 사용할 수 없습니다');
    }

    const params = new URLSearchParams({
      query,
      sort: 'accuracy',
      page: '1',
      size: String(Math.min(Math.max(args.size ?? 20, 1), 50)),
    });
    if (args.target) {
      params.set('target', args.target);
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${KAKAO_BOOK_SEARCH_URL}?${params.toString()}`,
        { headers: { Authorization: `KakaoAK ${apiKey}` } },
        KAKAO_TIMEOUT_MS
      );
    } catch (error) {
      console.error('카카오 책 검색 요청 실패:', error);
      throw new Error(
        error instanceof TimeoutError
          ? '검색이 오래 걸리고 있습니다. 잠시 후 다시 시도해주세요.'
          : '도서 검색에 실패했습니다'
      );
    }

    if (response.status === 429) {
      throw new Error('검색 요청이 많습니다. 잠시 후 다시 시도해주세요.');
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(
        `카카오 책 검색 HTTP ${response.status}: ${body.slice(0, 300)}`
      );
      throw new Error(
        response.status === 401 || response.status === 403
          ? '도서 검색 서비스를 사용할 수 없습니다'
          : '도서 검색에 실패했습니다'
      );
    }

    try {
      const data = (await response.json()) as KakaoBookResponse;
      return parseKakaoResponse(data);
    } catch (error) {
      console.error('카카오 책 검색 응답 파싱 실패:', error);
      throw new Error('도서 검색 결과를 처리할 수 없습니다');
    }
  },
});

/**
 * 국립중앙도서관에서 ISBN으로 KDC, 쪽수, 표지를 가져온다.
 * 보강용이라 실패하면 null을 돌려주고 로그만 남긴다.
 */
async function fetchNlkInfo(isbn: string): Promise<NlkBookInfo | null> {
  const certKey = process.env.NLK_CERT_KEY;
  if (!certKey || isbn.length !== 13) return null;

  const params = new URLSearchParams({
    cert_key: certKey,
    result_style: 'json',
    page_no: '1',
    page_size: '5',
    isbn,
  });

  try {
    const response = await fetchWithTimeout(
      `${NLK_SEOJI_URL}?${params.toString()}`,
      {},
      NLK_TIMEOUT_MS
    );
    if (!response.ok) {
      console.warn(`국립중앙도서관 서지정보 HTTP ${response.status} (${isbn})`);
      return null;
    }
    return parseNlkResponse(await response.json());
  } catch (error) {
    console.warn(`국립중앙도서관 서지정보 조회 실패 (${isbn}):`, error);
    return null;
  }
}

const searchBookArgs = {
  externalId: v.string(),
  externalSource: v.literal('KAKAO'),
  isbn: v.union(v.string(), v.null()),
  title: v.string(),
  author: v.string(),
  translator: v.union(v.string(), v.null()),
  publisher: v.union(v.string(), v.null()),
  publishedDate: v.union(v.number(), v.null()),
  coverImageUrl: v.union(v.string(), v.null()),
  description: v.union(v.string(), v.null()),
  sourceUrl: v.union(v.string(), v.null()),
};

/**
 * 검색 결과에서 고른 책을 ReadZone에 저장하고 책 ID를 돌려준다.
 * 이미 저장된 책(ISBN 기준)이면 기존 ID를 돌려준다.
 */
export const importBook = action({
  args: { book: v.object(searchBookArgs) },
  handler: async (ctx, { book }): Promise<Id<'books'>> => {
    await requireUser(ctx);

    const isbn = book.isbn ?? undefined;
    const existing = await ctx.runQuery(internal.books.findExisting, {
      isbn,
      externalSource: 'KAKAO',
      externalId: book.externalId,
    });
    if (existing) return existing;

    const nlk = isbn ? await fetchNlkInfo(isbn) : null;

    return await ctx.runMutation(internal.books.insertFromSearch, {
      externalSource: 'KAKAO',
      externalId: book.externalId,
      isbn,
      title: book.title,
      author: book.author,
      translator: book.translator ?? undefined,
      publisher: book.publisher ?? undefined,
      publishedDate: book.publishedDate ?? undefined,
      coverImageUrl: book.coverImageUrl ?? nlk?.coverImageUrl ?? undefined,
      description: book.description ?? undefined,
      pageCount: nlk?.pageCount ?? undefined,
      genre: nlk?.genre ?? undefined,
      kdc: nlk?.kdc ?? undefined,
    });
  },
});
