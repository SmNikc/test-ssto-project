// backend-nest/add-request-test-date-default.js
// Ставит DEFAULT для requests.test_date (CURRENT_DATE для DATE, NOW() для TIMESTAMP)
// и заполняет NULL значением по умолчанию.
// Запуск: node backend-nest/add-request-test-date-default.js
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

    // Убедимся, что колонка есть
    await client.query(`
      ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS test_date TIMESTAMPTZ
    `);

    // Выясним тип колонки test_date (date / timestamp / timestamptz)
    const { rows } = await client.query(`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='requests' AND column_name='test_date'
      LIMIT 1
    `);
    const dataType = (rows[0]?.data_type || '').toLowerCase();

    // Поставим DEFAULT в зависимости от типа
    if (dataType.includes('date') && !dataType.includes('time')) {
      // DATE
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_attrdef d
            JOIN pg_class c ON c.oid = d.adrelid
            JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.adnum
            WHERE c.relname = 'requests' AND a.attname = 'test_date'
          ) THEN
            EXECUTE 'ALTER TABLE requests ALTER COLUMN test_date SET DEFAULT CURRENT_DATE';
          END IF;
        END$$;
      `);

      // Заполним NULL значением по умолчанию
      await client.query(`UPDATE requests SET test_date = CURRENT_DATE WHERE test_date IS NULL`);
    } else {
      // TIMESTAMP / TIMESTAMPTZ
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_attrdef d
            JOIN pg_class c ON c.oid = d.adrelid
            JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.adnum
            WHERE c.relname = 'requests' AND a.attname = 'test_date'
          ) THEN
            EXECUTE 'ALTER TABLE requests ALTER COLUMN test_date SET DEFAULT NOW()';
          END IF;
        END$$;
      `);

      await client.query(`UPDATE requests SET test_date = NOW() WHERE test_date IS NULL`);
    }

    await client.query('COMMIT');
    console.log('✅ test_date: DEFAULT выставлен, NULL заполнены');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция test_date DEFAULT провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
