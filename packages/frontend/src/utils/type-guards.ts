/**
 * Type guard utilities for runtime type validation
 * Useful for validating API responses and external data
 */

import type {
  Review,
  UserSummary,
  BookSummary,
  FeedResponse,
  ToggleLikeResponse,
  ToggleBookmarkResponse,
} from '../types/review';
import type {
  Book,
  BookSearchResult,
  BookSearchResponse,
} from '../types/book';

/**
 * Type guard for UserSummary
 */
export function isUserSummary(value: unknown): value is UserSummary {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    (user.profileImage === null || typeof user.profileImage === 'string')
  );
}

/**
 * Type guard for BookSummary
 */
export function isBookSummary(value: unknown): value is BookSummary {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const book = value as Record<string, unknown>;

  return (
    typeof book.id === 'string' &&
    typeof book.title === 'string' &&
    typeof book.author === 'string' &&
    (book.coverImageUrl === null || typeof book.coverImageUrl === 'string')
  );
}

/**
 * Type guard for Review readStatus
 */
export function isValidReadStatus(
  value: unknown
): value is 'READING' | 'COMPLETED' | 'DROPPED' {
  return (
    typeof value === 'string' &&
    ['READING', 'COMPLETED', 'DROPPED'].includes(value)
  );
}

/**
 * Type guard for Review status
 */
export function isValidReviewStatus(
  value: unknown
): value is 'DRAFT' | 'PUBLISHED' | 'DELETED' {
  return (
    typeof value === 'string' &&
    ['DRAFT', 'PUBLISHED', 'DELETED'].includes(value)
  );
}

/**
 * Type guard for Review
 */
export function isReview(value: unknown): value is Review {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const review = value as Record<string, unknown>;

  return (
    typeof review.id === 'string' &&
    (review.title === null || typeof review.title === 'string') &&
    typeof review.content === 'string' &&
    typeof review.isRecommended === 'boolean' &&
    (review.rating === null || typeof review.rating === 'number') &&
    isValidReadStatus(review.readStatus) &&
    isValidReviewStatus(review.status) &&
    typeof review.likeCount === 'number' &&
    typeof review.bookmarkCount === 'number' &&
    typeof review.viewCount === 'number' &&
    typeof review.publishedAt === 'string' &&
    typeof review.createdAt === 'string' &&
    typeof review.updatedAt === 'string' &&
    isUserSummary(review.user) &&
    isBookSummary(review.book)
  );
}

/**
 * Type guard for FeedResponse
 */
export function isFeedResponse(value: unknown): value is FeedResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;

  // Validate meta object
  if (
    typeof response.meta !== 'object' ||
    response.meta === null
  ) {
    return false;
  }

  const meta = response.meta as Record<string, unknown>;

  const hasValidMeta =
    typeof meta.page === 'number' &&
    typeof meta.limit === 'number' &&
    typeof meta.total === 'number' &&
    typeof meta.hasMore === 'boolean' &&
    typeof meta.timestamp === 'string';

  if (!hasValidMeta) {
    return false;
  }

  // Validate data array
  if (!Array.isArray(response.data)) {
    return false;
  }

  return response.data.every((item) => isReview(item));
}

/**
 * Type guard for ToggleLikeResponse
 */
export function isToggleLikeResponse(
  value: unknown
): value is ToggleLikeResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;

  // Validate data object
  if (typeof response.data !== 'object' || response.data === null) {
    return false;
  }

  const data = response.data as Record<string, unknown>;

  const hasValidData =
    typeof data.isLiked === 'boolean' &&
    typeof data.likeCount === 'number';

  if (!hasValidData) {
    return false;
  }

  // Validate meta object
  if (typeof response.meta !== 'object' || response.meta === null) {
    return false;
  }

  const meta = response.meta as Record<string, unknown>;

  return typeof meta.timestamp === 'string';
}

/**
 * Type guard for ToggleBookmarkResponse
 */
export function isToggleBookmarkResponse(
  value: unknown
): value is ToggleBookmarkResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;

  // Validate data object
  if (typeof response.data !== 'object' || response.data === null) {
    return false;
  }

  const data = response.data as Record<string, unknown>;

  const hasValidData =
    typeof data.isBookmarked === 'boolean' &&
    typeof data.bookmarkCount === 'number';

  if (!hasValidData) {
    return false;
  }

  // Validate meta object
  if (typeof response.meta !== 'object' || response.meta === null) {
    return false;
  }

  const meta = response.meta as Record<string, unknown>;

  return typeof meta.timestamp === 'string';
}

/**
 * Type guard for Book externalSource
 */
export function isValidExternalSource(
  value: unknown
): value is 'GOOGLE_BOOKS' | 'ALADIN' | 'MANUAL' {
  return (
    typeof value === 'string' &&
    ['GOOGLE_BOOKS', 'ALADIN', 'MANUAL'].includes(value)
  );
}

/**
 * Type guard for BookSearchResult
 */
export function isBookSearchResult(value: unknown): value is BookSearchResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const book = value as Record<string, unknown>;

  return (
    typeof book.externalId === 'string' &&
    isValidExternalSource(book.externalSource) &&
    (book.isbn === null || typeof book.isbn === 'string') &&
    typeof book.title === 'string' &&
    typeof book.author === 'string' &&
    (book.publisher === null || typeof book.publisher === 'string') &&
    (book.publishedDate === null || typeof book.publishedDate === 'string') &&
    (book.coverImageUrl === null || typeof book.coverImageUrl === 'string') &&
    (book.description === null || typeof book.description === 'string') &&
    (book.pageCount === null || typeof book.pageCount === 'number') &&
    (book.language === null || typeof book.language === 'string')
  );
}

/**
 * Type guard for Book
 */
export function isBook(value: unknown): value is Book {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const book = value as Record<string, unknown>;

  return (
    typeof book.id === 'string' &&
    (book.isbn === null || typeof book.isbn === 'string') &&
    typeof book.title === 'string' &&
    typeof book.author === 'string' &&
    (book.publisher === null || typeof book.publisher === 'string') &&
    (book.publishedDate === null || typeof book.publishedDate === 'string') &&
    (book.coverImageUrl === null || typeof book.coverImageUrl === 'string') &&
    (book.description === null || typeof book.description === 'string') &&
    (book.pageCount === null || typeof book.pageCount === 'number') &&
    (book.language === null || typeof book.language === 'string') &&
    (book.externalId === null || typeof book.externalId === 'string') &&
    (book.externalSource === null ||
      isValidExternalSource(book.externalSource)) &&
    typeof book.createdAt === 'string' &&
    typeof book.updatedAt === 'string'
  );
}

/**
 * Type guard for BookSearchResponse
 */
export function isBookSearchResponse(
  value: unknown
): value is BookSearchResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;

  // Validate meta object
  if (typeof response.meta !== 'object' || response.meta === null) {
    return false;
  }

  const meta = response.meta as Record<string, unknown>;

  if (typeof meta.timestamp !== 'string') {
    return false;
  }

  // Validate data array
  if (!Array.isArray(response.data)) {
    return false;
  }

  return response.data.every((item) => isBookSearchResult(item));
}

/**
 * Type guard for checking if a value is a non-null object
 * Useful for validating unknown API responses
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for checking if a value is a string array
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Type guard for checking if a value is a number within a range
 * Useful for validating ratings (e.g., 1-5)
 */
export function isNumberInRange(
  value: unknown,
  min: number,
  max: number
): value is number {
  return typeof value === 'number' && value >= min && value <= max;
}
