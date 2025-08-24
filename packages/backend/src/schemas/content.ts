import { z } from 'zod'

/**
 * Content 도메인 스키마 정의
 */

// 독후감 콘텐츠 데이터 스키마
export const ContentData = z.object({
  id: z.string(),
  type: z.enum(['terms', 'privacy']),
  version: z.string(),
  content: z.string(),
  effectiveDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
})

// ContentMetadata 스키마 (실제 서비스 데이터 구조에 맞게)
export const ContentMetadata = z.object({
  title: z.string(),
  type: z.enum(['terms-of-service', 'privacy-policy']),
  version: z.string(),
  effectiveDate: z.string(),
  lastModified: z.string(),
  language: z.string(),
  previousVersions: z.array(z.string()),
  changeLog: z.array(z.object({
    version: z.string(),
    date: z.string(),
    changes: z.array(z.string()),
    author: z.string()
  })),
  nextReviewDate: z.string(),
  isActive: z.boolean(),
  legalBasis: z.string(),
  contentPath: z.string()
})

// 메타데이터 배열 스키마
export const ContentMetadataList = z.array(ContentMetadata)

// 버전 정보 스키마
export const VersionInfo = z.object({
  version: z.string()
})

// 버전 히스토리 스키마
export const VersionHistory = z.object({
  history: z.array(z.object({
    version: z.string(),
    date: z.string(),
    changes: z.array(z.string()),
    author: z.string()
  }))
})

// 콘텐츠 유효성 검증 결과 스키마
export const ContentValidation = z.object({
  isValid: z.boolean(),
  needsReview: z.boolean(),
  nextReviewDate: z.string(),
  daysUntilReview: z.number()
})

/**
 * Request 스키마들
 */
export const ContentRequest = {
  // 버전 쿼리 파라미터
  versionQuery: z.object({
    version: z.string().optional()
  }),
  
  // 타입 경로 파라미터
  typeParam: z.object({
    type: z.enum(['terms', 'privacy'])
  })
}