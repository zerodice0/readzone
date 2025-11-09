/**
 * Error handling utilities
 */

import axios, { AxiosError } from 'axios';

/**
 * Type guard to check if error is an AxiosError
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(
  error: unknown,
  defaultMessage = 'An unexpected error occurred'
): string {
  // AxiosError
  if (isAxiosError(error)) {
    const responseData = error.response?.data as { message?: unknown } | undefined;
    const responseMessage = responseData?.message;
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
  const status = isAxiosError(error) ? error.response?.status : undefined;

  return { message, status };
}
