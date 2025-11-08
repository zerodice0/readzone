import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type {
  ExternalBook,
  SearchResult,
  GoogleBooksResponse,
  AladinResponse,
} from '../types/external-book.types';

@Injectable()
export class BookApiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async search(query: {
    q: string;
    source?: string;
    page?: number;
    limit?: number;
  }): Promise<SearchResult> {
    const { q, source = 'all', page = 0, limit = 10 } = query;

    if (source === 'google') {
      return this.searchGoogleBooks(q, page, limit);
    }
    if (source === 'aladin') {
      return this.searchAladin(q, page, limit);
    }
    // Parallel search
    const results = await Promise.allSettled([
      this.searchGoogleBooks(q, page, limit),
      this.searchAladin(q, page, limit),
    ]);

    // Merge and deduplicate
    const allBooks: ExternalBook[] = [];

    if (results[0].status === 'fulfilled') {
      allBooks.push(...results[0].value.data);
    }

    if (results[1].status === 'fulfilled') {
      allBooks.push(...results[1].value.data);
    }

    // Deduplicate by ISBN
    const uniqueBooks = this.deduplicateBooks(allBooks);

    return {
      data: uniqueBooks.slice(0, limit),
      meta: {
        source: 'all',
        page,
        limit,
        total: uniqueBooks.length,
        hasMore: uniqueBooks.length > limit,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async searchGoogleBooks(
    query: string,
    page: number,
    limit: number
  ): Promise<SearchResult> {
    const apiKey = this.configService.get<string>('GOOGLE_BOOKS_API_KEY');
    const startIndex = page * limit;

    try {
      const response = await firstValueFrom(
        this.httpService.get<GoogleBooksResponse>(
          'https://www.googleapis.com/books/v1/volumes',
          {
            params: {
              q: query,
              maxResults: limit,
              startIndex,
              key: apiKey,
            },
            timeout: 10000,
          }
        )
      );

      const books: ExternalBook[] =
        response.data.items?.map((item) => ({
          externalId: item.id,
          externalSource: 'GOOGLE_BOOKS' as const,
          isbn: item.volumeInfo.industryIdentifiers?.find(
            (id) => id.type === 'ISBN_13'
          )?.identifier,
          title: item.volumeInfo.title,
          author: item.volumeInfo.authors?.join(', ') || '',
          publisher: item.volumeInfo.publisher,
          publishedDate: item.volumeInfo.publishedDate,
          coverImageUrl: item.volumeInfo.imageLinks?.thumbnail,
          description: item.volumeInfo.description,
          pageCount: item.volumeInfo.pageCount,
          language: item.volumeInfo.language,
        })) || [];

      return {
        data: books,
        meta: {
          source: 'GOOGLE_BOOKS',
          page,
          limit,
          total: response.data.totalItems || 0,
          hasMore: startIndex + limit < (response.data.totalItems || 0),
          timestamp: new Date().toISOString(),
        },
      };
    } catch {
      return {
        data: [],
        meta: {
          source: 'GOOGLE_BOOKS',
          page,
          limit,
          total: 0,
          hasMore: false,
          timestamp: new Date().toISOString(),
          error: 'Google Books API 호출 실패',
        },
      };
    }
  }

  private async searchAladin(
    query: string,
    page: number,
    limit: number
  ): Promise<SearchResult> {
    const apiKey = this.configService.get<string>('ALADIN_API_KEY');
    const start = page * limit + 1;

    try {
      const response = await firstValueFrom(
        this.httpService.get<AladinResponse>(
          'http://www.aladin.co.kr/ttb/api/ItemSearch.aspx',
          {
            params: {
              Query: query,
              QueryType: 'Keyword',
              MaxResults: limit,
              start,
              output: 'js',
              Version: '20131101',
              ttbkey: apiKey,
            },
            timeout: 10000,
          }
        )
      );

      const books: ExternalBook[] =
        response.data.item?.map((item) => ({
          externalId: String(item.itemId),
          externalSource: 'ALADIN' as const,
          isbn: item.isbn13,
          title: item.title,
          author: item.author,
          publisher: item.publisher,
          publishedDate: item.pubDate,
          coverImageUrl: item.cover,
          description: item.description,
          pageCount: null,
          language: 'ko',
        })) || [];

      return {
        data: books,
        meta: {
          source: 'ALADIN',
          page,
          limit,
          total: response.data.totalResults || 0,
          hasMore: start + limit - 1 < (response.data.totalResults || 0),
          timestamp: new Date().toISOString(),
        },
      };
    } catch {
      return {
        data: [],
        meta: {
          source: 'ALADIN',
          page,
          limit,
          total: 0,
          hasMore: false,
          timestamp: new Date().toISOString(),
          error: 'Aladin API 호출 실패',
        },
      };
    }
  }

  private deduplicateBooks(books: ExternalBook[]): ExternalBook[] {
    const seen = new Map<string, boolean>();
    const result: ExternalBook[] = [];

    books.forEach((book) => {
      const key = book.isbn || `${book.title}:${book.author}`;
      if (!seen.has(key)) {
        seen.set(key, true);
        result.push(book);
      }
    });

    return result;
  }
}
