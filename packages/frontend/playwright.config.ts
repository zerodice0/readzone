import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * ReadZone 메인 피드 및 사용자 플로우 테스트용
 */
export default defineConfig({
  // 테스트 디렉토리
  testDir: './tests/e2e',
  
  // 테스트 파일 패턴
  testMatch: '**/*.spec.ts',
  
  // 전체 테스트 타임아웃 (30분)
  globalTimeout: 30 * 60 * 1000,
  
  // 개별 테스트 타임아웃 (30초)
  timeout: 30 * 1000,
  
  // 테스트 실패 시 재시도
  retries: process.env.CI ? 2 : 0,
  
  // 병렬 실행 워커 수
  workers: process.env.CI ? 1 : undefined,
  
  // 리포터 설정
  reporter: [
    ['html', { outputDir: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    // CI 환경에서는 간단한 출력
    process.env.CI ? ['github'] : ['list']
  ],
  
  // 전역 설정
  use: {
    // 기본 URL
    baseURL: 'http://localhost:3000',
    
    // 브라우저 컨텍스트 옵션
    viewport: { width: 1280, height: 720 },
    
    // 모든 테스트에서 스크린샷 및 비디오 수집
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // 네트워크 활동 추적
    trace: 'on-first-retry',
    
    // 테스트 액션 간 대기 시간
    actionTimeout: 10 * 1000,
    
    // 네비게이션 타임아웃
    navigationTimeout: 30 * 1000,
    
    // 지역화 설정
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  
  // 테스트 실행 전 로컬 개발 서버 시작
  webServer: [
    {
      command: 'pnpm run dev',
      port: 3000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
  
  // 브라우저 프로젝트 설정
  projects: [
    // Desktop Chrome
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.ts/,
    },
    
    // Desktop Firefox
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.spec\.ts/,
      // CI에서는 Chrome만 사용
      ...(process.env.CI && { testIgnore: /.*/ })
    },
    
    // Desktop Safari (macOS에서만)
    ...(process.platform === 'darwin' ? [{
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*\.spec\.ts/,
      // CI에서는 Chrome만 사용
      ...(process.env.CI && { testIgnore: /.*/ })
    }] : []),
    
    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /.*mobile.*\.spec\.ts|.*responsive.*\.spec\.ts/,
    },
    
    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: /.*mobile.*\.spec\.ts|.*responsive.*\.spec\.ts/,
      // CI에서는 Mobile Chrome만 사용
      ...(process.env.CI && { testIgnore: /.*/ })
    },
    
    // 태블릿 테스트
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
      testMatch: /.*tablet.*\.spec\.ts|.*responsive.*\.spec\.ts/,
      // CI에서는 건너뛰기
      ...(process.env.CI && { testIgnore: /.*/ })
    },
    
    // 성능 테스트 (Chrome만)
    {
      name: 'Performance',
      use: {
        ...devices['Desktop Chrome'],
        // 성능 측정을 위한 추가 설정
        launchOptions: {
          args: ['--enable-precise-memory-info']
        }
      },
      testMatch: /.*performance.*\.spec\.ts/,
    },
    
    // 접근성 테스트
    {
      name: 'Accessibility',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*accessibility.*\.spec\.ts|.*a11y.*\.spec\.ts/,
    }
  ],
  
  // 전역 설정 파일
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  
  // 테스트 출력 디렉토리
  outputDir: 'test-results',
  
  // 테스트 실패 시 최대 실패 건수
  maxFailures: process.env.CI ? 10 : undefined,
  
  // 메타데이터
  metadata: {
    testFramework: 'Playwright',
    testType: 'E2E',
    project: 'ReadZone Frontend',
    environment: process.env.NODE_ENV || 'test',
  },
  
  // 실험적 기능
  experimental: {
    // 테스트 간 격리 개선
    testIdAttribute: 'data-testid',
  },
});