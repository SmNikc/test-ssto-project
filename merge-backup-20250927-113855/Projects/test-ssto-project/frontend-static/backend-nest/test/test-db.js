const { Client } = require('pg');

async function testConnection() {
  // Попробуем подключиться с разными учетными данными
  const configs = [
    { user: 'ssto', password: 'sstopass', database: 'sstodb' },
    { user: 'postgres', password: 'postgres', database: 'sstodb' },
    { user: 'postgres', password: 'postgres', database: 'postgres' },
  ];

  for (const config of configs) {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      ...config
    });

    try {
      await client.connect();
      console.log(`✅ УСПЕХ с user=${config.user}, database=${config.database}`);
      await client.end();
      return config;
    } catch (err) {
      console.log(`❌ Ошибка с user=${config.user}: ${err.message}`);
    }
  }
}

testConnection();