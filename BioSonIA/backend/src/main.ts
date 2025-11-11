import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { json, urlencoded } from 'express';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*', credentials: true });
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true }));
  const port = Number(process.env.PORT) || 5000;
  await app.listen(port, '127.0.0.1');
  // Simple startup log for dev tracing
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
  const server = app.getHttpServer();
  try {
    const addr = server.address() as any;
    // eslint-disable-next-line no-console
    console.log('Bound address info:', addr);
    if (process.env.DISABLE_DB === 'true') {
      // eslint-disable-next-line no-console
      console.log('DB disabled: using in-memory store for analysis/results');
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Could not read server address:', e);
  }
}
bootstrap();