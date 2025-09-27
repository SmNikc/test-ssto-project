import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// 🚀 Функция запуска приложения
async function bootstrap() {
  // Создание NestJS приложения с включенным CORS
  const app = await NestFactory.create(AppModule, { cors: true });
  
  // 🔧 Глобальная валидация (если нужна)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // 🌐 РАСШИРЕННАЯ НАСТРОЙКА CORS (более детальная настройка)
  app.enableCors({
    origin: [
      'http://localhost:5173',  // Vite/React локально
      'http://localhost:5174',  // Vite альтернативный порт (у вас сейчас)
    ],
    credentials: true,           // Позволяет передавать cookie/авторизацию
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 📍 Префикс API (при необходимости раскомментировать)
  // app.setGlobalPrefix('api');

  // 🛎️ Стартуем API на порту из env или 3001 (как предложено)
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`[Nest] Application is running on: http://localhost:${port}`);
}

// ⚡ Запуск bootstrapping
bootstrap();