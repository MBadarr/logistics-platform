import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt } from 'drizzle-orm';
import { authSessions, authUsers, passwordResetTokens } from 'database';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async findUser(email: string) {
    const [user] = await this.database.db
      .select()
      .from(authUsers)
      .where(eq(authUsers.email, email))
      .limit(1);
    return user;
  }

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }) {
    const [user] = await this.database.db
      .insert(authUsers)
      .values(input)
      .onConflictDoNothing()
      .returning();
    return user;
  }

  async createSession(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    expectedPasswordHash: string,
  ) {
    return this.database.db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(authUsers)
        .where(eq(authUsers.id, userId))
        .for('update');
      // Serialize login with password reset so an old password cannot mint a new session.
      if (!user || user.passwordHash !== expectedPasswordHash) return false;
      await tx.insert(authSessions).values({ userId, tokenHash, expiresAt });
      return true;
    });
  }

  async sessionUser(tokenHash: string) {
    const [row] = await this.database.db
      .select({
        id: authUsers.id,
        name: authUsers.name,
        email: authUsers.email,
      })
      .from(authSessions)
      .innerJoin(authUsers, eq(authUsers.id, authSessions.userId))
      .where(
        and(
          eq(authSessions.tokenHash, tokenHash),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row;
  }

  async deleteSession(tokenHash: string) {
    await this.database.db
      .delete(authSessions)
      .where(eq(authSessions.tokenHash, tokenHash));
  }

  async saveReset(userId: string, tokenHash: string, expiresAt: Date) {
    await this.database.db
      .insert(passwordResetTokens)
      .values({ userId, tokenHash, expiresAt });
  }

  async deleteReset(tokenHash: string) {
    await this.database.db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash));
  }

  async resetPassword(
    tokenHash: string,
    passwordHash: string,
  ): Promise<boolean> {
    return this.database.db.transaction(async (tx) => {
      const [candidate] = await tx
        .select({ userId: passwordResetTokens.userId })
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            gt(passwordResetTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);
      if (!candidate) return false;
      // Lock the user first so resets through different tokens cannot deadlock.
      const [user] = await tx
        .select({ id: authUsers.id })
        .from(authUsers)
        .where(eq(authUsers.id, candidate.userId))
        .for('update');
      if (!user) return false;
      // DELETE ... RETURNING consumes the token atomically, including concurrent requests.
      const [token] = await tx
        .delete(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            gt(passwordResetTokens.expiresAt, new Date()),
          ),
        )
        .returning();
      if (!token) return false;
      await tx
        .update(authUsers)
        .set({ passwordHash })
        .where(eq(authUsers.id, token.userId));
      await tx
        .delete(authSessions)
        .where(eq(authSessions.userId, token.userId));
      await tx
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, token.userId));
      return true;
    });
  }
}
