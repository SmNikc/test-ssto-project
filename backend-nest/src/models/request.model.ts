// backend-nest/src/models/request.model.ts
// Модель заявки, соответствующая структуре таблицы requests

import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'requests',
  timestamps: true,
  underscored: true,
})
export default class SSASRequest extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  // In the current database schema the table does not contain a separate
  // `request_id` column – the auto-incremented `id` column is used as the
  // identifier.  Previously the model expected a physical `request_id`
  // column which caused SQL errors like "column \"request_id\" does not
  // exist" when querying the table.  To maintain backward compatibility with
  // the frontend (which still expects a `request_id` field) we expose the
  // numeric `id` value through a virtual column.
  @Column({
    type: DataType.VIRTUAL,
    get(this: SSASRequest) {
      const id = this.getDataValue('id');
      return id != null ? id.toString() : undefined;
    },
    // No setter: the value is derived from `id`
  })
  request_id: string;

  @Column({
    field: 'vessel_name',
    type: DataType.STRING,
    allowNull: false,
  })
  vessel_name: string;

  @Column({
    field: 'mmsi',
    type: DataType.STRING,
    allowNull: false,
  })
  mmsi: string;

  @Column({
    field: 'imo_number',
    type: DataType.STRING,
  })
  imo_number: string;

  @Column({
    field: 'ssas_number',
    type: DataType.STRING,
  })
  ssas_number: string;

  @Column({
    field: 'owner_organization',
    type: DataType.STRING,
  })
  owner_organization: string;

  @Column({
    field: 'contact_person',
    type: DataType.STRING,
    allowNull: false,
  })
  contact_person: string;

  @Column({
    field: 'contact_phone',
    type: DataType.STRING,
    allowNull: false,
  })
  contact_phone: string;

  @Column({
    field: 'contact_email',
    type: DataType.STRING,
    allowNull: false,
  })
  contact_email: string;

  @Column({
    field: 'test_date',
    type: DataType.DATE,
  })
  test_date: Date;

  @Column({
    field: 'planned_test_date',
    type: DataType.DATE,
  })
  planned_test_date: Date;

  @Column({
    field: 'start_time',
    type: DataType.STRING,
  })
  start_time: string;

  @Column({
    field: 'end_time',
    type: DataType.STRING,
  })
  end_time: string;

  @Column({
    field: 'notes',
    type: DataType.TEXT,
  })
  notes: string;

  @Column({
    field: 'status',
    type: DataType.STRING,
    defaultValue: 'DRAFT',
  })
  status: string;

  @Column({
    field: 'test_type',
    type: DataType.STRING,
    defaultValue: 'routine',
  })
  test_type: string;

  @Column({
    field: 'signal_received_time',
    type: DataType.STRING,
  })
  signal_received_time: string;

  @Column({
    field: 'signal_coordinates',
    type: DataType.STRING,
  })
  signal_coordinates: string;

  @Column({
    field: 'signal_strength',
    type: DataType.STRING,
  })
  signal_strength: string;

  @Column({
    field: 'vessel_id',
    type: DataType.INTEGER,
  })
  vessel_id: number;

  @Column({
    field: 'signal_id',
    type: DataType.INTEGER,
  })
  signal_id: number;

  @Column({
    field: 'confirmation_sent_at',
    type: DataType.STRING,
  })
  confirmation_sent_at: string;

  @CreatedAt
  @Column({
    field: 'created_at',
    type: DataType.DATE,
  })
  created_at: Date;

  @UpdatedAt
  @Column({
    field: 'updated_at',
    type: DataType.DATE,
  })
  updated_at: Date;
}

