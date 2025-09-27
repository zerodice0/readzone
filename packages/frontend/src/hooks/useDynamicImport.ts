import { useCallback, useEffect, useState } from 'react';

interface DynamicImportOptions {
  preload?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

interface DynamicImportReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  load: () => Promise<T>;
  retry: () => Promise<T>;
  canRetry: boolean;
}

/**
 * 동적 임포트 훅
 *
 * @param importFn - 임포트할 함수
 * @param options - 옵션 설정
 * @returns 동적 임포트 상태와 제어 함수들
 */
export function useDynamicImport<T = unknown>(
  importFn: () => Promise<T>,
  options: DynamicImportOptions = {}
): DynamicImportReturn<T> {
  const { preload = false, retryAttempts = 3, timeout = 10000 } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async (): Promise<T> => {
    if (data && !error) {
      return data;
    }

    setLoading(true);
    setError(null);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('임포트 시간 초과')), timeout);
    });

    try {
      const result = await Promise.race([importFn(), timeoutPromise]);

      setData(result);
      setLoading(false);

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('임포트 실패');

      setError(error);
      setLoading(false);
      throw error;
    }
  }, [importFn, data, error, timeout]);

  const retry = useCallback(async (): Promise<T> => {
    if (attempt < retryAttempts) {
      setAttempt((prev) => prev + 1);
      setData(null);

      return load();
    }
    throw new Error('최대 재시도 횟수 초과');
  }, [attempt, retryAttempts, load]);

  useEffect(() => {
    if (preload) {
      load().catch(() => {
        // 프리로드 에러는 조용히 처리
      });
    }
  }, [load, preload]);

  return {
    data,
    loading,
    error,
    load,
    retry,
    canRetry: attempt < retryAttempts,
  };
}
