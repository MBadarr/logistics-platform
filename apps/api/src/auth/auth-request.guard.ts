import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { createHash } from 'node:crypto';
import { webOrigin, apiOrigin } from '../config/environment.js';

@Injectable()
export class AuthRequestGuard implements CanActivate {
  private readonly attempts = new Map<
    string,
    { count: number; expires: number }
  >();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.method === 'GET') return true;
    const origin = request.get('origin');
    if (
      (origin && origin !== webOrigin() && origin !== apiOrigin()) ||
      request.get('sec-fetch-site') === 'cross-site'
    ) {
      throw new ForbiddenException('Request origin is not allowed');
    }
    const now = Date.now();
    for (const [key, entry] of this.attempts)
      if (entry.expires <= now) this.attempts.delete(key);
    // Next.js proxies requests through one server IP. Scope action limits to the
    // account/session as well, with an aggregate IP limit against bulk abuse.
    const aggregate = `${request.ip}:all`;
    const aggregateEntry = this.attempts.get(aggregate) ?? {
      count: 0,
      expires: now + 60_000,
    };
    aggregateEntry.count++;
    if (aggregateEntry.count > 200)
      throw new HttpException('Too many attempts. Try again in a minute.', 429);
    this.attempts.set(aggregate, aggregateEntry);
    const email =
      typeof request.body?.email === 'string'
        ? request.body.email.trim().toLowerCase().slice(0, 254)
        : '';
    const identity = createHash('sha256')
      .update(email || request.headers?.cookie || 'anonymous')
      .digest('hex');
    const key = `${request.ip}:${request.path}:${identity}`;
    const limit = request.path.endsWith('/login') ? 20 : 5;
    const entry = this.attempts.get(key) ?? { count: 0, expires: now + 60_000 };
    entry.count++;
    if (
      entry.count > limit ||
      (!this.attempts.has(key) && this.attempts.size >= 10_000)
    ) {
      throw new HttpException('Too many attempts. Try again in a minute.', 429);
    }
    this.attempts.set(key, entry);
    return true;
  }
}
