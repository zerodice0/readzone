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
   * Users Table
   * Clerk 사용자 정보 저장 (Webhook으로 동기화)
   */
  users: defineTable({
    clerkUserId: v.string(), // Clerk subject ID
    name: v.optional(v.string()), // 표시 이름
    imageUrl: v.optional(v.string()), // 프로필 이미지 URL
    email: v.optional(v.string()), // 이메일
    username: v.optional(v.string()), // Clerk username
    updatedAt: v.number(), // 마지막 업데이트 시간
  }).index('by_clerk_id', ['clerkUserId']),

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
    // 알라딘 구매 링크
    aladinUrl: v.optional(v.string()), // 종이책 구매 URL
    ebookUrl: v.optional(v.string()), // 전자책 구매 URL
    // 장르/카테고리 (알라딘: "국내도서>소설/시/희곡>한국소설" 형식)
    category: v.optional(v.string()), // 원본 카테고리 문자열
  })
    .index('by_isbn', ['isbn'])
    .index('by_title', ['title'])
    .index('by_author', ['author'])
    .index('by_external', ['externalSource', 'externalId'])
    .index('by_category', ['category']),

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
