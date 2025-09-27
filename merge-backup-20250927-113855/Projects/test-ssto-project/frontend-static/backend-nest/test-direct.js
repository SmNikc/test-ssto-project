const { Sequelize } = require('sequelize');

async function testDirect() {
  const sequelize = new Sequelize('postgres://ssto:sstopass@localhost:5432/sstodb', {
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      charset: 'utf8',
      collate: 'utf8_general_ci'
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Успех!');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testDirect();
