// backend-nest/add-planned-test-date-column.js
// Добавляет planned_test_date в requests (если отсутствует) и
// заполняет её из test_date (если есть) либо NOW().
// Запуск: node backend-nest/add-planned-test-date-column.js

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
        ADD COLUMN IF NOT EXISTS planned_test_date TIMESTAMPTZ
    `);

    // 2) Заполняем planned_test_date, если она NULL
    await client.query(`
      UPDATE requests
         SET planned_test_date =
           COALESCE(planned_test_date, test_date, NOW())
    `);

    // (Опционально можно задать DEFAULT NOW(), но обычно это делает приложение)
    // ALTER TABLE requests ALTER COLUMN planned_test_date SET DEFAULT NOW();

    await client.query('COMMIT');
    console.log('✅ planned_test_date: колонка добавлена, значения заполнены');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция planned_test_date провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
