import { chromium, FullConfig } from '@playwright/test';

/**
 * Playwright 전역 셋업
 * 테스트 실행 전 한 번만 실행되는 설정
 */
async function globalSetup(config: FullConfig) {
  console.log('🔧 Playwright 전역 셋업 시작...');
  
  const { baseURL } = config.projects[0].use;
  
  if (!baseURL) {
    throw new Error('baseURL이 설정되지 않았습니다.');
  }
  
  // 브라우저 시작
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 서버 준비 상태 확인
    console.log(`📡 서버 연결 확인 중: ${baseURL}`);
    
    let retries = 0;
    const maxRetries = 30; // 30초 대기
    
    while (retries < maxRetries) {
      try {
        const response = await page.goto(baseURL, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        
        if (response?.status() === 200) {
          console.log('✅ 서버가 준비되었습니다.');
          break;
        }
      } catch (error) {
        console.log(`⏳ 서버 준비 대기 중... (${retries + 1}/${maxRetries})`);
        await page.waitForTimeout(1000);
        retries++;
      }
      
      if (retries === maxRetries) {
        throw new Error(`서버 연결에 실패했습니다: ${baseURL}`);
      }
    }
    
    // 테스트 데이터베이스 초기화 (필요한 경우)
    console.log('🗄️  테스트 데이터베이스 초기화...');
    // 여기에 DB 초기화 로직 추가
    
    // 테스트용 Mock 서버 설정 (필요한 경우)
    console.log('🎭 Mock 서버 설정...');
    // 여기에 Mock 서버 설정 로직 추가
    
    // 전역 테스트 상태 저장
    await context.storageState({ 
      path: './test-results/global-storage-state.json' 
    });
    
    console.log('✅ Playwright 전역 셋업 완료!');
    
  } catch (error) {
    console.error('❌ 전역 셋업 실패:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;