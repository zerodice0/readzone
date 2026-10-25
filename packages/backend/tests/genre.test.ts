import { describe, expect, it } from 'vitest';
import {
  FALLBACK_GENRE,
  GENRES,
  genreFromAladinCategory,
  genreFromEaAddCode,
  genreFromKdc,
  resolveGenre,
} from '../convex/lib/genre';

describe('genreFromKdc', () => {
  it.each([
    ['813.7', '소설'],
    ['843', '소설'],
    ['811.62', '시'],
    ['814.6', '에세이'],
    ['816.7', '에세이'],
    ['810', '소설'],
    ['801.9', '인문'],
    ['325.211', '경제·경영'],
    ['331.5', '사회'],
    ['199.1', '자기계발'],
    ['181.3', '인문'],
    ['404', '과학'],
    ['512.5', '과학'],
    ['594.5', FALLBACK_GENRE],
    ['657.1', '만화'],
    ['601', '예술'],
    ['692.8', FALLBACK_GENRE],
    ['911.05', '역사'],
    ['981.02', FALLBACK_GENRE],
    ['004', FALLBACK_GENRE],
  ])('%s → %s', (kdc, genre) => {
    expect(genreFromKdc(kdc)).toBe(genre);
  });

  it('returns null for missing or malformed codes', () => {
    expect(genreFromKdc(undefined)).toBeNull();
    expect(genreFromKdc('')).toBeNull();
    expect(genreFromKdc('KDC')).toBeNull();
    expect(genreFromKdc('81')).toBeNull();
  });
});

describe('genreFromEaAddCode', () => {
  it('treats children and teen audiences as 어린이·청소년', () => {
    expect(genreFromEaAddCode('77810')).toBe('어린이·청소년');
    expect(genreFromEaAddCode('43810')).toBe('어린이·청소년');
  });

  it('falls back to the KDC part for general readers', () => {
    expect(genreFromEaAddCode('03810')).toBe('소설');
    expect(genreFromEaAddCode('03320')).toBe('경제·경영');
    expect(genreFromEaAddCode('13590')).toBe(FALLBACK_GENRE);
  });

  it('ignores codes that are not five digits', () => {
    expect(genreFromEaAddCode('0381')).toBeNull();
    expect(genreFromEaAddCode(null)).toBeNull();
  });
});

describe('genreFromAladinCategory', () => {
  it.each([
    ['국내도서>소설/시/희곡>한국소설', '소설'],
    ['국내도서>소설/시/희곡>한국시', '시'],
    ['국내도서>소설/시/희곡>외국시', '시'],
    ['국내도서>에세이>한국에세이', '에세이'],
    ['국내도서>인문학>철학 일반', '인문'],
    ['국내도서>경제경영>마케팅/세일즈', '경제·경영'],
    ['국내도서>자기계발>성공', '자기계발'],
    ['국내도서>어린이>동화/명작/고전', '어린이·청소년'],
    ['국내도서>요리/살림>요리', FALLBACK_GENRE],
    ['국내도서', FALLBACK_GENRE],
  ])('%s → %s', (category, genre) => {
    expect(genreFromAladinCategory(category)).toBe(genre);
  });

  it('returns null without a category', () => {
    expect(genreFromAladinCategory(undefined)).toBeNull();
  });
});

describe('resolveGenre', () => {
  it('keeps a stored genre', () => {
    expect(
      resolveGenre({ genre: '에세이', category: '국내도서>소설/시/희곡' })
    ).toBe('에세이');
  });

  it('ignores a stored value that is not a known genre', () => {
    expect(resolveGenre({ genre: '소설/시/희곡', kdc: '814' })).toBe('에세이');
  });

  it('prefers KDC over the Aladin category, then falls back', () => {
    expect(
      resolveGenre({ kdc: '911', category: '국내도서>소설/시/희곡' })
    ).toBe('역사');
    expect(resolveGenre({ category: '국내도서>과학>물리학' })).toBe('과학');
    expect(resolveGenre({})).toBe(FALLBACK_GENRE);
  });

  it('always returns one of the known genres', () => {
    for (const input of [
      {},
      { kdc: '999' },
      { category: '외국도서>Fiction' },
    ]) {
      expect(GENRES).toContain(resolveGenre(input));
    }
  });
});
