// backend-nest/add-request-number-yearly.js
// Годовой счётчик request_number (формат REQ-YYYY-000001) с триггером и UNIQUE.
// Запуск: node backend-nest/add-request-number-yearly.js
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

    // 1) Таблица счётчиков по году
    await client.query(`
      CREATE TABLE IF NOT EXISTS request_number_counters (
        year INTEGER PRIMARY KEY,
        counter INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 2) Функция генерации номера (атомарно через UPSERT ... RETURNING)
    await client.query(`
      CREATE OR REPLACE FUNCTION next_request_number() RETURNS TEXT AS $$
      DECLARE
        y INT := EXTRACT(YEAR FROM CURRENT_DATE);
        v INT;
      BEGIN
        INSERT INTO request_number_counters(year, counter)
        VALUES (y, 1)
        ON CONFLICT (year)
        DO UPDATE SET counter = request_number_counters.counter + 1
        RETURNING counter INTO v;

        RETURN 'REQ-' || to_char(current_date,'YYYY') || '-' || lpad(v::text, 6, '0');
      END
      $$ LANGUAGE plpgsql;
    `);

    // 3) Колонка в requests + UNIQUE индекс (если ещё нет)
    await client.query(`
      ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS request_number VARCHAR(50);

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'requests' AND indexname = 'ux_requests_request_number'
        ) THEN
          EXECUTE 'CREATE UNIQUE INDEX ux_requests_request_number ON requests(request_number)';
        END IF;
      END$$;
    `);

    // 4) BEFORE INSERT триггер, проставляющий номер если он не задан
    await client.query(`
      CREATE OR REPLACE FUNCTION set_request_number() RETURNS trigger AS $$
      BEGIN
        IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
          NEW.request_number := next_request_number();
        END IF;
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_requests_request_number ON requests;
      CREATE TRIGGER trg_requests_request_number
        BEFORE INSERT ON requests
        FOR EACH ROW
        EXECUTE FUNCTION set_request_number();
    `);

    // 5) Заполнить пустые значения для уже существующих строк
    await client.query(`
      UPDATE requests
         SET request_number = next_request_number()
       WHERE request_number IS NULL OR request_number = '';
    `);

    await client.query('COMMIT');
    console.log('✅ request_number: триггер + уникальный индекс готов, значения выставлены');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция request_number (yearly) провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
