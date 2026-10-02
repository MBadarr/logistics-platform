import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { SESSION_COOKIE } from '../auth/session.guard.js';

export function setupApiDocs(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Logistics Platform API')
    .setDescription(
      'Authentication and logistics API. Signup and login set an HttpOnly session cookie. Use the same browser for subsequent authenticated requests.',
    )
    .setVersion('1.0.0')
    .addCookieAuth(SESSION_COOKIE, { type: 'apiKey', in: 'cookie' }, 'session')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: '/openapi.json',
    customSiteTitle: 'Logistics API — Swagger',
    swaggerOptions: { withCredentials: true },
  });
  app.use(
    '/reference',
    apiReference({ content: document, theme: 'purple', proxyUrl: '' }),
  );
  return document;
}
