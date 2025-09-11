// backend-nest/add-ship-owner-default.js
// Задаёт DEFAULT для requests.ship_owner и заполняет NULL значением по умолчанию.
// Запуск: node backend-nest/add-ship-owner-default.js
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

    // 1) Убедимся, что колонка есть
    await client.query(`
      ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS ship_owner VARCHAR(255)
    `);

    // 2) Поставим DEFAULT 'N/A SHIP OWNER' (если его ещё нет)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_attrdef d
          JOIN pg_class c ON c.oid = d.adrelid
          JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.adnum
          WHERE c.relname = 'requests' AND a.attname = 'ship_owner'
        ) THEN
          EXECUTE 'ALTER TABLE requests ALTER COLUMN ship_owner SET DEFAULT ''N/A SHIP OWNER''';
        END IF;
      END$$;
    `);

    // 3) Все NULL → DEFAULT
    await client.query(`
      UPDATE requests
         SET ship_owner = DEFAULT
       WHERE ship_owner IS NULL
    `);

    await client.query('COMMIT');
    console.log('✅ ship_owner: DEFAULT установлен и NULL заполнены');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция ship_owner DEFAULT провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
