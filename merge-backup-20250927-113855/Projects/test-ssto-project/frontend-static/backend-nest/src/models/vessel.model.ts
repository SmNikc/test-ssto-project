// src/models/vessel.model.ts
// ВОССТАНОВЛЕНИЕ СУЩЕСТВУЮЩЕГО ФАЙЛА из репозитория

import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'vessels',
  timestamps: true,
  underscored: true
})
export class Vessel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @Column({
    type: DataType.STRING(9),
    allowNull: false,
    unique: true
  })
  mmsi: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  name: string;

  @Column({
    type: DataType.STRING(7),
    allowNull: true
  })
  imo_number: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  call_sign: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  vessel_type: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  flag: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: true
  })
  length: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true
  })
  width: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true
  })
  is_active: boolean;

  @Column({
    type: DataType.FLOAT,
    allowNull: true
  })
  latitude: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true
  })
  longitude: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  owner_email: string;
}

export default Vessel;