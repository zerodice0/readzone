import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

/**
 * Playwright 전역 정리
 * 모든 테스트 완료 후 한 번만 실행되는 정리 작업
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Playwright 전역 정리 시작...');
  
  try {
    // 테스트 결과 정리
    console.log('📊 테스트 결과 정리 중...');
    
    // 임시 파일들 정리
    const tempFiles = [
      './test-results/global-storage-state.json',
      './test-results/.auth'
    ];
    
    for (const filePath of tempFiles) {
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log(`🗑️  임시 파일 제거: ${filePath}`);
      } catch {
        // 파일이 없으면 무시
      }
    }
    
    // 테스트 리포트 생성
    console.log('📈 테스트 리포트 생성 중...');
    await generateTestSummary();
    
    // Mock 서버 종료 (필요한 경우)
    console.log('🎭 Mock 서버 종료...');
    // 여기에 Mock 서버 종료 로직 추가
    
    // 테스트 데이터베이스 정리 (필요한 경우)
    console.log('🗄️  테스트 데이터베이스 정리...');
    // 여기에 DB 정리 로직 추가
    
    console.log('✅ Playwright 전역 정리 완료!');
    
  } catch (error) {
    console.error('❌ 전역 정리 실패:', error);
    // 정리 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}

/**
 * 테스트 요약 리포트 생성
 */
async function generateTestSummary() {
  try {
    const resultsPath = './test-results/results.json';
    
    // JSON 결과 파일이 있는지 확인
    try {
      await fs.access(resultsPath);
    } catch {
      console.log('⚠️  테스트 결과 파일을 찾을 수 없습니다.');
      return;
    }
    
    // 테스트 결과 읽기
    const resultsData = await fs.readFile(resultsPath, 'utf-8');
    const results = JSON.parse(resultsData);
    
    // 요약 정보 계산
    const summary = {
      총_테스트_수: results.suites?.reduce((sum: number, suite: any) => 
        sum + (suite.tests?.length || 0), 0) || 0,
      성공_테스트_수: 0,
      실패_테스트_수: 0,
      건너뛴_테스트_수: 0,
      총_실행_시간: '계산 중...',
      테스트_날짜: new Date().toISOString(),
    };
    
    // 상세 결과 계산
    if (results.suites) {
      results.suites.forEach((suite: any) => {
        suite.tests?.forEach((test: any) => {
          switch (test.outcome) {
            case 'passed':
              summary.성공_테스트_수++;
              break;
            case 'failed':
              summary.실패_테스트_수++;
              break;
            case 'skipped':
              summary.건너뛴_테스트_수++;
              break;
          }
        });
      });
    }
    
    // 요약 리포트 저장
    const summaryPath = './test-results/test-summary.json';
    await fs.writeFile(
      summaryPath, 
      JSON.stringify(summary, null, 2), 
      'utf-8'
    );
    
    console.log('📊 테스트 요약:');
    console.log(`   총 테스트: ${summary.총_테스트_수}개`);
    console.log(`   ✅ 성공: ${summary.성공_테스트_수}개`);
    console.log(`   ❌ 실패: ${summary.실패_테스트_수}개`);
    console.log(`   ⏭️  건너뛰기: ${summary.건너뛴_테스트_수}개`);
    
    // 실패한 테스트가 있으면 경고
    if (summary.실패_테스트_수> 0) {
      console.log('⚠️  실패한 테스트가 있습니다. 상세 리포트를 확인해주세요.');
      console.log('   리포트 위치: ./playwright-report/index.html');
    }
    
  } catch (error) {
    console.error('❌ 테스트 요약 생성 실패:', error);
  }
}

export default globalTeardown;