import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'testing_scenarios', timestamps: false })
export default class TestingScenario extends Model {
  @Column({ type: DataType.STRING, allowNull: false, primaryKey: true })
  scenario_id!: string;

  @Column({ type: DataType.STRING(300), allowNull: false })
  description!: string;

  @Column({ type: DataType.STRING(300), allowNull: false })
  expected_result!: string;

  @Column({ type: DataType.STRING(300), allowNull: true })
  actual_result?: string;

  @Column({ type: DataType.ENUM('planned', 'completed', 'failed'), defaultValue: 'planned' })
  status?: 'planned' | 'completed' | 'failed';

  @Column({ type: DataType.STRING(300), allowNull: true })
  comments?: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at?: Date;
}

export { default as TestingScenario } from "./testingScenario.model";

