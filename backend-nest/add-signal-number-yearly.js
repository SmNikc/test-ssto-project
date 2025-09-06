// backend-nest/add-signal-number-yearly.js
// Годовой счётчик signal_number (формат SIG-YYYY-000001) с триггером и UNIQUE.
// Запуск: node backend-nest/add-signal-number-yearly.js
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
      CREATE TABLE IF NOT EXISTS signal_number_counters (
        year INTEGER PRIMARY KEY,
        counter INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 2) Функция генерации номера (UPSERT ... RETURNING)
    await client.query(`
      CREATE OR REPLACE FUNCTION next_signal_number() RETURNS TEXT AS $$
      DECLARE
        y INT := EXTRACT(YEAR FROM CURRENT_DATE);
        v INT;
      BEGIN
        INSERT INTO signal_number_counters(year, counter)
        VALUES (y, 1)
        ON CONFLICT (year)
        DO UPDATE SET counter = signal_number_counters.counter + 1
        RETURNING counter INTO v;

        RETURN 'SIG-' || to_char(current_date,'YYYY') || '-' || lpad(v::text, 6, '0');
      END
      $$ LANGUAGE plpgsql;
    `);

    // 3) Колонка в signals + UNIQUE индекс (если ещё нет)
    await client.query(`
      ALTER TABLE signals
        ADD COLUMN IF NOT EXISTS signal_number VARCHAR(50);

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'signals' AND indexname = 'ux_signals_signal_number'
        ) THEN
          EXECUTE 'CREATE UNIQUE INDEX ux_signals_signal_number ON signals(signal_number)';
        END IF;
      END$$;
    `);

    // 4) BEFORE INSERT триггер, проставляющий номер если он не задан
    await client.query(`
      CREATE OR REPLACE FUNCTION set_signal_number() RETURNS trigger AS $$
      BEGIN
        IF NEW.signal_number IS NULL OR NEW.signal_number = '' THEN
          NEW.signal_number := next_signal_number();
        END IF;
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_signals_signal_number ON signals;
      CREATE TRIGGER trg_signals_signal_number
        BEFORE INSERT ON signals
        FOR EACH ROW
        EXECUTE FUNCTION set_signal_number();
    `);

    // 5) Заполнить пустые значения для уже существующих строк
    await client.query(`
      UPDATE signals
         SET signal_number = next_signal_number()
       WHERE signal_number IS NULL OR signal_number = '';
    `);

    await client.query('COMMIT');
    console.log('✅ signal_number: триггер + уникальный индекс готов; значения выставлены');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция signal_number (yearly) провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
