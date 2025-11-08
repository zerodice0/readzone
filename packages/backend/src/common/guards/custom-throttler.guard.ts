import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { RequestWithUser } from '../../modules/users/interfaces/request-with-user.interface';

/**
 * Custom throttler guard with differentiated limits for authenticated users
 * - Anonymous users: 100 requests per minute
 * - Authenticated users: 1000 requests per minute
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: RequestWithUser): string {
    // Use user ID for authenticated users, IP for anonymous
    const tracker = req.user?.userId ?? req.ip ?? 'unknown';
    return tracker;
  }

  protected getLimit(context: ExecutionContext): number {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Authenticated users get higher limit
    return request.user ? 1000 : 100;
  }

  protected getTtl(): number {
    // TTL in milliseconds (60 seconds)
    return 60000;
  }
}
