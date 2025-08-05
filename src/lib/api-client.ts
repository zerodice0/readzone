/**
 * 타입 안전한 API 클라이언트
 * 
 * - TypeScript 타입 추론 지원
 * - Zod를 통한 런타임 검증
 * - 에러 처리 표준화
 * - 재시도 로직 포함
 */

import { z } from 'zod';
import type { ApiResponse } from '@/types/api-responses';

// API 클라이언트 옵션
interface ApiClientOptions extends RequestInit {
  // 재시도 횟수 (기본값: 0)
  retry?: number;
  // 재시도 간격 (ms, 기본값: 1000)
  retryDelay?: number;
  // 타임아웃 (ms, 기본값: 30000)
  timeout?: number;
}

// API 에러 클래스
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorType?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 기본 fetch 래퍼 (타입 추론만 지원)
 */
export async function apiRequest<T>(
  url: string,
  options?: ApiClientOptions
): Promise<ApiResponse<T>> {
  const {
    retry = 0,
    retryDelay = 1000,
    timeout = 30000,
    ...fetchOptions
  } = options || {};

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      // 타임아웃 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      // API 응답이 아닌 경우 (예: Next.js 에러 페이지)
      if (!('success' in result)) {
        throw new ApiError(
          'Invalid API response format',
          response.status,
          'INVALID_RESPONSE'
        );
      }

      // 에러 응답 처리
      if (!response.ok || !result.success) {
        throw new ApiError(
          result.error?.message || `HTTP ${response.status}`,
          response.status,
          result.error?.errorType,
          result.error?.details
        );
      }

      // API 응답 검증
      if (typeof result === 'object' && result !== null && 'success' in result) {
        return result;
      }
      
      throw new ApiError(
        'Invalid API response format',
        response.status,
        'INVALID_RESPONSE'
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 재시도할 수 없는 에러는 즉시 throw
      if (
        error instanceof ApiError ||
        (error instanceof Error && error.name === 'AbortError') ||
        attempt === retry
      ) {
        throw error;
      }

      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError || new Error('Unknown error');
}

/**
 * Zod 스키마를 사용한 안전한 API 요청
 */
export async function safeApiRequest<T>(
  url: string,
  schema: z.ZodSchema<ApiResponse<T>>,
  options?: ApiClientOptions
): Promise<ApiResponse<T>> {
  const response = await apiRequest<T>(url, options);

  // 런타임 검증
  const validation = schema.safeParse(response);

  if (!validation.success) {
    console.error('API response validation failed:', {
      url,
      errors: validation.error.errors,
      response,
    });

    throw new ApiError(
      'API response validation failed',
      undefined,
      'VALIDATION_ERROR',
      validation.error.errors
    );
  }

  return validation.data;
}

/**
 * JSON 데이터를 POST하는 헬퍼 함수
 */
export async function postJson<RequestData, ResponseData>(
  url: string,
  data: RequestData,
  options?: ApiClientOptions
): Promise<ApiResponse<ResponseData>> {
  return apiRequest<ResponseData>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: JSON.stringify(data),
  });
}

/**
 * Zod 스키마와 함께 JSON 데이터를 POST하는 헬퍼 함수
 */
export async function safePostJson<T>(
  url: string,
  data: unknown,
  schema: z.ZodSchema<ApiResponse<T>>,
  options?: ApiClientOptions
): Promise<ApiResponse<T>> {
  return safeApiRequest(url, schema, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: JSON.stringify(data),
  });
}

/**
 * 성공적인 응답에서 데이터 추출
 */
export function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success || !response.data) {
    throw new ApiError(
      response.error?.message || 'No data in response',
      undefined,
      response.error?.errorType,
      response.error?.details
    );
  }

  return response.data;
}

/**
 * API 응답 스키마 생성 헬퍼
 */
export function createApiResponseSchema<T>(dataSchema: z.ZodSchema<T>) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      errorType: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    }).optional(),
  });
}