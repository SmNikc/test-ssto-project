// backend-nest/src/models/request.ts
// Исправленная модель с полем imo
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
  ForeignKey,
  HasOne,
  Default,
} from 'sequelize-typescript';
import Signal from './signal.model';

@Table({
  tableName: 'requests',
  timestamps: true,
})
export default class SSASRequest extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  vessel_name: string;

  @Column({
    type: DataType.STRING(9),
    allowNull: false,
  })
  mmsi: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,  // IMO может быть необязательным
  })
  imo: string;  // ✅ ДОБАВЛЕНО ПОЛЕ IMO

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  ship_owner: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  contact_email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  contact_phone: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  test_date: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 2,
  })
  test_window_hours: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  inmarsat_number: string;

  @Default('pending')
  @Column({
    type: DataType.ENUM('pending', 'approved', 'testing', 'completed', 'cancelled'),
    allowNull: false,
  })
  status: string;

  @ForeignKey(() => Signal)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  signal_id: number;

  @BelongsTo(() => Signal)
  signal: Signal;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;
}