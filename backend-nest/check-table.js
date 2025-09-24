const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sstodb',
  user: 'ssto',
  password: 'sstopass'
});

async function checkTable() {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Колонки в таблице users:');
    result.rows.forEach(row => console.log('-', row.column_name));
  } catch (err) {
    console.error('Ошибка:', err.message);
  }
  pool.end();
}

checkTable();