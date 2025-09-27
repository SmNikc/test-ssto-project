// backend-nest/add-signal-terminal-number.js
// Добавляет колонку terminal_number в signals (если отсутствует).
// Запуск: node backend-nest/add-signal-terminal-number.js

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
        ADD COLUMN IF NOT EXISTS terminal_number VARCHAR(64)
    `);

    await client.query('COMMIT');
    console.log('✅ Колонка terminal_number готова');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция terminal_number провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
