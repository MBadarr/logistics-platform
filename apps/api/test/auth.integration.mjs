import 'reflect-metadata';
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { MailService } from '../dist/mail/mail.service.js';
import { Test } from '@nestjs/testing';
import { createDatabase } from 'database';
import { AuthModule } from '../dist/auth/auth.module.js';
import { DatabaseService } from '../dist/database/database.service.js';

// Uses an isolated schema, real PostgreSQL transactions, and a captured email provider.
// No mail is sent externally and no existing application tables are modified.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error('Set DATABASE_URL before running the integration test');
const schema = `auth_test_${randomBytes(8).toString('hex')}`;
const admin = createDatabase(databaseUrl);
const received = [];
let app;
let connection;
let createdSchema = false;
try {
  process.env.NODE_ENV = 'test';
  process.env.APP_URL = 'http://localhost:3000';

  await admin.pool.query(`CREATE SCHEMA "${schema}"`);
  createdSchema = true;
  const url = new URL(databaseUrl);
  url.searchParams.set('options', `-c search_path=${schema}`);
  connection = createDatabase(url.toString());
  const migration = await readFile(
    new URL(
      '../../../packages/database/drizzle/20261002131741_authentication/migration.sql',
      import.meta.url,
    ),
    'utf8',
  );
  await connection.pool.query(migration);
  const module = await Test.createTestingModule({ imports: [AuthModule] })
    .overrideProvider(MailService)
    .useValue({
      sendPasswordReset: async (email, resetUrl) => {
        received.push({ email, resetUrl });
      },
    })
    .overrideProvider(DatabaseService)
    .useValue({ db: connection.db })
    .compile();
  app = module.createNestApplication({ logger: false });
  await app.listen(0, '127.0.0.1');
  const origin = await app.getUrl();
  const email = `auth-${randomBytes(6).toString('hex')}@example.com`;
  const password = 'original-long-password';
  let cookie;
  async function request(
    action,
    body,
    customCookie = cookie,
    customOrigin = 'http://localhost:3000',
  ) {
    const response = await fetch(`${origin}/auth/${action}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: customOrigin,
        ...(customCookie ? { Cookie: customCookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { response, data: await response.json() };
  }

  const signup = await request('signup', {
    name: 'Integration User',
    email: email.toUpperCase(),
    password,
  });
  assert.equal(signup.response.status, 201);
  assert.equal(signup.data.user.email, email);
  assert.equal(signup.data.user.passwordHash, undefined);
  assert.match(signup.response.headers.get('set-cookie'), /HttpOnly/i);
  cookie = signup.response.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('me')).response.status, 200);
  assert.equal(
    (await request('login', { email, password: 'wrong' })).response.status,
    401,
  );
  assert.equal(
    (
      await request(
        'login',
        { email, password },
        cookie,
        'https://attacker.example',
      )
    ).response.status,
    403,
  );

  const forgot = await request('forgot-password', { email });
  assert.equal(forgot.response.status, 200);
  const unknown = await request('forgot-password', {
    email: 'missing@example.com',
  });
  assert.deepEqual(forgot.data, unknown.data);
  assert.equal(received.length, 1);
  assert.equal(received[0].email, email);
  const token = new URL(received[0].resetUrl).searchParams.get('token');
  assert.ok(token, 'Captured email must contain a reset link');
  const stored = await connection.pool.query(
    'select token_hash from password_reset_tokens',
  );
  assert.equal(
    stored.rows[0].token_hash,
    createHash('sha256').update(token).digest('hex'),
  );

  const newPassword = 'replacement-long-password';
  const resets = await Promise.all([
    request('reset-password', { token, password: newPassword }),
    request('reset-password', { token, password: newPassword }),
  ]);
  assert.deepEqual(
    resets.map((item) => item.response.status).sort(),
    [200, 400],
  );
  assert.equal(
    (await request('reset-password', { token, password: newPassword })).response
      .status,
    400,
  );
  assert.equal(
    (await request('me')).response.status,
    401,
    'Reset must revoke existing sessions',
  );
  assert.equal(
    (await request('login', { email, password })).response.status,
    401,
  );
  const login = await request('login', { email, password: newPassword });
  assert.equal(login.response.status, 200);
  cookie = login.response.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('me')).response.status, 200);
  assert.equal((await request('logout', {})).response.status, 200);
  assert.equal((await request('me')).response.status, 401);
  const expiredToken = randomBytes(32).toString('hex');
  await connection.pool.query(
    'insert into password_reset_tokens (token_hash, user_id, expires_at) values ($1,$2,$3)',
    [
      createHash('sha256').update(expiredToken).digest('hex'),
      signup.data.user.id,
      new Date(Date.now() - 60_000),
    ],
  );
  assert.equal(
    (
      await request('reset-password', {
        token: expiredToken,
        password: newPassword,
      })
    ).response.status,
    400,
  );
  console.log(
    'PASS: signup, login, captured reset delivery, single-use concurrent reset, session revocation, logout, and origin protection.',
  );
} finally {
  await app?.close();
  await connection?.pool.end();
  if (createdSchema) await admin.pool.query(`DROP SCHEMA "${schema}" CASCADE`);
  await admin.pool.end();
}
