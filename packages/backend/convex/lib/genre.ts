/**
 * ReadZone 장르 체계
 *
 * 책 정보 출처마다 분류 체계가 다르다.
 * - 알라딘(과거 데이터): "국내도서>소설/시/희곡>한국소설" 형식의 categoryName
 * - 국립중앙도서관: KDC 분류기호("813.7")와 ISBN 부가기호("03810")
 * - 카카오 책 검색: 분류 정보 없음
 *
 * 통계와 화면 표시는 아래 장르 목록 하나만 쓴다. 출처별 분류는 이 목록으로 바꿔서
 * books.genre에 저장한다.
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

/**
 * KDC 분류기호 → 장르
 * 정수부 세 자리만 본다. 예: "813.7" → 813 → 소설
 */
export function genreFromKdc(kdc: string | null | undefined): Genre | null {
  if (!kdc) return null;
  const match = kdc.trim().match(/^(\d{3})/);
  if (!match) return null;

  const code = Number(match[1]);
  const hundreds = Math.floor(code / 100);

  switch (hundreds) {
    case 0:
      return FALLBACK_GENRE; // 총류
    case 1:
      // 199: 도덕·처세훈 계열(자기계발서가 주로 여기에 분류됨)
      return code >= 190 && code <= 199 ? '자기계발' : '인문';
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
      return genreFromLiteratureCode(code);
    case 9:
      if (code >= 980 && code <= 989) return FALLBACK_GENRE; // 지리·여행
      return '역사';
    default:
      return null;
  }
}

/**
 * 문학(800번대): 세 번째 자리가 문학 형식이다.
 * 8x1 시, 8x2 희곡, 8x3 소설, 8x4 수필, 8x6 일기·서간·기행 ...
 * 8x0(형식 미지정)은 국내 출판에서 소설에 가장 많이 붙으므로 소설로 둔다.
 */
function genreFromLiteratureCode(code: number): Genre {
  if (code < 810) return '인문'; // 문학 일반·이론
  const form = code % 10;
  switch (form) {
    case 1:
      return '시';
    case 0:
    case 2:
    case 3:
      return '소설';
    default:
      return '에세이';
  }
}

/**
 * ISBN 부가기호(5자리) → 장르
 * 첫째 자리는 독자 대상(4 청소년, 7 아동), 셋째~다섯째 자리는 KDC 대강 분류다.
 */
export function genreFromEaAddCode(
  code: string | null | undefined
): Genre | null {
  if (!code) return null;
  const digits = code.trim();
  if (!/^\d{5}$/.test(digits)) return null;

  const audience = digits[0];
  if (audience === '4' || audience === '7') return '어린이·청소년';

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
