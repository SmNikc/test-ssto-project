CopyEdit
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
# dotenv.config();
# const sequelize = new Sequelize(process.env.DB_URL!, { dialect: 'postgres' });
const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  role: {
    type: DataTypes.ENUM('shipowner', 'operator', 'admin', 'tester'),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
# });
# sequelize.sync();
# export default User;
