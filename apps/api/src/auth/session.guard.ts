import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, type SessionUser } from './auth.service.js';

export type AuthenticatedRequest = Request & { user: SessionUser };

export function sessionToken(request: Request): string | undefined {
  return request.headers.authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.user = await this.auth.currentUser(sessionToken(request));
    return true;
  }
}
