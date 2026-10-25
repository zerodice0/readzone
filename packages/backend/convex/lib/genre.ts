import { v } from 'convex/values';

/**
 * ReadZone 장르 체계
 *
 * 책 정보 출처마다 분류 체계가 다르다.
 * - 알라딘(과거 데이터): "국내도서>소설/시/희곡>한국소설" 형식의 categoryName
 * - 국립중앙도서관: KDC 분류기호("813.7")와 ISBN 부가기호("03810")
 * - 카카오 책 검색: 분류 정보 없음
 *
 * 통계와 화면 표시는 아래 장르 목록 하나만 쓴다. 출처별 분류는 이 목록으로 바꿔서
 * books.genre에 저장한다. 단, '그 밖의 책'은 저장하지 않는다(storableGenre).
 * 저장값이 없으면 읽을 때 resolveGenre로 추정하므로, 매핑을 고치면 바로 반영된다.
 */

export const GENRES = [
  '소설',
  '시',
  '에세이',
  '인문',
  '사회',
  '역사',
  '과학',
  '경제·경영',
  '자기계발',
  '예술',
  '만화',
  '어린이·청소년',
  '그 밖의 책',
] as const;

export type Genre = (typeof GENRES)[number];

export const FALLBACK_GENRE: Genre = '그 밖의 책';

export function isGenre(value: unknown): value is Genre {
  return (
    typeof value === 'string' && (GENRES as readonly string[]).includes(value)
  );
}

/** 함수 인자 검증용 */
export const genreValidator = v.union(
  ...GENRES.map((genre) => v.literal(genre))
);

/**
 * books.genre에 저장할 값. 추정 결과가 '그 밖의 책'이면 저장하지 않는다.
 * (저장하면 나중에 분류 정보가 생기거나 매핑이 바뀌어도 고쳐지지 않는다)
 */
export function storableGenre(
  genre: Genre | null | undefined
): Genre | undefined {
  return genre && genre !== FALLBACK_GENRE ? genre : undefined;
}

/**
 * KDC 분류기호 → 장르
 * 주로 정수부 세 자리를 본다. 예: "813.7" → 813 → 소설
 */
export function genreFromKdc(kdc: string | null | undefined): Genre | null {
  if (!kdc) return null;
  const match = kdc.trim().match(/^(\d{3})(?:\.(\d+))?/);
  if (!match) return null;

  const code = Number(match[1]);
  const decimals = match[2] ?? '';
  const hundreds = Math.floor(code / 100);

  switch (hundreds) {
    case 0:
      return FALLBACK_GENRE; // 총류
    case 1:
      // 199: 도덕훈·처세훈(자기계발서가 주로 여기에 분류됨). 190~198 윤리학은 인문
      return code === 199 ? '자기계발' : '인문';
    case 2:
      return '인문'; // 종교
    case 3:
      if (code >= 320 && code <= 329) return '경제·경영';
      return '사회';
    case 4:
      return '과학';
    case 5:
      // 590번대(가정·요리·육아)는 실용서로 본다
      return code >= 590 ? FALLBACK_GENRE : '과학';
    case 6:
      if (code === 657) return '만화';
      if (code >= 690) return FALLBACK_GENRE; // 오락·스포츠
      return '예술';
    case 7:
      return '인문'; // 언어
    case 8:
      return genreFromLiteratureCode(code, decimals);
    case 9:
      if (code >= 980 && code <= 989) return FALLBACK_GENRE; // 지리·여행
      return '역사';
    default:
      return null;
  }
}

/**
 * 문학(800번대)
 * - 810~889: 셋째 자리가 문학 형식이다. 8x1 시, 8x2 희곡, 8x3 소설, 8x4 수필 ...
 * - 890~899(기타 제문학): 셋째 자리는 언어이고, 형식은 소수점 둘째 자리다. 예: 892.83 → 소설
 * - 8x0: 형식 미지정. 소수점이 있으면 문학사·이론(8x0.9 등)이라 인문,
 *   없으면(부가기호에서 온 "810" 등) 국내 출판에서 가장 흔한 소설로 둔다.
 */
function genreFromLiteratureCode(code: number, decimals: string): Genre {
  if (code < 810) return '인문'; // 문학 일반·이론

  if (code >= 890) {
    const form = decimals[1];
    return form === undefined ? '소설' : genreFromLiteraryForm(Number(form));
  }

  const form = code % 10;
  if (form === 0) {
    if (!decimals) return '소설';
    return decimals[0] === '8' ? '소설' : '인문'; // 8x0.8 전집·선집
  }
  return genreFromLiteraryForm(form);
}

function genreFromLiteraryForm(form: number): Genre {
  switch (form) {
    case 0:
      return '인문';
    case 1:
      return '시';
    case 2:
    case 3:
      return '소설';
    default:
      return '에세이'; // 수필, 연설, 일기·서간·기행, 풍자, 르포 등
  }
}

/**
 * ISBN 부가기호(5자리) → 장르
 * - 첫째 자리: 독자 대상 (4 청소년, 7 아동)
 * - 둘째 자리: 발행 형태 (7 그림책·만화)
 * - 셋째~다섯째 자리: KDC를 끝자리 0으로 줄인 대강 분류. 문학은 시·수필·소설이
 *   모두 "810"이 되므로, KDC가 없을 때만 쓰는 대략적인 추정이다.
 */
export function genreFromEaAddCode(
  code: string | null | undefined
): Genre | null {
  if (!code) return null;
  const digits = code.trim();
  if (!/^\d{5}$/.test(digits)) return null;

  const audience = digits[0];
  if (audience === '4' || audience === '7') return '어린이·청소년';
  if (digits[1] === '7') return '만화';

  return genreFromKdc(digits.slice(2));
}

const ALADIN_MIDDLE_CATEGORY_GENRES: Record<string, Genre> = {
  '소설/시/희곡': '소설',
  에세이: '에세이',
  인문학: '인문',
  '종교/역학': '인문',
  고전: '인문',
  사회과학: '사회',
  역사: '역사',
  과학: '과학',
  경제경영: '경제·경영',
  자기계발: '자기계발',
  '예술/대중문화': '예술',
  만화: '만화',
  어린이: '어린이·청소년',
  청소년: '어린이·청소년',
  유아: '어린이·청소년',
};

/**
 * 알라딘 categoryName → 장르 (2026-10-30 이전에 저장된 책용)
 * 예: "국내도서>소설/시/희곡>한국시" → 시
 */
export function genreFromAladinCategory(
  categoryName: string | null | undefined
): Genre | null {
  if (!categoryName) return null;
  const parts = categoryName.split('>').map((part) => part.trim());
  const middle = parts[1] || parts[0];
  if (!middle) return null;

  const genre = ALADIN_MIDDLE_CATEGORY_GENRES[middle];
  if (!genre) return FALLBACK_GENRE;

  if (genre === '소설') {
    const detail = parts[2] ?? '';
    if (/시$/.test(detail) && !/소설/.test(detail)) return '시';
  }

  return genre;
}

/**
 * 저장된 책 하나의 장르를 정한다.
 * genre가 있으면 그대로, 없으면 남아 있는 분류 정보로 추정한다.
 */
export function resolveGenre(book: {
  genre?: string;
  kdc?: string;
  category?: string;
}): Genre {
  if (isGenre(book.genre)) return book.genre;
  return (
    genreFromKdc(book.kdc) ??
    genreFromAladinCategory(book.category) ??
    FALLBACK_GENRE
  );
}
