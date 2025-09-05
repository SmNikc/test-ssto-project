// src/models/request.model.ts
// ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ МОДЕЛЬ
// Сохраните этот файл как C:\Projects\test-ssto-project\backend-nest\src\models\request.model.ts

import { Table, Column, Model, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'requests',
  timestamps: true,
  underscored: true  // Это важно для snake_case полей в БД
})
export default class SSASRequest extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @Column({
    field: 'vessel_name',
    type: DataType.STRING,
    allowNull: false
  })
  vessel_name: string;

  @Column({
    field: 'mmsi',
    type: DataType.STRING
  })
  mmsi: string;

  @Column({
    field: 'imo',
    type: DataType.STRING
  })
  imo: string;

  @Column({
    field: 'ship_owner',
    type: DataType.STRING
  })
  ship_owner: string;

  @Column({
    field: 'contact_email',
    type: DataType.STRING
  })
  contact_email: string;

  @Column({
    field: 'contact_phone',
    type: DataType.STRING
  })
  contact_phone: string;

  @Column({
    field: 'test_date',
    type: DataType.DATE
  })
  test_date: Date;

  @Column({
    field: 'test_window_hours',
    type: DataType.INTEGER,
    defaultValue: 24
  })
  test_window_hours: number;

  @Column({
    field: 'inmarsat_number',
    type: DataType.STRING
  })
  inmarsat_number: string;

  @Column({
    field: 'request_number',
    type: DataType.STRING
  })
  request_number: string;

  @Column({
    field: 'status',
    type: DataType.STRING,
    defaultValue: 'pending'
  })
  status: string;

  @Column({
    field: 'confirmation_status',
    type: DataType.STRING,
    defaultValue: 'pending'
  })
  confirmation_status: string;

  // Если terminal_number есть в БД, раскомментируйте:
  @Column({
    field: 'terminal_number',
    type: DataType.STRING,
    allowNull: true
  })
  terminal_number: string;

  @Column({
    field: 'email',
    type: DataType.STRING,
    allowNull: true
  })
  email: string;

  @Column({
    field: 'phone',
    type: DataType.STRING,
    allowNull: true
  })
  phone: string;

  @Column({
    field: 'test_time',
    type: DataType.TIME,
    allowNull: true
  })
  test_time: string;

  @CreatedAt
  @Column({
    field: 'created_at',
    type: DataType.DATE
  })
  created_at: Date;

  @UpdatedAt
  @Column({
    field: 'updated_at',
    type: DataType.DATE
  })
  updated_at: Date;

  @Column({
    field: 'signal_id',
    type: DataType.INTEGER,
    allowNull: true
  })
  signal_id: number;


  // Геттеры для совместимости с разными названиями полей

  @Column({
    field: 'vessel_id',
    type: DataType.INTEGER,
    allowNull: true
  })
  vessel_id: number;

  get imo_number(): string {
    return this.imo || '';
  }

  get planned_test_date(): Date {
    return this.test_date;
  }

}