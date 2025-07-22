import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
});

export const signUpSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  nickname: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다')
    .max(20, '닉네임은 최대 20자까지 가능합니다'),
});

export const bookReviewSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(10, '독후감은 최소 10자 이상 작성해주세요'),
  isRecommended: z.boolean(),
  tags: z.string(),
  purchaseLink: z.string().url().optional().or(z.literal('')),
});

export const bookOpinionSchema = z.object({
  content: z
    .string()
    .min(1, '의견을 입력해주세요')
    .max(280, '의견은 280자까지 작성 가능합니다'),
  isRecommended: z.boolean(),
});