import 'server-only';
import { createNeonAuth } from '@neondatabase/auth/next/server';
function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + ' is required. See apps/web/.env.example.');
  return value;
}
export const auth = createNeonAuth({
  baseUrl: required('NEON_AUTH_BASE_URL'),
  cookies: { secret: required('NEON_AUTH_COOKIE_SECRET'), sessionDataTtl: 30 },
});
