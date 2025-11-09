import { ReadStatus, ReviewStatus } from '@prisma/client';

/**
 * User summary for review responses
 */
export interface UserSummary {
  id: string;
  name: string | null;
  profileImage: string | null;
}

/**
 * Book summary for review responses
 */
export interface BookSummary {
  id: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
}

/**
 * Book detail for single review response
 */
export interface BookDetail extends BookSummary {
  isbn: string | null;
  publisher: string | null;
  publishedDate: Date | null;
  description: string | null;
  pageCount: number | null;
}

/**
 * Review response DTO for feed items
 */
export interface ReviewFeedItemDto {
  id: string;
  title: string | null;
  content: string; // Truncated to 150 chars in service layer
  isRecommended: boolean;
  rating: number | null;
  readStatus: ReadStatus;
  likeCount: number;
  bookmarkCount: number;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: UserSummary;
  book: BookSummary;
  isLikedByMe?: boolean;
  isBookmarkedByMe?: boolean;
}

/**
 * Review response DTO for detail view
 */
export interface ReviewDetailDto {
  id: string;
  title: string | null;
  content: string; // Full content
  isRecommended: boolean;
  rating: number | null;
  readStatus: ReadStatus;
  likeCount: number;
  bookmarkCount: number;
  viewCount: number;
  status: ReviewStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: UserSummary;
  book: BookDetail;
  isLikedByMe?: boolean;
  isBookmarkedByMe?: boolean;
}

/**
 * Feed response with pagination metadata
 */
export interface FeedResponseDto {
  data: ReviewFeedItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    timestamp: Date;
  };
}

/**
 * Single review response with metadata
 */
export interface ReviewResponseDto {
  data: ReviewDetailDto;
  meta: {
    timestamp: Date;
  };
}

/**
 * Created review response (simplified, no user/book relations)
 */
export interface CreateReviewResponseDto {
  data: {
    id: string;
    bookId: string;
    title: string | null;
    content: string;
    isRecommended: boolean;
    rating: number | null;
    readStatus: ReadStatus;
    status: ReviewStatus;
    likeCount: number;
    bookmarkCount: number;
    viewCount: number;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  meta: {
    timestamp: Date;
  };
}
