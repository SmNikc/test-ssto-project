import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import SSASRequest from './request';
@Table({ tableName: 'signals' })
export class Signal extends Model<Signal> {
  @Column({ type: DataType.STRING, primaryKey: true })
  signal_id!: string;
  @Column({ type: DataType.STRING(9), allowNull: false })
  mmsi!: string;
  @Column({ type: DataType.ENUM('test', 'alert', 'unscheduled'), allowNull: false })
  signal_type!: string;
  @Column({ type: DataType.DATE, allowNull: false })
  received_at!: Date;
  @Column({ type: DataType.STRING })
  coordinates?: string;
  @Column({ type: DataType.ENUM('unlinked', 'processing', 'completed', 'rejected'), defaultValue: 'unlinked' })
  status!: string;
  @Column({ type: DataType.STRING(300) })
  comments?: string;
  @Column({ type: DataType.ENUM('manual', 'external'), defaultValue: 'external' })
  source!: string;
  @ForeignKey(() => SSASRequest)
  @Column({ type: DataType.STRING })
  request_id?: string;
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at!: Date;
}
export default Signal;
