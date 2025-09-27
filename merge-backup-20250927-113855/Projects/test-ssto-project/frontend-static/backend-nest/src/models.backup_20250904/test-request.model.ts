// src/models/test-request.model.ts

import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import Vessel from './vessel.model';

@Table({ tableName: 'test_requests', timestamps: true })
export default class TestRequest extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => Vessel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  vessel_id: number;

  @Column({
    type: DataType.ENUM('routine', 'emergency', 'installation'),
    defaultValue: 'routine',
  })
  test_type: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  test_date: Date;

  @Column({
    type: DataType.ENUM('pending', 'approved', 'rejected', 'completed'),
    defaultValue: 'pending',
  })
  status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  rejection_reason: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  confirmation_sent: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  confirmation_sent_at: Date;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  // Связи
  @BelongsTo(() => Vessel)
  vessel: Vessel;
}

export { TestRequest };