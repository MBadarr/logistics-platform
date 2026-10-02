import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from './auth.repository.js';
import { MailService } from '../mail/mail.service.js';
import { webOrigin } from '../config/environment.js';
import {
  hashPassword,
  hashToken,
  newToken,
  verifyPassword,
} from './password.js';

export const SESSION_SECONDS = 7 * 24 * 60 * 60;
export const RESET_MESSAGE =
  'If an account exists for that email, a password reset link will be sent.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly dummyHash = hashPassword(newToken());

  constructor(
    @Inject(AuthRepository) private readonly repository: AuthRepository,
    @Inject(MailService) private readonly mail: MailService,
  ) {}

  private async session(user: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
  }) {
    const token = newToken();
    const created = await this.repository.createSession(
      user.id,
      hashToken(token),
      new Date(Date.now() + SESSION_SECONDS * 1000),
      user.passwordHash,
    );
    if (!created)
      throw new UnauthorizedException(
        'Your password changed. Please sign in again.',
      );
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }

  async signup(input: { name: string; email: string; password: string }) {
    const user = await this.repository.createUser({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    });
    if (!user)
      throw new ConflictException('An account already exists for this email');
    return this.session(user);
  }

  async login(email: string, password: string) {
    const user = await this.repository.findUser(email);
    const valid = await verifyPassword(
      password,
      user?.passwordHash ?? (await this.dummyHash),
    );
    if (!user || !valid)
      throw new UnauthorizedException('Email or password is incorrect');
    return this.session(user);
  }

  async currentUser(token?: string) {
    if (!token || !/^[a-f0-9]{64}$/.test(token))
      throw new UnauthorizedException('Please sign in');
    const user = await this.repository.sessionUser(hashToken(token));
    if (!user)
      throw new UnauthorizedException(
        'Your session has expired. Please sign in again.',
      );
    return user;
  }

  async logout(token?: string) {
    if (token) await this.repository.deleteSession(hashToken(token));
  }

  async forgotPassword(email: string) {
    // Never expose account existence or Resend failures to callers.
    try {
      const user = await this.repository.findUser(email);
      if (user) {
        const token = newToken();
        const tokenHash = hashToken(token);
        await this.repository.saveReset(
          user.id,
          tokenHash,
          new Date(Date.now() + 30 * 60 * 1000),
        );
        const url = new URL('/reset-password', webOrigin());
        url.searchParams.set('token', token);
        try {
          await this.mail.sendPasswordReset(user.email, url.toString());
        } catch {
          await this.repository.deleteReset(tokenHash);
          this.logger.error(
            'Password reset email delivery failed. Check Resend configuration.',
          );
        }
      }
    } catch {
      this.logger.error('Password reset request could not be processed.');
    }
    return { message: RESET_MESSAGE };
  }

  async resetPassword(token: string, password: string) {
    const changed = await this.repository.resetPassword(
      hashToken(token),
      await hashPassword(password),
    );
    if (!changed)
      throw new BadRequestException(
        'This reset link is invalid or expired. Request a new one.',
      );
    return { message: 'Password updated. Sign in with your new password.' };
  }
}
