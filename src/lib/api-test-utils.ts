/**
 * API Testing Utilities for Draft System
 * Provides testing helpers and mock data generators
 */

import type { ReviewDraftInput, DraftQuery } from '@/lib/validations/draft'
import { expect } from 'playwright/test'

export interface TestUser {
  id: string
  email: string
  nickname: string
}

export interface TestBook {
  id: string
  title: string
  authors: string[]
  isbn13?: string
  publisher?: string
  thumbnail?: string
}

export interface TestDraft {
  id: string
  userId: string
  bookId?: string
  title?: string
  content: string
  metadata: Record<string, any>
  bookData?: string
  status: 'DRAFT' | 'EXPIRED' | 'ABANDONED' | 'MIGRATED'
  version: number
  expiresAt: Date
  lastAccessed: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * Mock 사용자 데이터 생성
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: `test${Date.now()}@example.com`,
    nickname: `testuser_${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
  }
}

/**
 * Mock 도서 데이터 생성
 */
export function createTestBook(overrides: Partial<TestBook> = {}): TestBook {
  const books = [
    {
      title: '해리포터와 철학자의 돌',
      authors: ['J.K. 롤링'],
      isbn13: '9788983920256',
      publisher: '문학수첩',
    },
    {
      title: '데미안',
      authors: ['헤르만 헤세'],
      isbn13: '9788932473901',
      publisher: '민음사',
    },
    {
      title: '1984',
      authors: ['조지 오웰'],
      isbn13: '9788937460777',
      publisher: '민음사',
    },
    {
      title: '어린 왕자',
      authors: ['앙투안 드 생텍쥐페리'],
      isbn13: '9788932473905',
      publisher: '민음사',
    },
  ]

  const randomBook = books[Math.floor(Math.random() * books.length)]

  return {
    id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    thumbnail: 'https://example.com/thumbnail.jpg',
    ...randomBook,
    ...overrides,
  }
}

/**
 * Mock Draft 데이터 생성
 */
export function createTestDraft(overrides: Partial<TestDraft> = {}): TestDraft {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  return {
    id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: `user_${Math.random().toString(36).substr(2, 9)}`,
    content: `<h1>테스트 독후감</h1><p>이것은 테스트용 독후감 내용입니다. ${Math.random().toString(36)}</p>`,
    metadata: {
      wordCount: 1250,
      timeSpent: 45,
      lastSaved: now.toISOString(),
      autoSaveCount: 3,
    },
    status: 'DRAFT' as const,
    version: 1,
    expiresAt,
    lastAccessed: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/**
 * 카카오 API 도서 데이터 Mock 생성
 */
export function createKakaoBookData(book: Partial<TestBook> = {}): string {
  const testBook = createTestBook(book)
  
  const kakaoData = {
    title: testBook.title,
    contents: '이 책에 대한 간단한 소개입니다.',
    url: 'https://search.daum.net/search?q=' + encodeURIComponent(testBook.title),
    isbn: testBook.isbn13,
    datetime: '2023-01-01T00:00:00.000+09:00',
    authors: testBook.authors,
    publisher: testBook.publisher || '테스트 출판사',
    translators: [],
    price: 15000,
    sale_price: 13500,
    thumbnail: testBook.thumbnail || 'https://example.com/thumbnail.jpg',
    status: '정상판매',
  }

  return JSON.stringify(kakaoData)
}

/**
 * Draft 입력 데이터 생성
 */
export function createDraftInput(overrides: Partial<ReviewDraftInput> = {}): ReviewDraftInput {
  return {
    content: '<h1>테스트 독후감</h1><p>이것은 테스트용 독후감입니다.</p>',
    metadata: {
      wordCount: 100,
      timeSpent: 30,
      lastSaved: new Date().toISOString(),
    },
    status: 'DRAFT',
    version: 1,
    ...overrides,
  }
}

/**
 * Draft 쿼리 파라미터 생성
 */
export function createDraftQuery(overrides: Partial<DraftQuery> = {}): DraftQuery {
  return {
    page: 1,
    limit: 5,
    includeExpired: false,
    ...overrides,
  }
}

/**
 * API 응답 검증 헬퍼
 */
export class ApiResponseValidator {
  static validateSuccessResponse(response: any, expectedFields: string[] = []) {
    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('data')
    
    expectedFields.forEach(field => {
      expect(response.data).toHaveProperty(field)
    })
  }

  static validateErrorResponse(
    response: any, 
    _expectedStatus: number = 400,
    expectedErrorType?: string
  ) {
    expect(response).toHaveProperty('success', false)
    expect(response).toHaveProperty('error')
    expect(response.error).toHaveProperty('errorType')
    expect(response.error).toHaveProperty('message')
    
    if (expectedErrorType) {
      expect(response.error.errorType).toBe(expectedErrorType)
    }
  }

  static validateDraftResponse(response: any) {
    this.validateSuccessResponse(response, ['draft'])
    
    const draft = response.data.draft
    expect(draft).toHaveProperty('id')
    expect(draft).toHaveProperty('content')
    expect(draft).toHaveProperty('status')
    expect(draft).toHaveProperty('version')
    expect(draft).toHaveProperty('createdAt')
    expect(draft).toHaveProperty('updatedAt')
    expect(typeof draft.metadata).toBe('object')
  }

  static validateDraftListResponse(response: any) {
    this.validateSuccessResponse(response, ['items', 'pagination'])
    
    expect(Array.isArray(response.data.items)).toBe(true)
    expect(response.data.pagination).toHaveProperty('page')
    expect(response.data.pagination).toHaveProperty('limit')
    expect(response.data.pagination).toHaveProperty('total')
    expect(response.data.pagination).toHaveProperty('totalPages')
  }

  static validateCleanupResponse(response: any) {
    this.validateSuccessResponse(response, ['cleanup'])
    
    const cleanup = response.data.cleanup
    expect(cleanup).toHaveProperty('totalProcessed')
    expect(cleanup).toHaveProperty('expiredDeleted')
    expect(cleanup).toHaveProperty('duration')
    expect(typeof cleanup.totalProcessed).toBe('number')
    expect(typeof cleanup.duration).toBe('number')
  }
}

/**
 * 성능 테스트 헬퍼
 */
export class PerformanceTestHelper {
  private startTime: number = 0

  start() {
    this.startTime = Date.now()
  }

  end(): number {
    return Date.now() - this.startTime
  }

  static async measureAsync<T>(operation: () => Promise<T>): Promise<{
    result: T
    duration: number
  }> {
    const start = Date.now()
    const result = await operation()
    const duration = Date.now() - start
    
    return { result, duration }
  }

  static expectWithinTime(duration: number, maxMs: number, operation: string) {
    if (duration > maxMs) {
      throw new Error(`${operation} took ${duration}ms, expected < ${maxMs}ms`)
    }
  }
}

/**
 * 데이터베이스 상태 검증 헬퍼
 */
export class DatabaseStateValidator {
  static async validateDraftExists(draftId: string, db: any): Promise<boolean> {
    const draft = await db.reviewDraft.findUnique({
      where: { id: draftId },
    })
    return draft !== null
  }

  static async validateAuditLogExists(
    draftId: string, 
    action: string, 
    db: any
  ): Promise<boolean> {
    const audit = await db.reviewDraftAudit.findFirst({
      where: {
        draftId,
        action,
      },
    })
    return audit !== null
  }

  static async validateUserDraftCount(
    userId: string, 
    expectedCount: number, 
    db: any
  ): Promise<boolean> {
    const count = await db.reviewDraft.count({
      where: { userId },
    })
    return count === expectedCount
  }
}

/**
 * 통합 테스트 시나리오 생성기
 */
export class TestScenarioBuilder {
  static createDraftLifecycle() {
    return {
      // 1. Draft 생성
      createDraft: createDraftInput({
        content: '<h1>새 독후감</h1><p>내용을 작성 중입니다...</p>',
        title: '테스트 독후감 제목',
      }),

      // 2. Draft 업데이트
      updateDraft: createDraftInput({
        content: '<h1>새 독후감</h1><p>내용을 업데이트했습니다!</p>',
        title: '수정된 독후감 제목',
        version: 2,
      }),

      // 3. 쿼리 테스트
      queries: {
        firstPage: createDraftQuery({ page: 1, limit: 5 }),
        withExpired: createDraftQuery({ includeExpired: true }),
        largeLimit: createDraftQuery({ limit: 20 }),
      },
    }
  }

  static createCleanupScenario() {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)

    return {
      // 만료된 Draft들
      expiredDrafts: [
        createTestDraft({
          status: 'DRAFT',
          expiresAt: weekAgo,
          lastAccessed: weekAgo,
        }),
        createTestDraft({
          status: 'EXPIRED',
          expiresAt: weekAgo,
        }),
      ],

      // 정상 Draft들
      activeDrafts: [
        createTestDraft({
          status: 'DRAFT',
          lastAccessed: now,
        }),
      ],

      // 정리 조건
      cleanupCriteria: {
        olderThan: weekAgo,
        status: ['EXPIRED', 'ABANDONED'],
        batchSize: 50,
        dryRun: false,
      },
    }
  }
}

// Jest 매처 확장 (필요한 경우)
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinTime(maxMs: number): R
      toHaveValidDraftStructure(): R
    }
  }
}

export const customMatchers = {
  toBeWithinTime(received: number, maxMs: number) {
    const pass = received <= maxMs
    return {
      message: () => 
        pass
          ? `Expected ${received}ms to be greater than ${maxMs}ms`
          : `Expected ${received}ms to be within ${maxMs}ms`,
      pass,
    }
  },

  toHaveValidDraftStructure(received: any) {
    const requiredFields = ['id', 'content', 'status', 'version', 'createdAt']
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field))
    
    return {
      message: () => 
        hasAllFields
          ? `Expected draft not to have valid structure`
          : `Expected draft to have fields: ${requiredFields.join(', ')}`,
      pass: hasAllFields,
    }
  },
}