import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DB_URL!, { dialect: 'postgres' });

const Signal = sequelize.define('Signal', {
  signal_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  mmsi: {
    type: DataTypes.STRING(9),
    allowNull: false,
    validate: { len: [9, 9] },
  },
  signal_type: {
    type: DataTypes.ENUM('test', 'alert', 'unscheduled'),
    allowNull: false,
  },
  received_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  coordinates: {
    type: DataTypes.STRING, // Формат: "latitude,longitude"
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('unlinked', 'processing', 'completed', 'rejected'),
    defaultValue: 'unlinked',
  },
  comments: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
});

sequelize.sync();

export default Signal;
