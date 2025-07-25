import { z } from 'zod'

// 회원가입 검증 스키마
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '비밀번호는 영문과 숫자를 포함해야 합니다.'
    ),
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(20, '닉네임은 20자 이하여야 합니다.')
    .regex(
      /^[가-힣a-zA-Z0-9_-]+$/,
      '닉네임은 한글, 영문, 숫자, _, - 만 사용 가능합니다.'
    ),
})

// 로그인 검증 스키마
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

// 중복 확인 검증 스키마
export const checkDuplicateSchema = z.object({
  field: z.enum(['email', 'nickname']),
  value: z.string().min(1, '값을 입력해주세요.'),
})

// 이메일 인증 검증 스키마
export const verifyEmailSchema = z.object({
  token: z.string().min(1, '인증 토큰이 필요합니다.'),
})

// 비밀번호 재설정 검증 스키마
export const resetPasswordSchema = z.object({
  token: z.string().min(1, '재설정 토큰이 필요합니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '비밀번호는 영문과 숫자를 포함해야 합니다.'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
})

// 독후감 생성/수정 검증 스키마
export const createReviewSchema = z.object({
  bookId: z.string().min(1, '도서 ID가 필요합니다.'),
  title: z.string().max(200, '제목은 200자 이하여야 합니다.').optional(),
  content: z
    .string()
    .min(10, '독후감 내용은 10자 이상이어야 합니다.')
    .max(50000, '독후감 내용은 50,000자를 초과할 수 없습니다.'),
  isRecommended: z.boolean(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(10, '태그는 최대 10개까지 가능합니다.')
    .default([]),
  purchaseLink: z
    .string()
    .url('올바른 URL 형식이 아닙니다.')
    .optional()
    .or(z.literal('')),
})

export const updateReviewSchema = createReviewSchema.partial().omit({ bookId: true })

// 독후감 목록 조회 검증 스키마
export const listReviewsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  userId: z.string().nullish(),
  bookId: z.string().nullish(),
  tags: z.string().nullish(), // 쉼표로 구분된 태그 문자열
  sort: z.enum(['latest', 'popular', 'recommended']).nullish().default('latest'),
  search: z.string().max(100).nullish(), // 제목 또는 내용 검색
})

// 독후감 임시저장 검증 스키마
export const reviewDraftSchema = z.object({
  content: z.string().max(50000, '내용은 50,000자를 초과할 수 없습니다.'),
  bookId: z.string().optional(),
  title: z.string().max(200).optional(),
  metadata: z.record(z.any()).default({}),
})

// 이미지 업로드 검증 스키마 (클라이언트 사이드용)
export const imageUploadSchema = z.object({
  file: z.instanceof(File, { message: '파일이 필요합니다.' })
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      { message: '파일 크기는 5MB 이하여야 합니다.' }
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      { message: '지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP, GIF만 지원)' }
    )
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CheckDuplicateInput = z.infer<typeof checkDuplicateSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
// 댓글 생성 검증 스키마
export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, '댓글은 2자 이상 입력해주세요.')
    .max(1000, '댓글은 1000자 이하로 입력해주세요.')
    .refine(
      (content) => content.replace(/\s/g, '').length >= 2,
      { message: '의미 있는 댓글을 입력해주세요.' }
    ),
  parentId: z.string().optional(), // 대댓글인 경우
})

// 댓글 수정 검증 스키마
export const updateCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, '댓글은 2자 이상 입력해주세요.')
    .max(1000, '댓글은 1000자 이하로 입력해주세요.')
    .refine(
      (content) => content.replace(/\s/g, '').length >= 2,
      { message: '의미 있는 댓글을 입력해주세요.' }
    ),
})

// 댓글 목록 조회 검증 스키마
export const listCommentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['latest', 'oldest', 'most_liked']).default('latest'),
  parentId: z.string().nullish(), // null이면 최상위 댓글만
})

// 댓글 좋아요 응답 스키마
export const commentLikeResponseSchema = z.object({
  success: z.boolean(),
  isLiked: z.boolean(),
  likesCount: z.number(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
export type ListReviewsQuery = z.infer<typeof listReviewsSchema>
export type ReviewDraftInput = z.infer<typeof reviewDraftSchema>
export type ImageUploadInput = z.infer<typeof imageUploadSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
export type ListCommentsQuery = z.infer<typeof listCommentsSchema>
export type CommentLikeResponse = z.infer<typeof commentLikeResponseSchema>