import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'signals', timestamps: false })
export default class Signal extends Model {
  @Column({ type: DataType.STRING, allowNull: false, primaryKey: true })
  signal_id!: string;

  @Column({ type: DataType.STRING(9), allowNull: false })
  mmsi!: string;

  @Column({ type: DataType.ENUM('test', 'alert', 'unscheduled'), allowNull: false })
  signal_type!: 'test' | 'alert' | 'unscheduled';

  @Column({ type: DataType.DATE, allowNull: false })
  received_at!: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  coordinates?: string;

  @Column({ type: DataType.ENUM('unlinked', 'processing', 'completed', 'rejected'), defaultValue: 'unlinked' })
  status?: 'unlinked' | 'processing' | 'completed' | 'rejected';

  @Column({ type: DataType.STRING(300), allowNull: true })
  comments?: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at?: Date;
}
