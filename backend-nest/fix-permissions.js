const { Client } = require('pg');

async function tryPasswords() {
  const passwords = ['postgres', 'admin', '3141', 'PostgresServ5432#', 'sstopass'];
  
  for (const pass of passwords) {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: pass,
      database: 'sstodb'
    });
    
    try {
      await client.connect();
      console.log(`✅ Пароль postgres: ${pass}`);
      
      // Даем права
      await client.query('GRANT ALL ON SCHEMA public TO ssto');
      await client.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO ssto');
      await client.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ssto');
      console.log('✅ Права выданы пользователю ssto');
      
      await client.end();
      return;
    } catch (err) {
      console.log(`❌ Пароль ${pass} не подошел`);
    }
  }
}

tryPasswords();
