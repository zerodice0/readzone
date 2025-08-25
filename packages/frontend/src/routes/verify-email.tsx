import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'

const VerifyEmailSearchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
  validateSearch: VerifyEmailSearchSchema,
})