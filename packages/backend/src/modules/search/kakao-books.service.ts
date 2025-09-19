import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { BookSearchResult } from './dto/book-search.dto';

interface KakaoBookDocument {
  title: string;
  authors: string[];
  publisher: string;
  datetime: string;
  isbn: string;
  thumbnail: string;
  contents: string;
  price: number;
  sale_price: number;
  status: string;
  translators: string[];
  url: string;
  category: string;
}

interface KakaoSearchResponse {
  documents: KakaoBookDocument[];
  meta: {
    is_end: boolean;
    pageable_count: number;
    total_count: number;
  };
}

@Injectable()
export class KakaoBooksService {
  private readonly logger = new Logger(KakaoBooksService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('KAKAO_REST_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn('KAKAO_REST_API_KEY is not configured');
    }

    this.client = axios.create({
      baseURL: 'https://dapi.kakao.com/v3/search',
      headers: {
        Authorization: `KakaoAK ${this.apiKey}`,
      },
      timeout: 5000,
    });
  }

  async searchBooks(
    query: string,
    page: number = 1,
    size: number = 20,
  ): Promise<{ books: BookSearchResult[]; total: number; hasMore: boolean }> {
    if (!this.apiKey) {
      this.logger.warn('Kakao API key not configured, returning empty results');
      return { books: [], total: 0, hasMore: false };
    }

    try {
      const response = await this.client.get<KakaoSearchResponse>('/book', {
        params: {
          query,
          page,
          size,
          sort: 'accuracy', // accuracy | latest
        },
      });

      const books: BookSearchResult[] = response.data.documents.map((doc) =>
        this.transformKakaoBook(doc),
      );

      return {
        books,
        total: response.data.meta.total_count,
        hasMore: !response.data.meta.is_end,
      };
    } catch (error) {
      this.logger.error('Failed to search books from Kakao API', error);
      return { books: [], total: 0, hasMore: false };
    }
  }

  async searchBookByIsbn(isbn: string): Promise<BookSearchResult | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await this.client.get<KakaoSearchResponse>('/book', {
        params: {
          query: isbn,
          target: 'isbn',
          size: 1,
        },
      });

      if (response.data.documents.length > 0) {
        return this.transformKakaoBook(response.data.documents[0]);
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to search book by ISBN from Kakao API', error);
      return null;
    }
  }

  private transformKakaoBook(doc: KakaoBookDocument): BookSearchResult {
    // Extract ISBN-10 and ISBN-13 from the ISBN field
    const isbnParts = doc.isbn.split(' ');
    const isbn13 = isbnParts.find((part) => part.length === 13);
    const isbn10 = isbnParts.find((part) => part.length === 10);

    // Parse category to extract genre
    const genre = doc.category ? this.parseCategory(doc.category) : undefined;

    return {
      title: doc.title,
      author: doc.authors.join(', '),
      publisher: doc.publisher,
      publishedDate: doc.datetime.split('T')[0], // Extract date part
      isbn: isbn13 || isbn10 || doc.isbn,
      coverImage: doc.thumbnail,
      description: doc.contents,
      genre: genre ? [genre] : [],
      source: 'api',
      isExisting: false,
    };
  }

  private parseCategory(category: string): string {
    // Kakao returns categories like "소설 > 한국소설 > 현대소설"
    // Extract the main category
    const parts = category.split('>').map((s) => s.trim());

    // Map to our standard genres
    const categoryMap: Record<string, string> = {
      소설: '소설',
      시: '시/에세이',
      에세이: '시/에세이',
      자기계발: '자기계발',
      경제경영: '경제경영',
      인문: '인문',
      역사: '역사/문화',
      문화: '역사/문화',
      과학: '과학',
      기술: '과학',
      공학: '과학',
      예술: '예술/대중문화',
      대중문화: '예술/대중문화',
      종교: '종교/역학',
      사회: '사회/정치',
      정치: '사회/정치',
      여행: '여행',
      요리: '건강/취미/실용',
      건강: '건강/취미/실용',
      취미: '건강/취미/실용',
      가정: '가정/육아',
      육아: '가정/육아',
      어린이: '어린이',
      청소년: '청소년',
      만화: '만화',
      외국어: '외국어',
      수험서: '수험서/자격증',
      자격증: '수험서/자격증',
      컴퓨터: 'IT/컴퓨터',
      IT: 'IT/컴퓨터',
    };

    // Find matching category
    for (const part of parts) {
      for (const [key, value] of Object.entries(categoryMap)) {
        if (part.includes(key)) {
          return value;
        }
      }
    }

    return parts[0] || '기타';
  }
}
