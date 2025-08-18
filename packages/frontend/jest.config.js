const nextJest = require('next/jest');

// Next.js 앱 디렉토리 경로 설정
const createJestConfig = nextJest({
  dir: './',
});

// Jest 설정
const customJestConfig = {
  displayName: 'Frontend Tests',
  
  // 테스트 환경
  testEnvironment: 'jsdom',
  
  // 모듈 이름 매핑
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // 테스트 파일 패턴
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // 테스트 제외 패턴
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/'
  ],
  
  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
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
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // 모듈 파일 확장자
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // 테스트 환경 변수
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Mock 설정
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // 전역 변수
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  
  // 성능 설정
  maxWorkers: '50%',
  
  // 세부 출력
  verbose: true,
};

module.exports = createJestConfig(customJestConfig);