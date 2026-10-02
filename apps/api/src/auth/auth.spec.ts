import { AuthService, RESET_MESSAGE } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { MailService } from '../mail/mail.service.js';
import { hashPassword, hashToken, verifyPassword } from './password.js';
import { emailInput, passwordInput, signupInput } from './auth.validation.js';
import { AuthRequestGuard } from './auth-request.guard.js';
import type { ExecutionContext } from '@nestjs/common';

describe('authentication', () => {
  const user = {
    id: 'user-1',
    name: 'Alex',
    email: 'alex@example.com',
    passwordHash: '',
  };
  let service: AuthService;
  let repository: {
    findUser: ReturnType<typeof vi.fn>;
    createUser: ReturnType<typeof vi.fn>;
    createSession: ReturnType<typeof vi.fn>;
    sessionUser: ReturnType<typeof vi.fn>;
    deleteSession: ReturnType<typeof vi.fn>;
    saveReset: ReturnType<typeof vi.fn>;
    deleteReset: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
  };
  let mail: { sendPasswordReset: ReturnType<typeof vi.fn> };

  beforeAll(async () => {
    user.passwordHash = await hashPassword('a-long-test-password');
  });
  beforeEach(() => {
    repository = {
      findUser: vi.fn().mockResolvedValue(user),
      createUser: vi.fn().mockResolvedValue(user),
      createSession: vi.fn().mockResolvedValue(true),
      sessionUser: vi.fn(),
      deleteSession: vi.fn(),
      saveReset: vi.fn(),
      deleteReset: vi.fn(),
      resetPassword: vi.fn(),
    };
    mail = { sendPasswordReset: vi.fn() };
    service = new AuthService(
      repository as unknown as AuthRepository,
      mail as unknown as MailService,
    );
  });

  it('stores salted password hashes and rejects a wrong password', async () => {
    const first = await hashPassword('a-long-test-password');
    expect(first).not.toBe(await hashPassword('a-long-test-password'));
    expect(await verifyPassword('a-long-test-password', first)).toBe(true);
    expect(await verifyPassword('wrong-password', first)).toBe(false);
    expect(await verifyPassword('anything', 'invalid')).toBe(false);
  });

  it('does not leak password hashes and stores only a hash of the session token', async () => {
    const result = await service.login(user.email, 'a-long-test-password');
    expect(result.user).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(repository.createSession).toHaveBeenCalledWith(
      user.id,
      hashToken(result.token),
      expect.any(Date),
      user.passwordHash,
    );
  });

  it('uses the same login error for a wrong password and an unknown account', async () => {
    await expect(service.login(user.email, 'wrong-password')).rejects.toThrow(
      'Email or password is incorrect',
    );
    repository.findUser.mockResolvedValue(undefined);
    await expect(
      service.login('unknown@example.com', 'wrong-password'),
    ).rejects.toThrow('Email or password is incorrect');
    expect(repository.createSession).not.toHaveBeenCalled();
  });

  it('rejects an expired or revoked session', async () => {
    repository.sessionUser.mockResolvedValue(undefined);
    await expect(service.currentUser('a'.repeat(64))).rejects.toThrow(
      'session has expired',
    );
  });

  it('prevents login racing with a password change', async () => {
    repository.createSession.mockResolvedValue(false);
    await expect(
      service.login(user.email, 'a-long-test-password'),
    ).rejects.toThrow('password changed');
  });

  it('sends a reset URL but stores only its token hash with a 30-minute expiry', async () => {
    const start = Date.now();
    expect(await service.forgotPassword(user.email)).toEqual({
      message: RESET_MESSAGE,
    });
    const [email, link] = mail.sendPasswordReset.mock.calls[0]!;
    const token = new URL(link).searchParams.get('token')!;
    expect(email).toBe(user.email);
    expect(new URL(link).pathname).toBe('/reset-password');
    const [, storedHash, expires] = repository.saveReset.mock.calls[0]!;
    expect(storedHash).toBe(hashToken(token));
    expect(expires.getTime() - start).toBeGreaterThanOrEqual(30 * 60 * 1000);
    expect(expires.getTime() - start).toBeLessThan(30 * 60 * 1000 + 1000);
  });

  it('does not reveal unknown accounts or failed Resend delivery', async () => {
    repository.findUser.mockResolvedValue(undefined);
    expect(await service.forgotPassword('unknown@example.com')).toEqual({
      message: RESET_MESSAGE,
    });
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    repository.findUser.mockResolvedValue(user);
    mail.sendPasswordReset.mockRejectedValue(new Error('Resend unavailable'));
    expect(await service.forgotPassword(user.email)).toEqual({
      message: RESET_MESSAGE,
    });
    expect(repository.deleteReset).toHaveBeenCalled();
  });

  it('rejects invalid, expired, or already-consumed reset tokens', async () => {
    repository.resetPassword.mockResolvedValue(false);
    await expect(
      service.resetPassword('a'.repeat(64), 'a-new-long-password'),
    ).rejects.toThrow('invalid or expired');
  });

  it('passes the hashed new password to the atomic reset operation', async () => {
    repository.resetPassword.mockResolvedValue(true);
    await service.resetPassword('b'.repeat(64), 'a-new-long-password');
    const [tokenHash, passwordHash] = repository.resetPassword.mock.calls[0]!;
    expect(tokenHash).toBe(hashToken('b'.repeat(64)));
    expect(await verifyPassword('a-new-long-password', passwordHash)).toBe(
      true,
    );
  });

  it('normalizes emails and validates untrusted input', () => {
    expect(emailInput({ email: ' Alex@Example.com ' })).toBe(
      'alex@example.com',
    );
    expect(() => passwordInput({ password: 'short' })).toThrow('12–128');
    expect(() =>
      signupInput({ name: 'A', email: 'bad', password: 'short' }),
    ).toThrow();
    expect(() => emailInput(null)).toThrow('Invalid request body');
  });

  it('blocks cross-origin mutation requests and excessive login attempts', () => {
    const guard = new AuthRequestGuard();
    const request = {
      method: 'POST',
      ip: '127.0.0.1',
      path: '/auth/login',
      get: (name: string) =>
        name === 'origin' ? 'https://attacker.example' : undefined,
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(context)).toThrow('origin is not allowed');
    request.get = () => undefined;
    for (let index = 0; index < 20; index++)
      expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow('Too many attempts');
  });
});
