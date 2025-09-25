// backend-nest/migrations/add-vessel-name.js
require('dotenv').config({ path: '.env' });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_CONNECTION_STRING, {
  dialect: 'postgres',
  logging: false,
});

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Подключение к БД успешно.');
    
    await sequelize.query(`
      ALTER TABLE signals 
      ADD COLUMN IF NOT EXISTS vessel_name VARCHAR(255);
    `);
    
    console.log('Колонка vessel_name добавлена успешно.');
  } catch (error) {
    console.error('Ошибка миграции:', error);
  } finally {
    await sequelize.close();
  }
}

migrate();