import { useEffect, useState } from 'react';

/**
 * 번들 분석기 (개발용)
 */
export function useBundleAnalysis() {
  const [bundleInfo, setBundleInfo] = useState<{
    totalSize: number;
    loadedChunks: string[];
    failedChunks: string[];
  }>({
    totalSize: 0,
    loadedChunks: [],
    failedChunks: [],
  });

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      import.meta.env.MODE !== 'development'
    ) {
      return;
    }

    // 번들 정보 수집 (개발 환경에서만)
    const collectBundleInfo = () => {
      const scripts = Array.from(
        document.querySelectorAll('script[src]')
      ) as HTMLScriptElement[];
      const loadedChunks = scripts
        .map((script) => script.src)
        .filter((src) => src.includes('chunk') || src.includes('bundle'));

      setBundleInfo((prev) => ({
        ...prev,
        loadedChunks,
        totalSize: loadedChunks.length, // 실제 구현에서는 파일 크기 계산 필요
      }));
    };

    collectBundleInfo();

    // 동적 임포트 이벤트 감지
    const originalImport = window.__webpack_require__?.e;

    if (originalImport && window.__webpack_require__) {
      window.__webpack_require__.e = (chunkId: string) => {
        return originalImport(chunkId)
          .then(() => {
            setBundleInfo((prev) => ({
              ...prev,
              loadedChunks: [...new Set([...prev.loadedChunks, chunkId])],
            }));
          })
          .catch((error: Error) => {
            setBundleInfo((prev) => ({
              ...prev,
              failedChunks: [...new Set([...prev.failedChunks, chunkId])],
            }));
            throw error;
          });
      };
    }
  }, []);

  return bundleInfo;
}

// 글로벌 타입 확장
declare global {
  interface Window {
    __webpack_require__?: {
      e: (chunkId: string) => Promise<void>;
    };
  }
}
