import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    path: string;
  };
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // 에러 메시지 추출
    const exceptionResponse = exception.getResponse();
    let message: string;
    let code: string;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, unknown>;
      const resMessage = responseObj.message;
      const resCode = responseObj.code;

      message =
        typeof resMessage === 'string' && resMessage.length > 0
          ? resMessage
          : exception.message;
      code =
        typeof resCode === 'string' && resCode.length > 0
          ? resCode
          : this.getErrorCode(status);
    } else {
      message = exception.message;
      code = this.getErrorCode(status);
    }

    // 일관된 에러 응답 구조
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    // 개발 환경에서는 더 자세한 정보 포함
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.error.details = {
        stack: exception.stack,
        cause: exception.cause,
      };
    }

    // 에러 로깅
    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      exception.stack,
      `${request.method} ${request.url}`,
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_ERROR';
      default:
        return 'HTTP_ERROR';
    }
  }
}
