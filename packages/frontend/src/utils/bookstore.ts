/**
 * 서점 링크
 *
 * 알라딘 OpenAPI 종료(2026-10-30) 이후 새 책은 상품 페이지 링크를 받을 수 없어,
 * ISBN(없으면 제목과 저자)으로 각 서점의 검색 결과를 연다.
 * 이전에 저장된 알라딘 상품·전자책 링크가 있으면 그 링크를 그대로 쓴다.
 */
export interface BookstoreLink {
  name: string;
  url: string;
}

export function getBookstoreLinks(book: {
  isbn?: string | null;
  title: string;
  author?: string | null;
  aladinUrl?: string | null;
  ebookUrl?: string | null;
}): BookstoreLink[] {
  const query =
    book.isbn?.trim() || [book.title, book.author].filter(Boolean).join(' ');
  const q = encodeURIComponent(query);

  const links: BookstoreLink[] = [
    {
      name: '알라딘',
      url:
        book.aladinUrl ||
        `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Book&SearchWord=${q}`,
    },
    {
      name: '교보문고',
      url: `https://search.kyobobook.co.kr/search?keyword=${q}`,
    },
    {
      name: 'YES24',
      url: `https://www.yes24.com/Product/Search?domain=BOOK&query=${q}`,
    },
  ];

  if (book.ebookUrl) {
    links.push({ name: '알라딘 전자책', url: book.ebookUrl });
  }

  return links;
}
