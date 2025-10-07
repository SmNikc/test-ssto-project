// backend-nest/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet (не обязателен). Пытаемся подключить — без падения если пакета нет.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const helmet = require('helmet');
    if (helmet) app.use(helmet());
  } catch {}

  // Глобальный префикс /api, но /health — БЕЗ префикса.
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  // CORS: из env либо безопасный fallback для dev/Docker.
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost', 'http://127.0.0.1', 'http://host.docker.internal'];

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || corsOrigins.includes(origin)) cb(null, true);
      else cb(null, false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With,Origin,Accept',
  });

  // Лимиты тела (согласованы с Nginx client_max_body_size)
  const bodyLimit = process.env.BODY_LIMIT || '20mb';
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  // Валидация DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));

  // Доверяем X-Forwarded-* за Nginx
  const http = (app.getHttpAdapter() as any).getInstance?.();
  if (http?.set) http.set('trust proxy', 1);

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port, '0.0.0.0');

  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
  console.log('Health check: http://localhost:3001/health');  // Verbose for demo
}
bootstrap();