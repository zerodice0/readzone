import { lazy, ComponentType } from 'react';

// sessionStorage 키 - 무한 새로고침 방지용
const REFRESH_KEY_PREFIX = 'chunk_failed_';

/**
 * T114: 동적 import 실패 시 자동 재시도 및 페이지 새로고침을 수행하는 헬퍼 함수
 * 빌드 후 해시 변경으로 인한 'Failed to fetch dynamically imported module' 에러 대응
 */
export function lazyWithRetry<T extends ComponentType<any>>( // eslint-disable-line @typescript-eslint/no-explicit-any
  componentImport: () => Promise<{ default: T }>,
  chunkName: string
) {
  return lazy(async () => {
    const sessionKey = `${REFRESH_KEY_PREFIX}${chunkName}`;
    const hasRefreshed = sessionStorage.getItem(sessionKey) === 'true';

    try {
      const component = await componentImport();
      // 성공 시 플래그 초기화
      sessionStorage.removeItem(sessionKey);
      return component;
    } catch (error) {
      // Chunk 에러인지 확인 (대소문자 및 브라우저 차이 고려)
      const isChunkError =
        error instanceof Error &&
        (error.message.includes('Failed to fetch') ||
          error.message.includes('dynamically imported module') ||
          error.message.includes('Loading chunk'));

      if (isChunkError && !hasRefreshed) {
        // 첫 번째 실패: 페이지 새로고침으로 최신 번들 로드 시도
        sessionStorage.setItem(sessionKey, 'true');
        window.location.reload();
        // Promise가 resolve되지 않도록 하여 빈 화면(Suspense fallback) 유지
        return new Promise<{ default: T }>(() => {});
      }

      // 두 번째 실패이거나 다른 에러인 경우: 에러 전파 (ErrorBoundary에서 처리)
      throw error;
    }
  });
}
