/**
 * Check if error is a client error (4xx) that shouldn't be retried
 */
function isClientError(error: unknown): boolean {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'status' in error.response
  ) {
    const status = (error.response as { status: number }).status;
    return status >= 400 && status < 500;
  }
  return false;
}

/**
 * T115: Retry utility with exponential backoff
 * Retries a function with exponential backoff delay
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) - only server errors (5xx) and network errors
      if (isClientError(error)) {
        throw lastError;
      }

      attempt += 1;

      // If max retries reached, throw error
      if (attempt >= maxRetries) {
        throw lastError;
      }

      // Wait with exponential backoff
      const backoffDelay = delay * 2 ** (attempt - 1);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, backoffDelay);
      });
    }
  }
}
