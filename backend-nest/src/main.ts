import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// 🚀 Функция запуска приложения
async function bootstrap() {
  // Создание NestJS приложения
  const app = await NestFactory.create(AppModule);
  
  // 🌐 НАСТРОЙКА CORS (разрешение запросов с фронтенда)
  app.enableCors({
    origin: [
      'http://localhost:5173',  // Vite/React локально
      'http://localhost:5174',  // Vite альтернативный порт (у вас сейчас)
    ],
    credentials: true,           // Позволяет передавать cookie/авторизацию
  });

  // 🛎️ Стартуем API на порту из env или 3000
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

// ⚡ Запуск bootstrapping
bootstrap();