import { ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
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
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: HttpException, host: ArgumentsHost): void;
    private getErrorCode;
}
