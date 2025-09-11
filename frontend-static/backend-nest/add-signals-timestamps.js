// backend-nest/add-signals-timestamps.js
// Добавляет created_at/updated_at в signals (если отсутствуют).
// Если в таблице есть "createdAt"/"updatedAt", переносит данные в snake_case.
// Запуск: node backend-nest/add-signals-timestamps.js

const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'ssto',
    password: process.env.DB_PASSWORD || 'sstopass',
    database: process.env.DB_NAME || 'sstodb',
  });

  await client.connect();
  try {
    await client.query('BEGIN');

    // 1) Добавляем created_at/updated_at, если их нет
    await client.query(`
      ALTER TABLE signals
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ
    `);

    // 2) Если есть CamelCase-колонки — переносим их значения
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='signals' AND column_name='createdAt'
        ) THEN
          EXECUTE 'UPDATE signals SET created_at = COALESCE(created_at, "createdAt")';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='signals' AND column_name='updatedAt'
        ) THEN
          EXECUTE 'UPDATE signals SET updated_at = COALESCE(updated_at, "updatedAt")';
        END IF;
      END$$;
    `);

    // 3) Для NULL выставим текущий момент (чтобы не споткнуться на NOT NULL в ORM)
    await client.query(`
      UPDATE signals SET created_at = NOW() WHERE created_at IS NULL;
      UPDATE signals SET updated_at = NOW() WHERE updated_at IS NULL;
    `);

    await client.query('COMMIT');
    console.log('✅ signals: created_at/updated_at добавлены и заполнены при необходимости');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция timestamps (signals) провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
