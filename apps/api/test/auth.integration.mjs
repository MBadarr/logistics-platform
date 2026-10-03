import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { Test } from '@nestjs/testing';
import { AuthModule } from '../dist/auth/auth.module.js';
import { DatabaseService } from '../dist/database/database.service.js';

// Real JWT verification and HTTP guards; no production users, emails, or tables are changed.
const keys = await generateKeyPair('EdDSA');
const jwk = await exportJWK(keys.publicKey);
const jwksServer = createServer((_request, response) => {
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({ keys: [{ ...jwk, alg: 'EdDSA', kid: 'integration' }] }));
});
await new Promise(resolve => jwksServer.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + jwksServer.address().port;
process.env.NEON_AUTH_BASE_URL = origin + '/neondb/auth';
process.env.NEON_AUTH_JWKS_URL = origin + '/neondb/auth/.well-known/jwks.json';
process.env.NEON_AUTH_AUDIENCE = origin;
const user = { id: 'integration-user', name: 'Test Account', email: 'test@example.com', banned: false };
let app;
try {
  const module = await Test.createTestingModule({ imports: [AuthModule] })
    .overrideProvider(DatabaseService).useValue({ db: { execute: async () => ({ rows: [user] }) } }).compile();
  app = module.createNestApplication({ logger: false });
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const jwt = await new SignJWT({}).setProtectedHeader({ alg: 'EdDSA', kid: 'integration' })
    .setSubject(user.id).setIssuer(origin).setAudience(origin).setIssuedAt().setExpirationTime('15m').sign(keys.privateKey);
  assert.equal((await fetch(base + '/auth/me')).status, 401);
  assert.equal((await fetch(base + '/auth/me', { headers: { Authorization: 'Bearer forged' } })).status, 401);
  const response = await fetch(base + '/auth/me', { headers: { Authorization: 'Bearer ' + jwt } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { user: { id: user.id, name: user.name, email: user.email } });
  assert.equal((await fetch(base + '/auth/login', { method: 'POST' })).status, 404);
  console.log('Neon JWT HTTP integration passed.');
} finally {
  if (app) await app.close();
  await new Promise(resolve => jwksServer.close(resolve));
}
