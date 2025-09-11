// backend-nest/add-ssas-number-column.js
// Добавляет колонку ssas_number в requests (если отсутствует).
// Запуск: node backend-nest/add-ssas-number-column.js

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
        ADD COLUMN IF NOT EXISTS ssas_number VARCHAR(64)
    `);

    await client.query('COMMIT');
    console.log('✅ Колонка ssas_number готова');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция ssas_number провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
