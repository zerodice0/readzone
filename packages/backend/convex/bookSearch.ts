import { ConvexError, v } from 'convex/values';
import { action, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import {
  parseKakaoResponse,
  parseNlkResponse,
  searchBookValidator,
  type KakaoBookResponse,
  type NlkBookInfo,
} from './lib/bookSources';

/**
 * 책 정보 외부 API 호출 (네트워크가 필요한 부분만 여기에 둔다)
 *
 * - 검색: 카카오 책 검색 (KAKAO_REST_API_KEY, 하루 30,000건)
 * - 보강: 국립중앙도서관 ISBN 서지정보 (NLK_CERT_KEY, 선택)
 *   books.importFromSearch가 책을 저장한 뒤 enrichFromNlk를 예약해 KDC, 쪽수, 장르를 채운다.
 *
 * 알라딘 OpenAPI는 2026-10-30에 종료되어 더 이상 쓰지 않는다.
 */

const KAKAO_BOOK_SEARCH_URL = 'https://dapi.kakao.com/v3/search/book';
const NLK_SEOJI_URL = 'https://www.nl.go.kr/seoji/SearchApi.do';
const KAKAO_TIMEOUT_MS = 8000;
const NLK_TIMEOUT_MS = 10000;

class TimeoutError extends Error {}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller =
    typeof AbortController === 'undefined' ? null : new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller?.abort();
      reject(new TimeoutError());
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      fetch(url, { ...init, signal: controller?.signal }),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 카카오 책 검색
 */
export const searchBooks = action({
  args: {
    query: v.string(),
    size: v.optional(v.number()),
  },
  returns: v.object({
    totalResults: v.number(),
    books: v.array(searchBookValidator),
  }),
  handler: async (ctx, args) => {
    // 쿼터를 지키기 위해 로그인 사용자만 검색할 수 있다 (검색 화면은 모두 로그인 필요)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('로그인이 필요합니다. 다시 로그인해주세요.');
    }

    const query = args.query.trim();
    if (query.length < 2) {
      return { totalResults: 0, books: [] };
    }

    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
      console.error('KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다');
      throw new ConvexError('도서 검색 서비스를 사용할 수 없습니다');
    }

    const params = new URLSearchParams({
      query,
      sort: 'accuracy',
      page: '1',
      size: String(Math.min(Math.max(args.size ?? 20, 1), 50)),
    });

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${KAKAO_BOOK_SEARCH_URL}?${params.toString()}`,
        { headers: { Authorization: `KakaoAK ${apiKey}` } },
        KAKAO_TIMEOUT_MS
      );
    } catch (error) {
      console.error('카카오 책 검색 요청 실패:', error);
      throw new ConvexError(
        error instanceof TimeoutError
          ? '검색이 오래 걸리고 있습니다. 잠시 후 다시 시도해주세요.'
          : '도서 검색에 실패했습니다'
      );
    }

    if (response.status === 429) {
      throw new ConvexError('검색 요청이 많습니다. 잠시 후 다시 시도해주세요.');
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(
        `카카오 책 검색 HTTP ${response.status}: ${body.slice(0, 300)}`
      );
      throw new ConvexError(
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
      throw new ConvexError('도서 검색 결과를 처리할 수 없습니다');
    }
  },
});

/**
 * 국립중앙도서관에서 ISBN으로 KDC, 쪽수, 표지를 가져온다.
 * 보강용이라 실패하면 null을 돌려주고 원인을 로그로 남긴다.
 */
async function fetchNlkInfo(
  certKey: string,
  isbn: string
): Promise<NlkBookInfo | null> {
  const params = new URLSearchParams({
    cert_key: certKey,
    result_style: 'json',
    page_no: '1',
    page_size: '5',
    isbn,
  });

  let body: unknown;
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
    body = await response.json();
  } catch (error) {
    console.warn(`국립중앙도서관 서지정보 조회 실패 (${isbn}):`, error);
    return null;
  }

  const info = parseNlkResponse(body);
  if (!info) {
    // 결과 없음(TOTAL_COUNT 0)이거나 인증키 오류 등 예상과 다른 응답
    console.warn(
      `국립중앙도서관 서지정보 결과 없음 (${isbn}):`,
      JSON.stringify(body).slice(0, 300)
    );
  }
  return info;
}

/**
 * [Internal] 저장된 책을 국립중앙도서관 정보로 보강한다.
 * books.importFromSearch가 새 책을 저장한 직후 예약한다.
 */
export const enrichFromNlk = internalAction({
  args: { bookId: v.id('books'), isbn: v.string() },
  handler: async (ctx, { bookId, isbn }) => {
    const certKey = process.env.NLK_CERT_KEY;
    if (!certKey) return;

    const info = await fetchNlkInfo(certKey, isbn);
    if (!info) return;

    await ctx.runMutation(internal.books.applyNlkInfo, {
      bookId,
      kdc: info.kdc ?? undefined,
      genre: info.genre ?? undefined,
      pageCount: info.pageCount ?? undefined,
      coverImageUrl: info.coverImageUrl ?? undefined,
    });
  },
});
