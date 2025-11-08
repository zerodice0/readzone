export interface ExternalBook {
  externalId: string;
  externalSource: 'GOOGLE_BOOKS' | 'ALADIN' | 'MANUAL';
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  coverImageUrl?: string;
  description?: string;
  pageCount?: number | null;
  language?: string;
}

export interface SearchResult {
  data: ExternalBook[];
  meta: {
    source: string;
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    timestamp: string;
    error?: string;
  };
}

export interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    language?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    imageLinks?: {
      thumbnail?: string;
    };
  };
}

export interface GoogleBooksResponse {
  items?: GoogleBookItem[];
  totalItems?: number;
}

export interface AladinItem {
  itemId: string;
  isbn13: string;
  title: string;
  author: string;
  publisher: string;
  pubDate: string;
  cover: string;
  description: string;
}

export interface AladinResponse {
  item?: AladinItem[];
  totalResults?: number;
}
