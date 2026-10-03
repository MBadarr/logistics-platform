import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Test } from '@nestjs/testing';
import { AuthController } from '../dist/auth/auth.controller.js';
import { AuthService } from '../dist/auth/auth.service.js';
import { setupApiDocs } from '../dist/config/api-docs.js';

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
  assert.equal(Object.keys(document.paths).length, 1);
  assert.equal(document.components.securitySchemes.neon.scheme, 'bearer');
  assert.deepEqual(document.paths['/auth/me'].get.security, [{ neon: [] }]);
  assert.ok(!document.paths['/auth/signup']);
  console.log('API docs integration passed: Scalar, Swagger, OpenAPI, Neon bearer auth.');
} finally { await app.close(); }
