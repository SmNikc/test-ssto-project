// src/models/vessel.model.ts

import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import TestRequest from './test-request.model';

@Table({ tableName: 'vessels', timestamps: true })
export default class Vessel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: true,
  })
  imo_number: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  call_sign: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  mmsi: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  vessel_type: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  gross_tonnage: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  flag: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  port_of_registry: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  owner_name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  owner_email: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  owner_phone: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  latitude: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  longitude: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  speed: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  course: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_position_time: Date;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  // Связи
  @HasMany(() => TestRequest)
  testRequests: TestRequest[];
}

export { Vessel };