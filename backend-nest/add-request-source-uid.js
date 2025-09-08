// backend-nest/add-request-source-uid.js
// Добавляет колонку source_uid в requests + UNIQUE для дедупликации писем.
// Запуск: node backend-nest/add-request-source-uid.js

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
      ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS source_uid VARCHAR(255);
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'requests' AND indexname = 'ux_requests_source_uid'
        ) THEN
          EXECUTE 'CREATE UNIQUE INDEX ux_requests_source_uid ON requests(source_uid)';
        END IF;
      END$$;
    `);

    await client.query('COMMIT');
    console.log('✅ source_uid: колонка и UNIQUE индекс готовы');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция source_uid провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
