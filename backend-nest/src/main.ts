import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Настройка безопасности
  app.use(helmet());

  // Валидация входящих данных
  app.useGlobalPipes(new ValidationPipe());

  // Настройка CORS
  app.enableCors({
    origin: 'https://test-ssto.local',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Добавим префикс /api для всех маршрутов
  app.setGlobalPrefix('api');

  // Запуск приложения
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
