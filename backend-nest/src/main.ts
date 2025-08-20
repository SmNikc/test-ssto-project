
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Опционально: не падаем, если helmet не установлен
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const helmet = require('helmet');
    if (helmet) app.use(helmet());
  } catch {
    // no-op
  }

  app.enableCors();
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
}
bootstrap();
