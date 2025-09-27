// add-test-type-column.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\add-test-type-column.js

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'ssto',
  password: process.env.DB_PASSWORD || 'sstopass',
  database: process.env.DB_NAME || 'sstodb'
});

async function addTestTypeColumn() {
  try {
    await client.connect();
    console.log('🔧 Добавление колонки test_type в таблицу requests...\n');
    
    // Добавляем колонку test_type
    await client.query(`
      ALTER TABLE requests 
      ADD COLUMN IF NOT EXISTS test_type VARCHAR(50) DEFAULT 'routine'
    `);
    console.log('✅ Колонка test_type добавлена');
    
    // Проверяем что колонка добавилась
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'requests' 
      AND column_name = 'test_type'
    `);
    
    if (result.rows.length > 0) {
      console.log('\n✅ Колонка test_type успешно добавлена:');
      console.log(`  Тип: ${result.rows[0].data_type}`);
      console.log(`  Значение по умолчанию: ${result.rows[0].column_default}`);
    }
    
    // Показываем все колонки таблицы
    console.log('\n📋 Все колонки таблицы requests:');
    const allColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'requests'
      ORDER BY ordinal_position
    `);
    
    allColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✨ База данных обновлена!');
    
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
  } finally {
    await client.end();
  }
}

addTestTypeColumn();