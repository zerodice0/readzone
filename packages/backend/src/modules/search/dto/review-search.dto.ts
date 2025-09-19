import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsEnum(['recommend', 'not_recommend'])
  rating?: 'recommend' | 'not_recommend';

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minLikes?: number;

  @IsOptional()
  @IsEnum(['relevance', 'newest', 'popular', 'rating'])
  sort?: 'relevance' | 'newest' | 'popular' | 'rating' = 'relevance';

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export interface ReviewSearchResult {
  id: string;
  content: string; // Highlighted summary (150 chars)
  rating: 'recommend' | 'not_recommend';
  tags: string[];
  createdAt: string;

  author: {
    id: string;
    username: string;
    profileImage?: string;
  };

  book: {
    id: string;
    title: string;
    author: string;
    coverImage?: string;
  };

  stats: {
    likes: number;
    comments: number;
  };

  highlights?: {
    content?: string[];
    tags?: string[];
  };
}

export interface ReviewSearchResponse {
  reviews: ReviewSearchResult[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  };
  facets: {
    ratings: { recommend: number; not_recommend: number };
    authors: Array<{ username: string; count: number }>;
    books: Array<{ title: string; count: number }>;
  };
}
