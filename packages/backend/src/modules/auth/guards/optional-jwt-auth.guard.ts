import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Authentication Guard
 *
 * Similar to JwtAuthGuard but doesn't throw an error if token is missing.
 * Use for endpoints that work for both authenticated and anonymous users.
 *
 * - If valid token present: req.user is populated
 * - If token missing/invalid: req.user is undefined, request continues
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser | undefined {
    // If there's an error or no user, just return undefined
    // Don't throw - allow request to continue without authentication
    if (err || !user) {
      return undefined;
    }

    return user;
  }
}
