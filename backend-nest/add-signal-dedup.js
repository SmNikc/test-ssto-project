// backend-nest/add-signal-dedup.js
// Добавляет поля для дедупликации сигналов: source_uid (UID письма/канала) и signal_hash.
// Создаёт UNIQUE индексы (NULL допускаются, как в PostgreSQL).
// Запуск: node backend-nest/add-signal-dedup.js

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

    await client.query(`
      ALTER TABLE signals
        ADD COLUMN IF NOT EXISTS source_uid   VARCHAR(255),
        ADD COLUMN IF NOT EXISTS signal_hash  VARCHAR(128)
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'signals' AND indexname = 'ux_signals_source_uid'
        ) THEN
          EXECUTE 'CREATE UNIQUE INDEX ux_signals_source_uid ON signals(source_uid)';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'signals' AND indexname = 'ux_signals_signal_hash'
        ) THEN
          EXECUTE 'CREATE UNIQUE INDEX ux_signals_signal_hash ON signals(signal_hash)';
        END IF;
      END$$;
    `);

    await client.query('COMMIT');
    console.log('✅ Дедуп сигналов: source_uid/signal_hash и UNIQUE индексы готовы');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция dedup (signals) провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
