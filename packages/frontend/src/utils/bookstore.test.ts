import { describe, expect, it } from 'vitest';
import { getBookstoreLinks } from './bookstore';
import { getGenreLabel } from './category';

describe('getBookstoreLinks', () => {
  it('searches each store by ISBN when available', () => {
    const links = getBookstoreLinks({
      isbn: '9791191824001',
      title: '지구 끝의 온실',
      author: '김초엽',
    });
    expect(links.map((link) => link.name)).toEqual([
      '알라딘',
      '교보문고',
      'YES24',
    ]);
    for (const link of links) {
      expect(link.url).toContain('9791191824001');
      expect(link.url.startsWith('https://')).toBe(true);
    }
  });

  it('falls back to an encoded title and author', () => {
    const [aladin] = getBookstoreLinks({
      isbn: '',
      title: '지구 끝의 온실',
      author: '김초엽',
    });
    expect(aladin?.url).toContain(encodeURIComponent('지구 끝의 온실 김초엽'));
  });
});

describe('getGenreLabel', () => {
  it('prefers the ReadZone genre', () => {
    expect(
      getGenreLabel({ genre: '에세이', category: '국내도서>소설/시/희곡' })
    ).toBe('에세이');
  });

  it('shows the Aladin middle category for books not backfilled yet', () => {
    expect(getGenreLabel({ category: '국내도서>인문학>철학 일반' })).toBe(
      '인문학'
    );
  });

  it('returns null without any category', () => {
    expect(getGenreLabel({})).toBeNull();
    expect(getGenreLabel(null)).toBeNull();
  });
});
