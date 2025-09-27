// update-db-columns.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\update-db-columns.js
// Обновляет структуру БД через Node.js

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'ssto',
  password: process.env.DB_PASSWORD || 'sstopass',
  database: process.env.DB_NAME || 'sstodb'
});

async function updateDatabase() {
  try {
    await client.connect();
    console.log('🔧 Обновление структуры БД...\n');
    
    // Добавляем колонки в таблицу signals
    const alterCommands = [
      { name: 'detection_time', sql: 'ALTER TABLE signals ADD COLUMN IF NOT EXISTS detection_time TIMESTAMP' },
      { name: 'received_at', sql: 'ALTER TABLE signals ADD COLUMN IF NOT EXISTS received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'status', sql: 'ALTER TABLE signals ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'UNMATCHED\'' },
      { name: 'mmsi', sql: 'ALTER TABLE signals ADD COLUMN IF NOT EXISTS mmsi VARCHAR(9)' },
      { name: 'call_sign', sql: 'ALTER TABLE signals ADD COLUMN IF NOT EXISTS call_sign VARCHAR(20)' },
      { name: 'coordinates', sql: 'ALTER TABLE signals ADD COLUMN IF NOT EXISTS coordinates JSONB' },
      { name: 'metadata', sql: 'ALTER TABLE signals ADD COLUMN IF NOT EXISTS metadata JSONB' }
    ];
    
    for (const cmd of alterCommands) {
      try {
        await client.query(cmd.sql);
        console.log(`✅ Колонка ${cmd.name} добавлена или уже существует`);
      } catch (err) {
        console.log(`⚠️  Колонка ${cmd.name}: ${err.message}`);
      }
    }
    
    // Проверяем результат
    console.log('\n📋 Проверка структуры таблицы signals:');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'signals'
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\n✨ БД успешно обновлена!');
    
  } catch (err) {
    console.error('❌ Ошибка подключения к БД:', err.message);
    console.log('\nПроверьте настройки в файле .env:');
    console.log('  DB_HOST=' + (process.env.DB_HOST || 'localhost'));
    console.log('  DB_PORT=' + (process.env.DB_PORT || 5432));
    console.log('  DB_USER=' + (process.env.DB_USER || 'ssto'));
    console.log('  DB_NAME=' + (process.env.DB_NAME || 'sstodb'));
  } finally {
    await client.end();
  }
}

updateDatabase();