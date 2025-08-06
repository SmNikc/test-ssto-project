CopyEdit
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
# dotenv.config();
# const sequelize = new Sequelize(process.env.DB_URL!, { dialect: 'postgres' });
const TestingScenario = sequelize.define('TestingScenario', {
  scenario_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  expected_result: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  actual_result: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('planned', 'completed', 'failed'),
    defaultValue: 'planned',
  },
  comments: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
# });
# sequelize.sync();
# export default TestingScenario;
