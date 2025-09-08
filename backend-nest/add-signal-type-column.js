// backend-nest/add-signal-type-column.js
// Добавляет колонку signal_type в signals (если отсутствует).
// Запуск: node backend-nest/add-signal-type-column.js
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

    await client.query(`
      ALTER TABLE signals
        ADD COLUMN IF NOT EXISTS signal_type VARCHAR(32)
    `);

    await client.query('COMMIT');
    console.log('✅ Колонка signal_type готова');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция signal_type провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
