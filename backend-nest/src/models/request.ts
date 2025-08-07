import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'ssas_requests', timestamps: false })
export default class SSASRequest extends Model {
  @Column({ type: DataType.STRING, allowNull: false, primaryKey: true })
  request_id!: string;

  @Column({ type: DataType.STRING(9), allowNull: false })
  mmsi!: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  vessel_name!: string;

  @Column({ type: DataType.STRING(15), allowNull: false })
  ssas_number!: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  owner_organization!: string;

  @Column({ type: DataType.STRING(40), allowNull: false })
  contact_person!: string;

  @Column({ type: DataType.STRING(17), allowNull: false })
  contact_phone!: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  email!: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  test_date!: Date;

  @Column({ type: DataType.STRING(5), allowNull: false })
  start_time!: string;

  @Column({ type: DataType.STRING(5), allowNull: false })
  end_time!: string;

  @Column({ type: DataType.STRING(300), allowNull: true })
  notes?: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at?: Date;
}
