// backend-nest/add-request-vessel-id.js
// Добавляет requests.vessel_id (если отсутствует) и заполняет его по совпадению MMSI с таблицей vessels.
// Запуск: node backend-nest/add-request-vessel-id.js
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

    // 1) Добавить колонку vessel_id (nullable, без FK — чтобы не ломать существующие данные)
    await client.query(`
      ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS vessel_id INTEGER
    `);

    // 2) Попытаться заполнить vessel_id по совпадению MMSI (если обе таблицы содержат эти поля)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='vessels' AND column_name='mmsi'
        ) THEN
          -- Переносим только там, где vessel_id ещё пуст
          EXECUTE '
            UPDATE requests r
               SET vessel_id = v.id
              FROM vessels v
             WHERE r.vessel_id IS NULL
               AND v.mmsi = r.mmsi
          ';
        END IF;
      END$$;
    `);

    // 3) Индекс по vessel_id для быстрых выборок (если захотите искать заявки по судну)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'requests' AND indexname = 'idx_requests_vessel_id'
        ) THEN
          EXECUTE 'CREATE INDEX idx_requests_vessel_id ON requests (vessel_id)';
        END IF;
      END$$;
    `);

    await client.query('COMMIT');
    console.log('✅ requests.vessel_id добавлена и при возможности заполнена по MMSI');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция add-request-vessel-id провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
