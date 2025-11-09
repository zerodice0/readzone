export interface Book {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  publishedDate: string | null;
  coverImageUrl: string | null;
  description: string | null;
  pageCount: number | null;
  language: string | null;
  externalId: string | null;
  externalSource: 'GOOGLE_BOOKS' | 'ALADIN' | 'MANUAL' | null;
  createdAt: string;
  updatedAt: string;
  reviewCount?: number;
}

export interface BookSearchResult {
  externalId: string;
  externalSource: 'GOOGLE_BOOKS' | 'ALADIN' | 'MANUAL';
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  publishedDate: string | null;
  coverImageUrl: string | null;
  description: string | null;
  pageCount: number | null;
  language: string | null;
}

export interface BookSearchResponse {
  data: BookSearchResult[];
  meta: {
    timestamp: string;
  };
}
