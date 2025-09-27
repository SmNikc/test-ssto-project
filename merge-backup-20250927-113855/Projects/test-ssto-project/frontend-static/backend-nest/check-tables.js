const { Client } = require('pg');
require('dotenv').config();

async function checkTables() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    console.log('Существующие таблицы:');
    res.rows.forEach(row => console.log(' -', row.tablename));
    await client.end();
  } catch (err) {
    console.error('Ошибка:', err.message);
  }
}

checkTables();
