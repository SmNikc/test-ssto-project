const { Client } = require('pg');
require('dotenv').config();

async function fixOwnership() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '3141',  // пароль postgres
    database: 'sstodb'
  });

  try {
    await client.connect();
    console.log('Подключились как postgres...');
    
    // Даем ssto права суперпользователя временно
    await client.query('ALTER USER ssto WITH SUPERUSER');
    console.log('✅ Права суперпользователя даны');
    
    // Меняем владельца всех таблиц
    const tables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    for (const row of tables.rows) {
      await client.query(`ALTER TABLE ${row.tablename} OWNER TO ssto`);
      console.log(`✅ Таблица ${row.tablename} передана ssto`);
    }
    
    await client.end();
    console.log('Готово!');
  } catch (err) {
    console.error('Ошибка:', err.message);
  }
}

fixOwnership();
