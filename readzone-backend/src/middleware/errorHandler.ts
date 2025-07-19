import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';

interface ApiError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = error.status || 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  const message = error.message || 'Internal server error';

  // Log error
  logger.error('API Error:', {
    status,
    code,
    message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send error response
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error,
      }),
    },
  });
};

export const createError = (status: number, code: string, message: string): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  return error;
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};