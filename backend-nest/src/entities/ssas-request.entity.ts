import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { SSASTerminal } from './ssas-terminal.entity';

@Table({
  tableName: 'ssas_requests',
  timestamps: true
})
export class SSASRequest extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true
  })
  id: number;

  @ForeignKey(() => SSASTerminal)
  @Column({
    type: DataType.STRING(50),
    allowNull: false
  })
  terminal_number: string;

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
    type: DataType.STRING(7)
  })
  imo_number: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  organization_name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  contact_person: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false
  })
  contact_phone: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  contact_email: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  planned_test_date: Date;

  @Column({
    type: DataType.ENUM('pending', 'approved', 'rejected', 'completed', 'failed'),
    defaultValue: 'pending'
  })
  status: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  mmsi_mismatch_detected: boolean;

  @Column({
    type: DataType.STRING(9)
  })
  signal_mmsi: string;

  @BelongsTo(() => SSASTerminal)
  terminal: SSASTerminal;
}
