import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { SSASSignal } from './ssas-signal.entity';

@Table({
  tableName: 'ssas_signal_locations',
  timestamps: true
})
export class SSASSignalLocation extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true
  })
  id: number;

  @ForeignKey(() => SSASSignal)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  signal_id: number;

  @Column({
    type: DataType.DECIMAL(10, 6),
    allowNull: false
  })
  latitude: number;

  @Column({
    type: DataType.DECIMAL(10, 6),
    allowNull: false
  })
  longitude: number;

  @Column({
    type: DataType.STRING(20)
  })
  latitude_dms: string;

  @Column({
    type: DataType.STRING(20)
  })
  longitude_dms: string;

  @Column({
    type: DataType.ENUM('test', 'real', 'unknown'),
    allowNull: false
  })
  signal_type: string;

  @Column({
    type: DataType.INTEGER
  })
  course: number;

  @Column({
    type: DataType.DECIMAL(5, 2)
  })
  speed: number;

  @Column({
    type: DataType.DATE
  })
  position_updated: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  transferred_to_poisk_more: boolean;

  @Column({
    type: DataType.DATE
  })
  transfer_date: Date;

  @Column({
    type: DataType.STRING(100)
  })
  poisk_more_id: string;

  @BelongsTo(() => SSASSignal)
  signal: SSASSignal;
}