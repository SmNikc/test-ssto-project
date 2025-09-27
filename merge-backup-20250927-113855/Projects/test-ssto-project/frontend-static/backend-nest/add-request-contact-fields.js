// backend-nest/add-request-contact-fields.js
// Добавляет (если отсутствуют) критичные контактные поля в requests
// и индексы для быстрых выборок/поиска.
// Запуск: node backend-nest/add-request-contact-fields.js
// Использует переменные окружения: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

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

    // 1) Добавить колонки, если их нет.
    // Важно: не делаем NOT NULL, чтобы не портить существующие данные.
    await client.query(`
      ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100),
        ADD COLUMN IF NOT EXISTS contact_phone  VARCHAR(50),
        ADD COLUMN IF NOT EXISTS contact_email  VARCHAR(100)
    `);

    // 2) Индексы для поиска обращений по контактам
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'requests' AND indexname = 'idx_requests_contact_email'
        ) THEN
          EXECUTE 'CREATE INDEX idx_requests_contact_email ON requests (contact_email)';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'requests' AND indexname = 'idx_requests_contact_phone'
        ) THEN
          EXECUTE 'CREATE INDEX idx_requests_contact_phone ON requests (contact_phone)';
        END IF;

        -- Часто спрашивают "последний контакт" -> индекс по planned_test_date для быстрого MIN/MAX по терминалу/дате, если поле есть
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='requests' AND column_name='planned_test_date'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'requests' AND indexname = 'idx_requests_planned_test_date'
        ) THEN
          EXECUTE 'CREATE INDEX idx_requests_planned_test_date ON requests (planned_test_date)';
        END IF;
      END$$;
    `);

    await client.query('COMMIT');
    console.log('✅ contact_* поля проверены/созданы, индексы готовы');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция contact_* провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
