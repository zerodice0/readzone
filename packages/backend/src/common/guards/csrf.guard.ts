import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { randomBytes, timingSafeEqual } from 'crypto';

interface RequestWithCookies {
  method: string;
  cookies?: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
}

/**
 * CSRF Guard
 *
 * Implements double-submit cookie pattern for CSRF protection.
 * Validates CSRF token from header against cookie value.
 *
 * Safe methods (GET, HEAD, OPTIONS) are allowed without token.
 * Unsafe methods (POST, PUT, PATCH, DELETE) require valid token.
 *
 * Usage:
 * - Apply globally or per-controller/route
 * - Use @SkipCsrf() decorator to skip protection for specific routes
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private static readonly SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

  private static readonly CSRF_COOKIE_NAME = 'XSRF-TOKEN';

  private static readonly CSRF_HEADER_NAME = 'x-csrf-token';

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route has @SkipCsrf() decorator
    const skipCsrf = this.reflector.getAllAndOverride<boolean>('skipCsrf', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithCookies>();
    const method = request.method.toUpperCase();

    // Allow safe methods without CSRF token
    if (CsrfGuard.SAFE_METHODS.includes(method)) {
      return true;
    }

    // Get CSRF token from cookie
    const cookieToken = request.cookies?.[CsrfGuard.CSRF_COOKIE_NAME];

    // Get CSRF token from header
    const headerToken = request.headers[CsrfGuard.CSRF_HEADER_NAME] as
      | string
      | undefined;

    // Both must be present
    if (!cookieToken || !headerToken) {
      throw new ForbiddenException(
        'CSRF token missing. Please include CSRF token in both cookie and header.'
      );
    }

    // Tokens must match using timing-safe comparison
    if (!this.tokensMatch(cookieToken, headerToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }

  /**
   * Compare tokens using timing-safe comparison to prevent timing attacks
   */
  private tokensMatch(token1: string, token2: string): boolean {
    if (token1.length !== token2.length) {
      return false;
    }

    try {
      const buffer1 = Buffer.from(token1, 'utf8');
      const buffer2 = Buffer.from(token2, 'utf8');
      return timingSafeEqual(buffer1, buffer2);
    } catch {
      return false;
    }
  }

  /**
   * Generate a new CSRF token
   */
  static generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}
