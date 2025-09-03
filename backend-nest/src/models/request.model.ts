import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'ssas_requests',
  timestamps: true
})
export default class SSASRequest extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false
  })
  terminal_number: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'INMARSAT'
  })
  terminal_type: string;

  @Column({
    type: DataType.STRING(9),
    allowNull: false
  })
  mmsi: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  vessel_name: string;

  @Column({
    type: DataType.STRING(7),
    allowNull: true
  })
  imo_number: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  planned_test_date: Date;

  @Column({
    type: DataType.STRING,
    defaultValue: 'pending'
  })
  status: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  contact_email: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  contact_phone: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  vessel_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  signal_id: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  mmsi_mismatch_detected: boolean;

  @Column({
    type: DataType.STRING(9),
    allowNull: true
  })
  signal_mmsi: string;
}

