import type { Id } from 'convex/_generated/dataModel';

/**
 * Convex DB에서 가져온 책 데이터 타입
 */
export interface BookData {
  _id: Id<'books'>;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: number;
  coverImageUrl?: string;
  description?: string;
}

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
