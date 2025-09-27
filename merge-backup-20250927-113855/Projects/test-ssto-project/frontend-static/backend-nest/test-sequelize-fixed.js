require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testSequelize() {
  // Вариант 1: Строка подключения
  const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  console.log('Строка подключения:', connectionString.replace(/:sstopass/, ':***'));
  
  const sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize подключился успешно через строку подключения!');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    
    // Вариант 2: Попробуем с отдельными параметрами
    console.log('\nПробуем с отдельными параметрами...');
    const seq2 = new Sequelize(
      process.env.DB_NAME,     // database
      process.env.DB_USER,      // username
      process.env.DB_PASSWORD,  // password
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false
      }
    );
    
    try {
      await seq2.authenticate();
      console.log('✅ Sequelize подключился через отдельные параметры!');
      await seq2.close();
    } catch (err2) {
      console.error('❌ И это не сработало:', err2.message);
    }
  }
}

testSequelize();
