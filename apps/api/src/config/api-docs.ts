import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';


export function setupApiDocs(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Logistics Platform API')
    .setDescription(
      'Logistics API secured by Neon Auth. Sign in through the web app and send the Neon JWT as a Bearer token. Account and password management are handled by Neon.',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'neon')
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
