import { ConvexError } from 'convex/values';

/**
 * Error handling utilities
 */

type ApiErrorLike = Error & {
  isAxiosError?: boolean;
  response?: {
    status?: number;
    data?: {
      message?: unknown;
    };
  };
};

/**
 * Type guard to check if an error follows the API client error shape.
 */
function isApiErrorLike(error: unknown): error is ApiErrorLike {
  return (
    error instanceof Error &&
    typeof (error as { isAxiosError?: unknown }).isAxiosError === 'boolean' &&
    (error as { isAxiosError?: boolean }).isAxiosError === true
  );
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(
  error: unknown,
  defaultMessage = 'An unexpected error occurred'
): string {
  // API client error with response payload
  if (isApiErrorLike(error)) {
    const responseMessage = error.response?.data?.message;
    if (typeof responseMessage === 'string') {
      return responseMessage;
    }
    return error.message || defaultMessage;
  }

  // Standard Error
  if (error instanceof Error) {
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  // Unknown error type
  return defaultMessage;
}

/**
 * Convex 함수가 ConvexError로 던진 사용자용 메시지를 꺼낸다.
 * 일반 Error 메시지는 프로덕션에서 "Server Error"로 가려지므로 fallback을 쓴다.
 */
export function getConvexErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof ConvexError && typeof error.data === 'string') {
    return error.data;
  }
  return fallback;
}

/**
 * Log error to console in development, send to tracking service in production
 */
export function logError(error: unknown, context?: string): void {
  const message = extractErrorMessage(error);
  const errorInfo = {
    message,
    context,
    error,
    timestamp: new Date().toISOString(),
  };

  // Development: log to console
  if (import.meta.env.DEV) {
    console.error('[Error]', errorInfo);
  }

  // Production: send to error tracking service (e.g., Sentry)
  // TODO: Integrate error tracking service
  // Example: Sentry.captureException(error, { tags: { context } });
}

/**
 * Handle API errors with consistent error messages
 */
export function handleApiError(
  error: unknown,
  context?: string
): { message: string; status?: number } {
  logError(error, context);

  const message = extractErrorMessage(error);
  const status = isApiErrorLike(error) ? error.response?.status : undefined;

  return { message, status };
}
