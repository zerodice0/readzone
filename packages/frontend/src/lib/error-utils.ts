/**
 * Error message mapping utilities for user-friendly display
 */

export const ERROR_MESSAGES = {
  // Write form validation errors
  BOOK_REQUIRED: '도서를 선택해 주세요.',
  TITLE_REQUIRED: '제목을 입력해 주세요.',
  CONTENT_REQUIRED: '내용을 입력해 주세요.',

  // General errors
  PUBLISH_FAILED: '게시 중 오류가 발생했습니다. 다시 시도해 주세요.',
  BOOK_SEARCH_FAILED: '도서 검색 중 오류가 발생했습니다.',
  BOOK_FETCH_FAILED: '도서 정보를 가져오는 중 오류가 발생했습니다.',
  IMAGE_UPLOAD_FAILED: '이미지 업로드에 실패했습니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다. 연결을 확인해 주세요.',

  // Default fallback
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

/**
 * Convert error to user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const errorCode = error.message as ErrorCode;

    return (
      ERROR_MESSAGES[errorCode] ?? error.message ?? ERROR_MESSAGES.UNKNOWN_ERROR
    );
  }

  if (typeof error === 'string') {
    const errorCode = error as ErrorCode;

    return ERROR_MESSAGES[errorCode] ?? error ?? ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Check if error is a validation error that user can fix
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorCode = error.message as ErrorCode;

    return ['BOOK_REQUIRED', 'TITLE_REQUIRED', 'CONTENT_REQUIRED'].includes(
      errorCode
    );
  }

  if (typeof error === 'string') {
    return ['BOOK_REQUIRED', 'TITLE_REQUIRED', 'CONTENT_REQUIRED'].includes(
      error as ErrorCode
    );
  }

  return false;
}
