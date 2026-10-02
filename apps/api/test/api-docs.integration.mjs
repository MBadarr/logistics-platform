import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Test } from '@nestjs/testing';
import { AuthController } from '../dist/auth/auth.controller.js';
import { AuthService } from '../dist/auth/auth.service.js';
import { setupApiDocs } from '../dist/config/api-docs.js';

// Verify the built Nest metadata and actual HTTP docs without PostgreSQL or Resend.
const module = await Test.createTestingModule({
  controllers: [AuthController],
  providers: [{ provide: AuthService, useValue: {} }],
}).compile();
const app = module.createNestApplication({ logger: false });
try {
  const document = setupApiDocs(app);
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  for (const path of ['/reference', '/docs', '/openapi.json']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    assert.ok((await response.text()).length > 100, path);
  }
  assert.equal(Object.keys(document.paths).length, 6);
  assert.equal(
    document.components.schemas.SignupDto.properties.password.minLength,
    12,
  );
  assert.equal(
    document.components.schemas.ResetPasswordDto.properties.token.pattern,
    '^[a-f0-9]{64}$',
  );
  assert.equal(
    document.components.securitySchemes.session.name,
    'logistics_session',
  );
  assert.deepEqual(document.paths['/auth/me'].get.security, [{ session: [] }]);
  const validOrigin = new URL(
    process.env.API_ORIGIN ?? `http://localhost:${process.env.PORT ?? 3002}`,
  ).origin;
  const allowed = await fetch(base + '/auth/signup', {
    method: 'POST',
    headers: {
      Origin: validOrigin,
      'Content-Type': 'application/json',
      'Sec-Fetch-Site': 'same-origin',
    },
    body: '{}',
  });
  assert.equal(allowed.status, 400, 'Docs origin must reach body validation');
  const blocked = await fetch(base + '/auth/signup', {
    method: 'POST',
    headers: {
      Origin: 'https://attacker.example',
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  assert.equal(blocked.status, 403, 'Untrusted origins remain blocked');
  console.log(
    'API docs integration passed: Scalar, Swagger, OpenAPI schemas, cookie auth, and origin checks.',
  );
} finally {
  await app.close();
}
