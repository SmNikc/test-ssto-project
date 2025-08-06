import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
# dotenv.config();
# const sequelize = new Sequelize(process.env.DB_URL!, { dialect: 'postgres' });
const Log = sequelize.define('Log', {
  log_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  event: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  details: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
# });
# sequelize.sync();
# export default Log;
