import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  Default
} from 'sequelize-typescript';

@Table({
  tableName: 'system_settings',
  timestamps: true,
  underscored: true
})
export default class SystemSettings extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    comment: 'Ключ настройки'
  })
  key: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: 'Значение настройки'
  })
  value: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Описание настройки'
  })
  description: string;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    comment: 'Активна ли настройка'
  })
  isActive: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
