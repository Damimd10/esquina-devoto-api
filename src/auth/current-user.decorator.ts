import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SupabaseUser } from './supabase-auth.guard';

export const CurrentUser = createParamDecorator(
  (data: keyof SupabaseUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as SupabaseUser;

    return data ? user?.[data] : user;
  },
);
