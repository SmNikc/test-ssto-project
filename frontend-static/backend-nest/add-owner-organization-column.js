// backend-nest/add-owner-organization-column.js
// Добавляет колонку owner_organization в requests (если отсутствует).
// Запуск: node backend-nest/add-owner-organization-column.js
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
      ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS owner_organization VARCHAR(255)
    `);

    await client.query('COMMIT');
    console.log('✅ Колонка owner_organization готова');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция owner_organization провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
