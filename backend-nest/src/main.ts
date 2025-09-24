import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // НЕ устанавливаем глобальный префикс, так как контроллеры
  // уже имеют нужные пути (например, DevAuthController имеет ['auth', 'api/auth'])
  
  // Настройка CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Берем разрешенные origin из переменной окружения или используем дефолтные
      const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
      
      // Разрешаем запросы от указанных origin, file:// и null (для file://)
      if (!origin || corsOrigins.includes(origin) || origin?.startsWith('file://')) {
        callback(null, true);
      } else {
        // В dev режиме можно разрешить все для удобства разработки
        if (process.env.NODE_ENV === 'development') {
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
    optionsSuccessStatus: 204
  });
  
  // Глобальная валидация
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
  }));
  
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  
  console.log(`🚀 Backend listening on http://localhost:${port}`);
  console.log(`📡 API endpoints available at: http://localhost:${port}/api`);
  console.log(`🔐 Keycloak: ${process.env.KEYCLOAK_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
}

bootstrap();