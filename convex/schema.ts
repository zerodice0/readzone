import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Convex Schema for ReadZone
 *
 * Migration from Prisma:
 * - User, Session, OAuth, MFA → Replaced by Clerk
 * - Books, Reviews, Likes, Bookmarks → Migrated to Convex
 */

export default defineSchema({
  /**
   * Books Table
   * 책 정보 저장
   */
  books: defineTable({
    isbn: v.optional(v.string()),
    title: v.string(),
    author: v.string(),
    publisher: v.optional(v.string()),
    publishedDate: v.optional(v.number()), // Unix timestamp (ms)
    coverImageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    language: v.optional(v.string()),
    externalId: v.optional(v.string()),
    externalSource: v.optional(
      v.union(
        v.literal('GOOGLE_BOOKS'),
        v.literal('ALADIN'),
        v.literal('MANUAL')
      )
    ),
  })
    .index('by_isbn', ['isbn'])
    .index('by_title', ['title'])
    .index('by_author', ['author'])
    .index('by_external', ['externalSource', 'externalId']),

  /**
   * Reviews Table
   * 책 리뷰 저장
   * userId는 Clerk의 user ID 사용
   */
  reviews: defineTable({
    userId: v.string(), // Clerk user ID
    bookId: v.id('books'),
    title: v.optional(v.string()),
    content: v.string(),
    rating: v.optional(v.number()), // 1-5
    isRecommended: v.boolean(),
    readStatus: v.union(
      v.literal('READING'),
      v.literal('COMPLETED'),
      v.literal('DROPPED')
    ),
    likeCount: v.number(),
    bookmarkCount: v.number(),
    viewCount: v.number(),
    status: v.union(
      v.literal('DRAFT'),
      v.literal('PUBLISHED'),
      v.literal('DELETED')
    ),
    publishedAt: v.optional(v.number()), // Unix timestamp (ms)
    deletedAt: v.optional(v.number()), // Unix timestamp (ms)
  })
    .index('by_user', ['userId', 'status'])
    .index('by_book', ['bookId', 'status'])
    .index('by_status', ['status', 'publishedAt'])
    .index('by_user_book', ['userId', 'bookId']),

  /**
   * Likes Table
   * 리뷰 좋아요
   */
  likes: defineTable({
    userId: v.string(), // Clerk user ID
    reviewId: v.id('reviews'),
  })
    .index('by_user', ['userId'])
    .index('by_review', ['reviewId'])
    .index('by_user_review', ['userId', 'reviewId']),

  /**
   * Bookmarks Table
   * 리뷰 북마크
   */
  bookmarks: defineTable({
    userId: v.string(), // Clerk user ID
    reviewId: v.id('reviews'),
  })
    .index('by_user', ['userId'])
    .index('by_review', ['reviewId'])
    .index('by_user_review', ['userId', 'reviewId']),
});
