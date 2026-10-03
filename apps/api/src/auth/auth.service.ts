import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { requiredEnv } from '../config/environment.js';

export type SessionUser = { id: string; name: string; email: string };

@Injectable()
export class AuthService {
  private readonly baseUrl = requiredEnv('NEON_AUTH_BASE_URL').replace(/\/$/, '');
  private readonly issuer = new URL(this.baseUrl).origin;
  private readonly jwks: JWTVerifyGetKey = createRemoteJWKSet(
    new URL(process.env.NEON_AUTH_JWKS_URL || this.baseUrl + '/.well-known/jwks.json'),
  );

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async currentUser(token?: string): Promise<SessionUser> {
    if (!token) throw new UnauthorizedException('Please sign in');
    let userId: string;
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: process.env.NEON_AUTH_AUDIENCE || this.issuer,
        algorithms: ['EdDSA', 'RS256', 'ES256'],
        requiredClaims: ['sub', 'exp', 'iat'],
      });
      if (!payload.sub || payload.sub === 'anonymous') throw new Error('Missing user');
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }
    // Read managed account data without owning or migrating Neon's auth tables.
    const result = await this.database.db.execute<SessionUser & { banned: boolean | null }>(sql`
      select id, name, email, banned from neon_auth."user" where id = ${userId} limit 1
    `);
    const user = result.rows[0];
    if (!user || user.banned) throw new UnauthorizedException('Please sign in');
    return { id: user.id, name: user.name, email: user.email };
  }
}
