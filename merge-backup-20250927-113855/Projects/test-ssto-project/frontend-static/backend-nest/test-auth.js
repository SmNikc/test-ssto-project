const { Client } = require('pg');

async function checkAuth() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'ssto',
    password: 'sstopass',
    database: 'sstodb'
  });

  try {
    console.log('Подключение с pg напрямую...');
    await client.connect();
    const res = await client.query('SELECT current_user, session_user');
    console.log('✅ Успех! Пользователь:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    console.error('Код ошибки:', err.code);
  }
}

checkAuth();
