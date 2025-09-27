import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'logs', timestamps: false })
export default class Log extends Model {
  @Column({ type: DataType.STRING, allowNull: false, primaryKey: true })
  log_id!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  event!: string;

  @Column({ type: DataType.STRING(300), allowNull: true })
  details?: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at?: Date;
}

export { default as Log } from "./log.model";


