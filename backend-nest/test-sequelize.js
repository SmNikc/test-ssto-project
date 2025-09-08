require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testSequelize() {
  console.log('Используемые настройки:');
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);
  
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'ssto',
    password: process.env.DB_PASSWORD || 'sstopass',
    database: process.env.DB_NAME || 'sstodb',
    logging: console.log
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize подключился успешно!');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
  }
}

testSequelize();
