import 'dotenv/config';

export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value)
    throw new Error(`${name} is required. See apps/api/.env.example.`);
  return value;
}

export function webOrigin(): string {
  return new URL(process.env.APP_URL ?? 'http://localhost:3000').origin;
}

export function apiOrigin(): string | undefined {
  const value =
    process.env.API_ORIGIN ??
    (process.env.NODE_ENV !== 'production'
      ? `http://localhost:${process.env.PORT ?? 3002}`
      : undefined);
  return value ? new URL(value).origin : undefined;
}
