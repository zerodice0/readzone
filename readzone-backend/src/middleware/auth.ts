import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { createError } from './errorHandler';

interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    isActive: boolean;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createError(401, 'AUTH_001', '인증 토큰이 필요합니다.');
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw createError(500, 'SERVER_001', 'JWT 시크릿이 설정되지 않았습니다.');
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
      },
    });

    if (!user) {
      throw createError(401, 'AUTH_001', '유효하지 않은 토큰입니다.');
    }

    if (!user.isActive) {
      throw createError(403, 'AUTH_003', '비활성화된 사용자입니다.');
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(createError(401, 'AUTH_002', '토큰이 만료되었습니다.'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(createError(401, 'AUTH_001', '유효하지 않은 토큰입니다.'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

export type { AuthenticatedRequest };