/**
 * API 응답 Zod 스키마 정의
 * 
 * 런타임 타입 검증을 위한 Zod 스키마
 * 백엔드 응답 형식이 변경되면 런타임에서 즉시 감지 가능
 */

import { z } from 'zod';

// 기본 타입 스키마
export const userSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  image: z.string().optional(),
});

export const bookSchema = z.object({
  id: z.string(),
  isbn: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  publisher: z.string().optional(),
  publishedDate: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  price: z.number().optional(),
  url: z.string().optional(),
  genre: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const bookReviewSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string(),
  isRecommended: z.boolean(),
  tags: z.array(z.string()),
  purchaseLink: z.string().optional(),
  viewCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
  bookId: z.string(),
  user: userSchema,
  book: bookSchema,
  _count: z.object({
    likes: z.number(),
    comments: z.number(),
  }).optional(),
});

// API 응답 스키마
export const createReviewResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    review: bookReviewSchema,
    message: z.string(),
  }),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    errorType: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

// Union 타입으로 성공/실패 응답 구분
export const reviewApiResponseSchema = z.union([
  createReviewResponseSchema,
  errorResponseSchema,
]);

// 타입 추출
export type CreateReviewResponseZod = z.infer<typeof createReviewResponseSchema>;
export type ErrorResponseZod = z.infer<typeof errorResponseSchema>;