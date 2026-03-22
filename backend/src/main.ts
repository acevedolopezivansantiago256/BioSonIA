import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { json, urlencoded } from 'express';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true }));
  const port = Number(process.env.PORT) || 5000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  // Simple startup log for dev tracing
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://${host}:${port}`);
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
