// backend-nest/add-imo-number-column.js
// Добавляет колонку imo_number в requests (если отсутствует) и,
// если в таблице есть старая колонка imo, переносит значения в imo_number.
// Запуск: node backend-nest/add-imo-number-column.js
// ENV: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

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

    // 1) Добавляем колонку, если её нет
    await client.query(`
      ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS imo_number VARCHAR(7)
    `);

    // 2) Если в схеме есть колонка 'imo' — перенесём значения в imo_number (только пустые)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='requests' AND column_name='imo'
        ) THEN
          EXECUTE '
            UPDATE requests
               SET imo_number = CASE
                                  WHEN imo_number IS NULL OR imo_number = '''' THEN CAST(imo AS VARCHAR(7))
                                  ELSE imo_number
                                END
          ';
        END IF;
      END$$;
    `);

    // 3) (Опционально) индексация — не делаем, чтобы не нагружать; при необходимости добавим позже.

    await client.query('COMMIT');
    console.log('✅ Колонка imo_number готова; значения перенесены при наличии imo');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция imo_number провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
