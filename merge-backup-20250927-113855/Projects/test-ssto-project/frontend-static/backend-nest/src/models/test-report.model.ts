import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  Default
} from 'sequelize-typescript';
import SSASRequest from './request.model';

@Table({
  tableName: 'test_reports',
  timestamps: true,
  underscored: true
})
export default class TestReport extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => SSASRequest)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'ID заявки'
  })
  requestId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'Номер отчета'
  })
  reportNumber: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: 'Дата формирования отчета'
  })
  reportDate: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    comment: 'Количество сигналов 406'
  })
  signals406Count: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    comment: 'Количество сигналов 121.5'
  })
  signals121Count: number;

  @Default('pending')
  @Column({
    type: DataType.ENUM('pending', 'success', 'partial', 'failed'),
    comment: 'Результат теста'
  })
  testResult: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Заключение'
  })
  conclusion: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Путь к PDF файлу'
  })
  pdfPath: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => SSASRequest)
  request: SSASRequest;
}
