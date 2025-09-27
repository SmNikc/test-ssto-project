// fix-database-sync.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\fix-database-sync.js

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'ssto',
  password: process.env.DB_PASSWORD || 'sstopass',
  database: process.env.DB_NAME || 'sstodb'
});

async function fixDatabase() {
  try {
    await client.connect();
    console.log('🔧 Исправление структуры базы данных...\n');
    
    // 1. Проверяем, есть ли колонка terminal_number
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'requests' 
      AND column_name = 'terminal_number';
    `);
    
    if (checkColumn.rowCount === 0) {
      console.log('⚠️  Колонка terminal_number отсутствует. Добавляем...');
      
      // 2. Добавляем недостающую колонку
      await client.query(`
        ALTER TABLE requests 
        ADD COLUMN IF NOT EXISTS terminal_number VARCHAR(50);
      `);
      console.log('✅ Колонка terminal_number добавлена');
      
      // 3. Заполняем значениями по умолчанию для существующих записей
      await client.query(`
        UPDATE requests 
        SET terminal_number = 'TERM-' || id::text 
        WHERE terminal_number IS NULL;
      `);
      console.log('✅ Заполнены значения по умолчанию');
    } else {
      console.log('✅ Колонка terminal_number уже существует');
    }
    
    // 4. Добавляем другие возможно отсутствующие колонки
    const columnsToAdd = [
      { name: 'email', type: 'VARCHAR(255)', default: "''" },
      { name: 'phone', type: 'VARCHAR(50)', default: "''" },
      { name: 'test_date', type: 'DATE', default: 'CURRENT_DATE' },
      { name: 'test_time', type: 'TIME', default: "'12:00:00'" },
      { name: 'confirmation_status', type: 'VARCHAR(50)', default: "'pending'" }
    ];
    
    for (const col of columnsToAdd) {
      const checkCol = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'requests' 
        AND column_name = '${col.name}';
      `);
      
      if (checkCol.rowCount === 0) {
        await client.query(`
          ALTER TABLE requests 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default};
        `);
        console.log(`✅ Добавлена колонка ${col.name}`);
      }
    }
    
    // 5. Проверяем результат
    console.log('\n📋 Итоговая структура таблицы requests:');
    const finalStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'requests'
      ORDER BY ordinal_position
      LIMIT 10;
    `);
    
    finalStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✨ База данных успешно обновлена!');
    console.log('\n🚀 Теперь перезапустите backend:');
    console.log('   Ctrl+C (остановить)');
    console.log('   npm run start:dev (запустить заново)');
    
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
  } finally {
    await client.end();
  }
}

fixDatabase();