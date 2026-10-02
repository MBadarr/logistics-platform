import './config/environment.js';
import { NestFactory } from '@nestjs/core';
import { setupApiDocs } from './config/api-docs.js';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  setupApiDocs(app);

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3002);
}
await bootstrap();
