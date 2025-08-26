// C:\Projects\test-ssto-project\backend-nest\test-db.js
// Проверка подключения к БД

const { Sequelize } = require('sequelize');

console.log('🔍 Проверка подключения к БД...\n');

const sequelize = new Sequelize('sstodb', 'ssto', 'sstopass', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false
});

sequelize.authenticate()
  .then(() => {
    console.log('✅ УСПЕХ! База данных подключена!\n');
    console.log('Параметры подключения:');
    console.log('  База данных: sstodb');
    console.log('  Пользователь: ssto');
    console.log('  Хост: localhost');
    console.log('  Порт: 5432');
    console.log('\nМожно запускать проект!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ ОШИБКА подключения к БД!\n');
    console.error('Ошибка:', err.message);
    console.log('\n📋 Чек-лист для проверки:');
    console.log('1. PostgreSQL запущен? (проверьте в Службах Windows)');
    console.log('2. База sstodb создана? (проверьте в pgAdmin)');
    console.log('3. Пользователь ssto создан? (проверьте в pgAdmin)');
    console.log('4. Пароль sstopass правильный?');
    console.log('5. PostgreSQL слушает порт 5432?');
    process.exit(1);
  });