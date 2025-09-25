import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Создание NestJS приложения
  const app = await NestFactory.create(AppModule);
  
  // Получение конфигурации из .env
  const configService = app.get(ConfigService);

  // Настройка CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Берем разрешенные origin из переменной окружения или используем дефолтные
      const corsOrigins = configService.get<string>('CORS_ORIGIN', 'http://localhost:5173').split(',').map(o => o.trim());
      
      // Разрешаем запросы от указанных origin, file:// и null (для file://)
      if (!origin || corsOrigins.includes(origin) || origin?.startsWith('file://')) {
        callback(null, true);
      } else {
        // В dev режиме разрешаем все для удобства разработки
        if (configService.get<string>('NODE_ENV') === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Запуск API на порту из .env
  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);

  console.log(`🚀 Backend listening on http://localhost:${port}`);
  console.log(`📡 API endpoints available at: http://localhost:${port}/api`);
  console.log(`🔐 Keycloak: ${configService.get<string>('KEYCLOAK_ENABLED') === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`🌐 CORS enabled for: ${configService.get<string>('CORS_ORIGIN', 'http://localhost:5173')}`);
}

bootstrap();