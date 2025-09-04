import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'ssas_signals',
  timestamps: true
})
export default class Signal extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  terminal_number: string;

  @Column({
    type: DataType.STRING(9),
    allowNull: false
  })
  mmsi: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'TEST'
  })
  signal_type: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  received_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  detection_time: Date;

  @Column({
    type: DataType.STRING,
    defaultValue: 'UNMATCHED'
  })
  status: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  request_id: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true
  })
  call_sign: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  coordinates: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  metadata: any;
}

