import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize';

const SSASRequest = sequelize.define('SSASRequest', {
  request_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  mmsi: {
    type: DataTypes.STRING(9),
    allowNull: false,
    validate: { len: [9, 9] },
  },
  vessel_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  ssas_number: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  owner_organization: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  contact_person: {
    type: DataTypes.STRING(40),
    allowNull: false,
  },
  contact_phone: {
    type: DataTypes.STRING(17), // Формат +X (XXX) XXX-XX-XX
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  test_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  start_time: {
    type: DataTypes.STRING(5), // Формат HH:MM
    allowNull: false,
  },
  end_time: {
    type: DataTypes.STRING(5), // Формат HH:MM
    allowNull: false,
  },
  notes: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },

export default SSASRequest;
