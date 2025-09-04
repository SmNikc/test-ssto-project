import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  UpdatedAt,
  HasMany,
  Default
} from 'sequelize-typescript';
import Signal from './signal.model';

@Table({
  tableName: 'ssas_terminals',
  timestamps: true,
  underscored: true
})
export default class SSASTerminal extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'Номер стойки ССТО - главный идентификатор'
  })
  terminalId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'MMSI судна'
  })
  mmsi: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'IMO номер судна'
  })
  imo: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'Название судна'
  })
  vesselName: string;

  @Column({
    type: DataType.ENUM('INMARSAT', 'IRIDIUM'),
    defaultValue: 'INMARSAT',
    comment: 'Тип системы'
  })
  terminalType: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'Дата последнего перемещения стойки'
  })
  lastTransferDate: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Предыдущее судно'
  })
  previousVessel: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Предыдущий MMSI'
  })
  previousMmsi: string;

  @Default('active')
  @Column({
    type: DataType.ENUM('active', 'inactive', 'maintenance', 'transferred'),
    comment: 'Статус терминала'
  })
  status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Примечания'
  })
  notes: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Signal, 'terminalId')
  signals: Signal[];

  validateMmsi(mmsi: string): boolean {
    if (this.mmsi === mmsi) {
      return true;
    }
    
    if (this.previousMmsi === mmsi) {
      console.warn('Стойка была перемещена с судна MMSI ' + mmsi);
      return true;
    }
    
    return false;
  }
}
