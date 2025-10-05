import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithUser {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user || null;

    // data 파라미터가 있으면 해당 필드만 반환
    if (data && user) {
      return user[data] as string | null;
    }

    return user;
  },
);
