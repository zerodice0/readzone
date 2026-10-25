import { describe, expect, it } from 'vitest';
import {
  normalizeKakaoDocument,
  parseKakaoResponse,
  parseNlkResponse,
  parsePageCount,
  pickIsbn,
  upgradeKakaoThumbnail,
} from '../convex/lib/bookSources';

// 카카오 책 검색 응답 문서 형식을 따른 예시 값 (ISBN, 가격 등은 실제 값이 아님)
const kakaoDoc = {
  authors: ['김초엽'],
  contents:
    '더스트 이후, 지구 끝의 온실에서 피어난 &quot;식물&quot;과 사람의 이야기',
  datetime: '2021-08-18T00:00:00.000+09:00',
  isbn: '1191824000 9791191824001',
  price: 15000,
  publisher: '자이언트북스',
  sale_price: 13500,
  status: '정상판매',
  thumbnail:
    'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5795318%3Ftimestamp%3D20240301',
  title: '지구 끝의 온실',
  translators: [],
  url: 'https://search.daum.net/search?w=bookpage&bookId=5795318',
};

describe('pickIsbn', () => {
  it('prefers ISBN-13 from the space-separated pair', () => {
    expect(pickIsbn('1191824000 9791191824001')).toBe('9791191824001');
  });

  it('accepts a single ISBN-10 including X check digit', () => {
    expect(pickIsbn(' 899012345X')).toBe('899012345X');
  });

  it('returns null for empty or invalid values', () => {
    expect(pickIsbn('')).toBeNull();
    expect(pickIsbn('12345')).toBeNull();
    expect(pickIsbn(undefined)).toBeNull();
  });
});

describe('upgradeKakaoThumbnail', () => {
  it('unwraps the original image from fname and forces https', () => {
    expect(upgradeKakaoThumbnail(kakaoDoc.thumbnail)).toBe(
      'https://t1.daumcdn.net/lbook/image/5795318?timestamp=20240301'
    );
  });

  it('keeps a plain thumbnail but upgrades it to https', () => {
    expect(upgradeKakaoThumbnail('http://example.com/cover.jpg')).toBe(
      'https://example.com/cover.jpg'
    );
  });

  it('returns null for empty or broken values', () => {
    expect(upgradeKakaoThumbnail('')).toBeNull();
    expect(upgradeKakaoThumbnail('not a url')).toBeNull();
  });
});

describe('normalizeKakaoDocument', () => {
  it('maps a Kakao document to a search book', () => {
    expect(normalizeKakaoDocument(kakaoDoc)).toEqual({
      externalId: '9791191824001',
      externalSource: 'KAKAO',
      isbn: '9791191824001',
      title: '지구 끝의 온실',
      author: '김초엽',
      translator: null,
      publisher: '자이언트북스',
      publishedDate: Date.parse('2021-08-18T00:00:00.000+09:00'),
      coverImageUrl:
        'https://t1.daumcdn.net/lbook/image/5795318?timestamp=20240301',
      description:
        '더스트 이후, 지구 끝의 온실에서 피어난 "식물"과 사람의 이야기',
      sourceUrl: 'https://search.daum.net/search?w=bookpage&bookId=5795318',
    });
  });

  it('joins several authors and translators', () => {
    const book = normalizeKakaoDocument({
      ...kakaoDoc,
      authors: ['Ted Chiang'],
      translators: ['김상훈', ' '],
    });
    expect(book?.author).toBe('Ted Chiang');
    expect(book?.translator).toBe('김상훈');
  });

  it('uses the page URL as id when there is no ISBN', () => {
    const book = normalizeKakaoDocument({ ...kakaoDoc, isbn: '' });
    expect(book?.isbn).toBeNull();
    expect(book?.externalId).toBe(kakaoDoc.url);
  });

  it('fills missing fields with null and a placeholder author', () => {
    const book = normalizeKakaoDocument({
      title: '제목만 있는 책',
      isbn: '9791191824001',
    });
    expect(book).toMatchObject({
      author: '저자 미상',
      publisher: null,
      publishedDate: null,
      coverImageUrl: null,
      description: null,
    });
  });

  it('drops documents without a title or any id', () => {
    expect(normalizeKakaoDocument({ ...kakaoDoc, title: ' ' })).toBeNull();
    expect(
      normalizeKakaoDocument({ title: '책', isbn: '', url: '' })
    ).toBeNull();
  });
});

describe('parseKakaoResponse', () => {
  it('removes duplicate ISBNs and reports pageable_count', () => {
    const result = parseKakaoResponse({
      meta: { total_count: 120, pageable_count: 98, is_end: false },
      documents: [kakaoDoc, { ...kakaoDoc, title: '지구 끝의 온실 (리커버)' }],
    });
    expect(result.totalResults).toBe(98);
    expect(result.books).toHaveLength(1);
  });

  it('handles an empty response', () => {
    expect(parseKakaoResponse({})).toEqual({ totalResults: 0, books: [] });
  });
});

describe('parsePageCount', () => {
  it.each([
    ['330 p.', 330],
    ['xii, 284 p.', 284],
    ['352쪽', 352],
    ['400', 400],
    [412, 412],
  ])('%s → %s', (input, expected) => {
    expect(parsePageCount(input)).toBe(expected);
  });

  it.each([[''], ['2책'], ['0 p.'], [null], [-3]])('%s → null', (input) => {
    expect(parsePageCount(input)).toBeNull();
  });
});

describe('parseNlkResponse', () => {
  it('reads KDC, genre, pages and cover from the first paper book', () => {
    const info = parseNlkResponse({
      PAGE_NO: '1',
      TOTAL_COUNT: '2',
      docs: [
        {
          EA_ISBN: '9791191824001',
          EBOOK_YN: 'Y',
          KDC: '813.7',
          PAGE: '',
          TITLE_URL: '',
        },
        {
          EA_ISBN: '9791191824001',
          EA_ADD_CODE: '03810',
          EBOOK_YN: 'N',
          KDC: '813.7',
          PAGE: '392 p.',
          TITLE_URL: 'http://image.nl.go.kr/cover/9791191824001.jpg',
        },
      ],
    });
    expect(info).toEqual({
      kdc: '813.7',
      genre: '소설',
      pageCount: 392,
      coverImageUrl: 'https://image.nl.go.kr/cover/9791191824001.jpg',
    });
  });

  it('uses the audience from the add code before KDC', () => {
    const info = parseNlkResponse({
      docs: [{ EA_ADD_CODE: '77810', KDC: '813.8', PAGE: '48 p.' }],
    });
    expect(info?.genre).toBe('어린이·청소년');
  });

  it('falls back to the add code when KDC is empty', () => {
    const info = parseNlkResponse({
      docs: [{ EA_ADD_CODE: '03320', KDC: '' }],
    });
    expect(info).toMatchObject({ kdc: null, genre: '경제·경영' });
  });

  it('returns null when nothing was found', () => {
    expect(parseNlkResponse({ TOTAL_COUNT: '0', docs: [] })).toBeNull();
    expect(parseNlkResponse(null)).toBeNull();
    expect(parseNlkResponse({ result: 'error' })).toBeNull();
  });
});
