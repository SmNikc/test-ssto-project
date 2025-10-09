// backend-nest/scripts/bootstrap-sync.js
require('dotenv').config();
const path = require('path');
const { Sequelize } = require('sequelize-typescript');

(async () => {
  try {
    const host = process.env.DB_HOST || 'postgres';
    const port = parseInt(process.env.DB_PORT || '5432', 10);
    const username = process.env.DB_USER || process.env.DB_USERNAME || 'ssto';
    const password = process.env.DB_PASSWORD || 'sstopass';
    const database = process.env.DB_NAME || process.env.DB_DATABASE || 'sstodb';

    const sequelize = new Sequelize({
      dialect: 'postgres',
      host,
      port,
      username,
      password,
      database,
      autoLoadModels: true,
      models: [
        path.join(__dirname, '../dist/models/**/*.model.js'),
        path.join(__dirname, '../dist/models/*.model.js'),
      ],
      logging: false,
    });

    await sequelize.authenticate();
    console.log('DB connected. Syncing schema…');
    await sequelize.sync({ alter: true });
    console.log('Schema sync done.');
    process.exit(0);
  } catch (e) {
    console.error('Bootstrap sync error:', e);
    process.exit(1);
  }
})();
