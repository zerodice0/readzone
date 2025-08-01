import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'file:./test.db'
process.env.KAKAO_API_KEY = 'test-kakao-key'

// Global test utilities
global.fetch = jest.fn()

// Extend Jest matchers
expect.extend({
  toBeWithinTime(received, maxMs) {
    const pass = received <= maxMs
    return {
      message: () => 
        pass
          ? `Expected ${received}ms to be greater than ${maxMs}ms`
          : `Expected ${received}ms to be within ${maxMs}ms`,
      pass,
    }
  },

  toHaveValidDraftStructure(received) {
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
})