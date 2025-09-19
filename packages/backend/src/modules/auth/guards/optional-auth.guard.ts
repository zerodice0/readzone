import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Pass through to the next guard/handler even if auth fails
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    _err: any,
    user: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _info: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ExecutionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _status?: any,
  ): TUser {
    // Return null instead of throwing an error if no user is found
    // This allows the request to continue even without authentication
    return user as TUser;
  }
}
