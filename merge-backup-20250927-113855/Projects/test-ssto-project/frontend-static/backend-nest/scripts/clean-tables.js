const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'ssto',
  password: 'sstopass',
  database: 'sstodb'
});

async function cleanTables() {
  try {
    await client.connect();
    console.log('Подключено к БД как ssto');
    
    const res1 = await client.query('DROP TABLE IF EXISTS signals CASCADE');
    console.log('Таблица signals удалена');
    
    const res2 = await client.query('DROP TABLE IF EXISTS requests CASCADE');
    console.log('Таблица requests удалена');
    
    console.log('Все таблицы очищены!');
  } catch (err) {
    console.error('Ошибка:', err.message);
  } finally {
    await client.end();
  }
}

cleanTables();
