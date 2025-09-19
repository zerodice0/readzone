import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BookSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsEnum(['db', 'api', 'all'])
  source?: 'db' | 'api' | 'all' = 'all';

  @IsOptional()
  @IsEnum(['relevance', 'newest', 'popular', 'title'])
  sort?: 'relevance' | 'newest' | 'popular' | 'title' = 'relevance';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genre?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  publisher?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  publishYearFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  publishYearTo?: number;
}

export class ManualBookDto {
  @IsString()
  title: string;

  @IsString()
  author: string;

  @IsString()
  publisher: string;

  @IsString()
  publishedDate: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genre?: string[];
}

export interface BookSearchResult {
  id?: string;
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  isbn?: string;
  coverImage?: string;
  description?: string;
  genre?: string[];

  // Statistics (DB books only)
  stats?: {
    reviewCount: number;
    averageRating?: number;
    recentReviews: number;
  };

  source: 'db' | 'api';
  isExisting: boolean;
}

export interface BookSearchResponse {
  books: BookSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  sources: {
    db: number;
    api: number;
  };
}
