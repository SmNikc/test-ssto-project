// backend-nest/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Sequelize } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS (оставьте ваш вариант, если он уже есть)
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((s) => s.trim()),
    credentials: true,
  });

  // Глобальная валидация (если уже есть, не дублируйте)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // --- DEV BOOTSTRAP (one-shot column add) ---
  // Выполнить один раз в DEV, если в .env стоит DB_BOOTSTRAP=true
  // Добавляет только signals.vessel_name, если колонка отсутствует.
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.DB_BOOTSTRAP === 'true'
  ) {
    const sequelize = app.get(Sequelize);
    try {
      await sequelize.authenticate();
      const qi = sequelize.getQueryInterface();
      const table = 'signals';
      const column = 'vessel_name';

      const desc = await qi.describeTable(table).catch((e) => {
        throw new Error(
          `Не удалось прочитать описание таблицы "${table}": ${e.message}`,
        );
      });

      const hasColumn = Object.prototype.hasOwnProperty.call(desc, column);
      if (!hasColumn) {
        console.log(`[DB] Добавляю колонку ${table}.${column} ...`);
        await qi.addColumn(table, column, {
          type: DataTypes.STRING,
          allowNull: true,
        });
        console.log(`[DB] Колонка ${table}.${column} добавлена.`);
      } else {
        console.log(`[DB] Колонка ${table}.${column} уже существует — пропускаю.`);
      }
    } catch (err: any) {
      console.error('[DB BOOTSTRAP] Ошибка:', err.message || err);
    } finally {
      // СОВЕТ: после успешного старта снимите флаг DB_BOOTSTRAP в .env
    }
  }
  // --- /DEV BOOTSTRAP ---

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  console.log(`Backend listening on http://localhost:${port}`);
}
bootstrap();
