// test-postgres-connection.js
// Сохранить в C:\Projects\test-ssto-project\backend-nest\test-postgres-connection.js

const { Client } = require('pg');
require('dotenv').config();

console.log('🔍 Проверка подключения к PostgreSQL...\n');
console.log('Используемые настройки из .env:');
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('DB_PORT:', process.env.DB_PORT || 5432);
console.log('DB_USER:', process.env.DB_USER || 'ssto');
console.log('DB_NAME:', process.env.DB_NAME || 'sstodb');
console.log('-----------------------------------\n');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'ssto',
  password: process.env.DB_PASSWORD || 'sstopass',
  database: process.env.DB_NAME || 'sstodb'
});

async function testConnection() {
  try {
    console.log('📡 Подключаемся к PostgreSQL...');
    await client.connect();
    
    // Проверка версии
    const versionResult = await client.query('SELECT version()');
    console.log('✅ Подключение успешно!');
    console.log('📊 Версия:', versionResult.rows[0].version);
    
    // Проверка существующих таблиц
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('\n📋 Найдены таблицы:');
      tablesResult.rows.forEach(row => {
        console.log('  - ' + row.table_name);
      });
      
      // Проверка данных в таблице requests
      const requestsCount = await client.query('SELECT COUNT(*) FROM requests');
      console.log(`\n📊 Количество заявок в БД: ${requestsCount.rows[0].count}`);
    } else {
      console.log('\n⚠️  Таблицы не найдены! Нужно запустить миграции.');
    }
    
  } catch (err) {
    console.error('❌ Ошибка подключения:', err.message);
    console.log('\n🔧 Рекомендации:');
    console.log('1. Проверьте, запущен ли PostgreSQL:');
    console.log('   Get-Service -Name "postgresql*"');
    console.log('2. Проверьте файл .env в backend-nest');
    console.log('3. Создайте БД и пользователя если их нет:');
    console.log('   psql -U postgres');
    console.log('   CREATE DATABASE sstodb;');
    console.log('   CREATE USER ssto WITH PASSWORD \'sstopass\';');
    console.log('   GRANT ALL PRIVILEGES ON DATABASE sstodb TO ssto;');
  } finally {
    await client.end();
  }
}

testConnection();