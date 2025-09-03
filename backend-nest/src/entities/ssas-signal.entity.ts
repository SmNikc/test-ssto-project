import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { SSASTerminal } from './ssas-terminal.entity';
import { SSASRequest } from './ssas-request.entity';

@Table({
  tableName: 'ssas_signals',
  timestamps: true
})
export class SSASSignal extends Model {
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
    type: DataType.STRING(9)
  })
  mmsi: string;

  @Column({
    type: DataType.STRING(100)
  })
  vessel_name: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  signal_time: Date;

  @Column({
    type: DataType.DECIMAL(10, 6)
  })
  latitude: number;

  @Column({
    type: DataType.DECIMAL(10, 6)
  })
  longitude: number;

  @Column({
    type: DataType.ENUM('test', 'real', 'unknown'),
    defaultValue: 'unknown'
  })
  signal_type: string;

  @Column({
    type: DataType.TEXT
  })
  raw_message: string;

  @ForeignKey(() => SSASRequest)
  @Column({
    type: DataType.INTEGER
  })
  request_id: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  is_processed: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  transferred_to_poisk_more: boolean;

  @Column({
    type: DataType.STRING(100)
  })
  poisk_more_id: string;

  @Column({
    type: DataType.DATE
  })
  transfer_date: Date;

  @BelongsTo(() => SSASTerminal)
  terminal: SSASTerminal;

  @BelongsTo(() => SSASRequest)
  request: SSASRequest;
}
