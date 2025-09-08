// backend-nest/add-request-extra-columns.js
// Добавляет недостающие поля, которые ожидает текущий код заявок (requests):
//  - signal_received_time (строка/метка времени письма/сигнала)
//  - signal_coordinates   (строка координат из письма)
//  - signal_strength      (уровень/метка из письма)
//  - confirmation_sent_at (когда ушло подтверждение)
//  - original_email       (кусок исходного письма для аудита)
//  - test_datetime        (если код присылает это поле как отдельное)
// Запуск: node backend-nest/add-request-extra-columns.js
//
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

    // 1) Добавляем недостающие колонки (идемпотентно)
    await client.query(`
      ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS signal_received_time VARCHAR(64),
        ADD COLUMN IF NOT EXISTS signal_coordinates   VARCHAR(128),
        ADD COLUMN IF NOT EXISTS signal_strength      VARCHAR(64),
        ADD COLUMN IF NOT EXISTS confirmation_sent_at VARCHAR(64),
        ADD COLUMN IF NOT EXISTS original_email       TEXT,
        ADD COLUMN IF NOT EXISTS test_datetime        TIMESTAMPTZ
    `);

    // 2) Безопасные заполнения (если нужно)
    await client.query(`
      UPDATE requests
         SET confirmation_sent_at = COALESCE(confirmation_sent_at, '')
       WHERE confirmation_sent_at IS NULL
    `);
    await client.query(`
      UPDATE requests
         SET signal_strength = COALESCE(signal_strength, '')
       WHERE signal_strength IS NULL
    `);

    await client.query('COMMIT');
    console.log('✅ Доп. колонки заявок добавлены/приведены к консистентному виду');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Миграция add-request-extra-columns провалилась:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
