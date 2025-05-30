import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import requestRoutes from './routes/requestRoutes';
import signalRoutes from './routes/signalRoutes';
import reportRoutes from './routes/report.routes';
import testingRoutes from './routes/testing.routes';
import userRoutes from './routes/user.routes';
import logRoutes from './routes/log.routes';
import backupRoutes from './routes/backup.routes';
import healthRoutes from './routes/health.routes';

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

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

  // Подключение маршрутов
  app.use('/api/requests', requestRoutes);
  app.use('/api/signals', signalRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/testing', testingRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/logs', logRoutes);
  app.use('/api/backup', backupRoutes);
  app.use('/api/health', healthRoutes);

  // Запуск приложения
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
