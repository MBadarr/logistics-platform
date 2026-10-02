import { BadRequestException } from '@nestjs/common';

function object(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new BadRequestException('Invalid request body');
  return body as Record<string, unknown>;
}

export function emailInput(body: unknown) {
  const email = object(body).email;
  if (
    typeof email !== 'string' ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw new BadRequestException('Enter a valid email address');
  }
  return email.trim().toLowerCase();
}

export function passwordInput(body: unknown, strong = true) {
  const password = object(body).password;
  if (
    typeof password !== 'string' ||
    password.length > 128 ||
    password.length < (strong ? 12 : 1)
  ) {
    throw new BadRequestException(
      strong
        ? 'Password must contain 12–128 characters'
        : 'Enter your password',
    );
  }
  return password;
}

export function signupInput(body: unknown) {
  const name = object(body).name;
  if (
    typeof name !== 'string' ||
    name.trim().length < 2 ||
    name.trim().length > 100
  ) {
    throw new BadRequestException('Name must contain 2–100 characters');
  }
  return {
    name: name.trim(),
    email: emailInput(body),
    password: passwordInput(body),
  };
}

export function resetInput(body: unknown) {
  const token = object(body).token;
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    throw new BadRequestException('This reset link is invalid or expired');
  }
  return { token, password: passwordInput(body) };
}
