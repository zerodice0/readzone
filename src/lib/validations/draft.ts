/**
 * Enhanced validation schemas for draft system
 * Includes validation for new draft fields and audit system
 */
import { z } from 'zod'

// Draft status enum validation
export const draftStatusSchema = z.enum(['DRAFT', 'EXPIRED', 'ABANDONED', 'MIGRATED'])

// Audit action enum validation  
export const auditActionSchema = z.enum(['CREATED', 'UPDATED', 'BOOK_SYNCED', 'EXPIRED', 'DELETED'])

// Enhanced review draft input schema
export const reviewDraftInputSchema = z.object({
  // Core fields
  bookId: z.string().optional(),
  title: z.string().max(200).optional(),
  content: z.string()
    .min(1, '내용을 입력해주세요')
    .max(1048576, '내용이 너무 깁니다 (최대 1MB)'), // 1MB limit
  
  // Metadata (existing)
  metadata: z.record(z.any()).default({}),
  
  // New fields for enhanced system
  bookData: z.string().optional().refine(
    (val) => {
      if (!val) return true
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    },
    { message: 'bookData must be valid JSON' }
  ),
  
  status: draftStatusSchema.default('DRAFT'),
  version: z.number().int().min(1).default(1),
  expiresAt: z.date().optional(),
  lastAccessed: z.date().optional()
})

// Draft update schema (for optimistic locking)
export const reviewDraftUpdateSchema = reviewDraftInputSchema.extend({
  id: z.string(),
  expectedVersion: z.number().int().min(1),
  version: z.number().int().min(1)
})

// Draft query parameters
export const draftQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(5),
  status: draftStatusSchema.optional(),
  includeExpired: z.coerce.boolean().default(false)
})

// Draft audit log schema
export const reviewDraftAuditSchema = z.object({
  draftId: z.string(),
  userId: z.string(),
  action: auditActionSchema,
  oldData: z.string().optional().refine(
    (val) => {
      if (!val) return true
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    },
    { message: 'oldData must be valid JSON' }
  ),
  newData: z.string().optional().refine(
    (val) => {
      if (!val) return true
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    },
    { message: 'newData must be valid JSON' }
  )
})

// Book synchronization schema
export const bookSyncSchema = z.object({
  draftId: z.string(),
  oldBookId: z.string().optional(),
  newBookId: z.string(),
  syncReason: z.enum(['USER_SELECTION', 'AUTO_DISCOVERY', 'MANUAL_OVERRIDE']).default('AUTO_DISCOVERY')
})

// Draft cleanup criteria
export const cleanupCriteriaSchema = z.object({
  olderThan: z.date(),
  status: draftStatusSchema.array().default(['EXPIRED']),
  batchSize: z.number().int().min(1).max(1000).default(100),
  dryRun: z.boolean().default(false)
})

// Draft restoration request
export const draftRestorationSchema = z.object({
  draftId: z.string(),
  action: z.enum(['RESTORE', 'DELETE', 'ARCHIVE']),
  userId: z.string()
})

// Performance monitoring schema
export const draftPerformanceSchema = z.object({
  operation: z.enum(['CREATE', 'UPDATE', 'LIST', 'DELETE', 'SYNC', 'CLEANUP']),
  duration: z.number().min(0),
  success: z.boolean(),
  recordCount: z.number().int().min(0).optional(),
  errorType: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

// Type exports
export type ReviewDraftInput = z.infer<typeof reviewDraftInputSchema>
export type ReviewDraftUpdate = z.infer<typeof reviewDraftUpdateSchema>
export type DraftQuery = z.infer<typeof draftQuerySchema>
export type ReviewDraftAudit = z.infer<typeof reviewDraftAuditSchema>
export type BookSync = z.infer<typeof bookSyncSchema>
export type CleanupCriteria = z.infer<typeof cleanupCriteriaSchema>
export type DraftRestoration = z.infer<typeof draftRestorationSchema>
export type DraftPerformance = z.infer<typeof draftPerformanceSchema>
export type DraftStatus = z.infer<typeof draftStatusSchema>
export type AuditAction = z.infer<typeof auditActionSchema>

// Validation helper functions
export const validateDraftContent = (content: string): { isValid: boolean; textLength: number; htmlLength: number } => {
  const htmlLength = content.length
  const textLength = content.replace(/<[^>]*>/g, '').trim().length
  
  return {
    isValid: htmlLength <= 1048576 && textLength >= 10, // 1MB HTML, 10+ chars text
    textLength,
    htmlLength
  }
}

export const validateBookData = (bookData: string | null): { isValid: boolean; parsed?: any; error?: string } => {
  if (!bookData) return { isValid: true }
  
  try {
    const parsed = JSON.parse(bookData)
    return { isValid: true, parsed }
  } catch (error) {
    return { isValid: false, error: 'Invalid JSON format' }
  }
}

export const validateExpirationDate = (expiresAt: Date): { isValid: boolean; daysUntilExpiry: number } => {
  const now = new Date()
  const diffMs = expiresAt.getTime() - now.getTime()
  const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  return {
    isValid: daysUntilExpiry > 0,
    daysUntilExpiry
  }
}

// Default values and constants
export const DRAFT_DEFAULTS = {
  STATUS: 'DRAFT' as const,
  VERSION: 1,
  EXPIRY_DAYS: 7,
  MAX_CONTENT_SIZE: 1048576, // 1MB
  MIN_TEXT_LENGTH: 10,
  MAX_DRAFTS_PER_USER: 5
} as const

export const AUDIT_ACTIONS = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED', 
  BOOK_SYNCED: 'BOOK_SYNCED',
  EXPIRED: 'EXPIRED',
  DELETED: 'DELETED'
} as const

export const DRAFT_STATUSES = {
  DRAFT: 'DRAFT',
  EXPIRED: 'EXPIRED',
  ABANDONED: 'ABANDONED',
  MIGRATED: 'MIGRATED'
} as const