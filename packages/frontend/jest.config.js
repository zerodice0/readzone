export default {
  displayName: 'Frontend Tests',
  
  // 테스트 환경
  testEnvironment: 'jsdom',
  
  // 모듈 이름 매핑
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // 테스트 파일 패턴
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // 테스트 제외 패턴
  testPathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/'
  ],
  
  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 셋업 파일들
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // 변환 설정
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // 모듈 파일 확장자
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // 변환 무시 패턴 (MSW 모듈 변환 허용)
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@mswjs/interceptors)/)',
  ],
  
  // 테스트 환경 옵션 (TextEncoder/TextDecoder 추가)
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // 글로벌 설정
  setupFiles: ['<rootDir>/jest.setup.js'],
  
  // 성능 설정
  maxWorkers: '50%',
  
  // 세부 출력
  verbose: true,
};