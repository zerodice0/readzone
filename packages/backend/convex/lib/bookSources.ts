/**
 * 외부 책 정보 응답을 ReadZone 모델로 바꾸는 순수 함수 모음
 *
 * - 카카오 책 검색: https://dapi.kakao.com/v3/search/book
 * - 국립중앙도서관 ISBN 서지정보: https://www.nl.go.kr/seoji/SearchApi.do
 *
 * 네트워크 호출은 bookSearch.ts(action)에서 하고, 여기서는 응답 파싱만 한다.
 */
import { v, type Infer } from 'convex/values';
import { genreFromEaAddCode, genreFromKdc, type Genre } from './genre';

/** 검색 결과 한 권 (DB 저장 전). bookSearch.searchBooks의 반환값이자 books.importFromSearch의 인자 */
export const searchBookValidator = v.object({
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
});

export type SearchBook = Infer<typeof searchBookValidator>;

export interface KakaoBookDocument {
  title?: string;
  contents?: string;
  url?: string;
  isbn?: string;
  datetime?: string;
  authors?: string[];
  publisher?: string;
  translators?: string[];
  price?: number;
  sale_price?: number;
  thumbnail?: string;
  status?: string;
}

export interface KakaoBookResponse {
  meta?: {
    total_count?: number;
    pageable_count?: number;
    is_end?: boolean;
  };
  documents?: KakaoBookDocument[];
}

/** 국립중앙도서관에서 보강하는 정보 */
export interface NlkBookInfo {
  kdc: string | null;
  genre: Genre | null;
  pageCount: number | null;
  coverImageUrl: string | null;
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
};

export function decodeHtmlEntities(value: string): string {
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

function cleanText(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = decodeHtmlEntities(value).replace(/\s+/g, ' ').trim();
  return cleaned || null;
}

/** ISBN에서 숫자(과 ISBN-10의 X)만 남긴다 */
export function normalizeIsbn(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9Xx]/g, '').toUpperCase();
  if (cleaned.length === 13 && /^\d{13}$/.test(cleaned)) return cleaned;
  if (cleaned.length === 10 && /^\d{9}[\dX]$/.test(cleaned)) return cleaned;
  return null;
}

/**
 * 카카오 isbn 필드는 "ISBN10 ISBN13" 형태로 공백 구분돼 온다.
 * 하나만 오거나 빈 문자열일 수도 있다. ISBN-13을 우선한다.
 */
export function pickIsbn(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const candidates = raw
    .split(/\s+/)
    .map((part) => normalizeIsbn(part))
    .filter((part): part is string => part !== null);

  return candidates.find((isbn) => isbn.length === 13) ?? candidates[0] ?? null;
}

/**
 * 978로 시작하는 ISBN-13 → ISBN-10
 * 알라딘 시절에 ISBN-10만 저장된 책을 같은 책으로 찾기 위해 쓴다.
 */
export function isbn13To10(isbn13: string): string | null {
  if (!/^978\d{10}$/.test(isbn13)) return null;
  const core = isbn13.slice(3, 12);
  const sum = [...core].reduce(
    (acc, digit, index) => acc + Number(digit) * (10 - index),
    0
  );
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? 'X' : String(check));
}

/**
 * 카카오 썸네일은 120x174 리사이즈 주소다.
 * fname 파라미터에 원본 이미지 주소가 들어 있으면 그 주소(https)를 쓴다.
 */
export function upgradeKakaoThumbnail(
  thumbnail: string | null | undefined
): string | null {
  if (!thumbnail) return null;

  try {
    const url = new URL(thumbnail);
    const original = url.searchParams.get('fname');
    if (original) {
      const originalUrl = new URL(original);
      if (
        originalUrl.protocol === 'http:' ||
        originalUrl.protocol === 'https:'
      ) {
        originalUrl.protocol = 'https:';
        return originalUrl.toString();
      }
    }
    url.protocol = 'https:';
    return url.toString();
  } catch {
    return null;
  }
}

function parseDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function joinNames(names: string[] | undefined): string | null {
  const cleaned = (names ?? [])
    .map((name) => cleanText(name))
    .filter((name): name is string => name !== null);
  return cleaned.length > 0 ? cleaned.join(', ') : null;
}

export function normalizeKakaoDocument(
  doc: KakaoBookDocument
): SearchBook | null {
  const title = cleanText(doc.title);
  if (!title) return null;

  const isbn = pickIsbn(doc.isbn);
  // ISBN이 없는 책(일부 독립출판물 등)은 다음 책 페이지 주소로 구분한다
  const externalId = isbn ?? cleanText(doc.url);
  if (!externalId) return null;

  return {
    externalId,
    externalSource: 'KAKAO',
    isbn,
    title,
    author: joinNames(doc.authors) ?? '저자 미상',
    translator: joinNames(doc.translators),
    publisher: cleanText(doc.publisher),
    publishedDate: parseDate(doc.datetime),
    coverImageUrl: upgradeKakaoThumbnail(doc.thumbnail),
    description: cleanText(doc.contents),
  };
}

/** 카카오 응답 → 검색 결과 목록 (같은 ISBN은 한 번만) */
export function parseKakaoResponse(response: KakaoBookResponse): {
  totalResults: number;
  books: SearchBook[];
} {
  const seen = new Set<string>();
  const books: SearchBook[] = [];

  for (const doc of response.documents ?? []) {
    const book = normalizeKakaoDocument(doc);
    if (!book || seen.has(book.externalId)) continue;
    seen.add(book.externalId);
    books.push(book);
  }

  return {
    totalResults: response.meta?.pageable_count ?? books.length,
    books,
  };
}

/**
 * 형태사항의 쪽수 표기에서 본문 쪽수를 뽑는다.
 * 예: "330 p." → 330, "xii, 284 p." → 284, "352쪽" → 352
 */
export function parsePageCount(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const withUnit = [...trimmed.matchAll(/(\d{1,5})\s*(?:p\b|p\.|쪽|면)/gi)];
  const last = withUnit[withUnit.length - 1];
  if (last) {
    const count = Number(last[1]);
    return count > 0 ? count : null;
  }

  if (/^\d{1,5}$/.test(trimmed)) {
    const count = Number(trimmed);
    return count > 0 ? count : null;
  }

  return null;
}

type NlkDoc = Record<string, unknown>;

function readString(doc: NlkDoc, key: string): string | null {
  const value = doc[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function toHttpsUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.protocol = 'https:';
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * 국립중앙도서관 ISBN 서지정보 응답(JSON) → 보강 정보
 * 같은 ISBN으로 여러 건이 오면 종이책(EBOOK_YN !== 'Y')을 우선한다.
 */
export function parseNlkResponse(response: unknown): NlkBookInfo | null {
  if (!response || typeof response !== 'object') return null;
  const docs = (response as { docs?: unknown }).docs;
  if (!Array.isArray(docs) || docs.length === 0) return null;

  const records = docs.filter(
    (doc): doc is NlkDoc => !!doc && typeof doc === 'object'
  );
  const doc =
    records.find((record) => readString(record, 'EBOOK_YN') !== 'Y') ??
    records[0];
  if (!doc) return null;

  const kdc = readString(doc, 'KDC');
  // 부가기호의 독자 대상(아동·청소년)을 먼저 보고, 주제는 더 세밀한 KDC를 우선한다
  const addCodeGenre = genreFromEaAddCode(readString(doc, 'EA_ADD_CODE'));
  const genre =
    addCodeGenre === '어린이·청소년'
      ? addCodeGenre
      : (genreFromKdc(kdc) ?? addCodeGenre);

  return {
    kdc,
    genre,
    pageCount: parsePageCount(doc.PAGE),
    coverImageUrl: toHttpsUrl(readString(doc, 'TITLE_URL')),
  };
}
