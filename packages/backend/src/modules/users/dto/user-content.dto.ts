import { IsOptional, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UserReviewsQueryDto {
  @IsOptional()
  @IsEnum(['newest', 'oldest', 'popular'])
  sort?: 'newest' | 'oldest' | 'popular' = 'newest';

  @IsOptional()
  @IsEnum(['public', 'private'])
  visibility?: 'public' | 'private';

  @IsOptional()
  @IsString()
  cursor?: string; // 마지막 항목의 ID

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class UserLikesQueryDto {
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

export class UserBooksQueryDto {
  @IsOptional()
  @IsEnum(['read', 'reading', 'want_to_read'])
  status?: 'read' | 'reading' | 'want_to_read';

  @IsOptional()
  @IsEnum(['recent', 'title', 'rating'])
  sort?: 'recent' | 'title' | 'rating' = 'recent';

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

export class UserFollowsQueryDto {
  @IsEnum(['followers', 'following'])
  type: 'followers' | 'following';

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

// Response DTOs
export interface UserReviewSummary {
  id: string;
  title: string;
  content: string;
  rating: number | null;
  tags: string | null;
  createdAt: string;
  isPublic: boolean;
  book: {
    id: string;
    title: string;
    author: string;
    thumbnail: string | null;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface UserLikeSummary {
  id: string;
  likedAt: string;
  review: UserReviewSummary;
}

export interface UserBookSummary {
  id: string;
  status: string;
  rating: number | null;
  readAt: string | null;
  addedAt: string;
  book: {
    id: string;
    title: string;
    author: string;
    thumbnail: string | null;
    publishedAt: string | null;
  };
  reviewId: string | null;
}

export interface UserFollowSummary {
  id: string;
  followedAt: string;
  user: {
    id: string;
    userid: string;
    nickname: string;
    profileImage: string | null;
    isVerified: boolean;
  };
}

export interface PaginationInfo {
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

export interface UserReviewsResponse {
  reviews: UserReviewSummary[];
  pagination: PaginationInfo;
}

export interface UserLikesResponse {
  reviews: UserLikeSummary[];
  pagination: PaginationInfo;
}

export interface UserBooksResponse {
  books: UserBookSummary[];
  pagination: PaginationInfo;
  summary: {
    totalBooks: number;
    readBooks: number;
    readingBooks: number;
    wantToReadBooks: number;
  };
}

export interface UserFollowsResponse {
  users: UserFollowSummary[];
  pagination: PaginationInfo;
}