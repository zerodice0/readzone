/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoggerService } from '../utils/logger';
import { error, getErrorCode } from '../utils/response';

/**
 * Global exception filter
 * Catches all HTTP exceptions and formats them according to standard response format
 *
 * Note: ESLint unsafe rules are disabled because NestJS's getRequest/getResponse
 * methods return 'any' type by design, even with generic type parameters.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new LoggerService('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: Record<string, unknown> | undefined;

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || message;
        details = responseObj;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      details = {
        name: exception.name,
        stack:
          process.env.NODE_ENV === 'development' ? exception.stack : undefined,
      };
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      {
        status,
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.get('user-agent'),
      }
    );

    // Send formatted error response
    response.status(status).json(
      error(getErrorCode(status), message, details, {
        timestamp: new Date().toISOString(),
      })
    );
  }
}
