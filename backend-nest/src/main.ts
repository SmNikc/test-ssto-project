import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Настройка CORS для работы с file:// и localhost
  app.enableCors({
    origin: (origin, callback) => {
      // Разрешаем запросы от file://, localhost и null (для file://)
      const allowedOrigins = [
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:3000',
        null, // для file://
      ];
      
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('file://')) {
        callback(null, true);
      } else {
        callback(null, true); // В dev режиме разрешаем все
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
  console.log(`Backend listening on http://localhost:${port}`);
  console.log(`CORS enabled for file:// and localhost origins`);
}
bootstrap();
