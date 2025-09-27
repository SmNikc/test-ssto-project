// backend-nest/add-request-times-and-signal-terminal-id.js
// Добавляет:
//   - requests.start_time / requests.end_time  (строки "HH:mm")
//   - signals.terminal_id  (INTEGER, без FK)
// Запуск: node backend-nest/add-request-times-and-signal-terminal-id.js

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

    // --- requests: start_time / end_time ---
    await client.query(`
      ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS start_time VARCHAR(16),
        ADD COLUMN IF NOT EXISTS end_time   VARCHAR(16)
    `);

    // Проставим безопасные значения там, где NULL
    await client.query(`UPDATE requests SET start_time = COALESCE(start_time, '10:00')`);
    await client.query(`UPDATE requests SET end_time   = COALESCE(end_time,   '14:00')`);

    // --- signals: terminal_id ---
    await client.query(`
      ALTER TABLE signals
        ADD COLUMN IF NOT EXISTS terminal_id INTEGER
    `);

    await client.query('COMMIT');
    console.log('✅ requests.start_time/end_time и signals.terminal_id добавлены/заполнены при необходимости');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция add-request-times-and-signal-terminal-id провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
