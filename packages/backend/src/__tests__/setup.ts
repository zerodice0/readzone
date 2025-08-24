import { beforeAll, afterAll, beforeEach } from 'vitest'
import 'dotenv/config'

// 테스트용 환경 변수 설정
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'file:./test.db'
process.env.JWT_SECRET = 'test-secret-key'
process.env.JWT_EXPIRES_IN = '1h'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'

// 글로벌 테스트 설정
beforeAll(async () => {
  // 테스트 전 설정
})

afterAll(async () => {
  // 테스트 후 정리
})

beforeEach(() => {
  // 각 테스트 전 초기화
})

// Mock console for cleaner test output
global.console = {
  ...console,
  log: () => {}, // 테스트 중 로그 출력 방지 
  error: console.error, // 에러는 여전히 출력
  warn: console.warn
}