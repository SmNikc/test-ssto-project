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
export class SSASRequest extends Model<SSASRequest> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  // В БД нет отдельного физического request_id.
  // Для обратной совместимости фронта выдаём id как строку.
  @Column({
    type: DataType.VIRTUAL,
    get(this: SSASRequest) {
      const id = this.getDataValue('id');
      return id != null ? String(id) : undefined;
    },
  })
  request_id?: string;

  // Годовая сквозная нумерация (например, REQ-2025-000123) — заполняется триггером
  @Column({
    field: 'request_number',
    type: DataType.STRING,
    allowNull: true, // генерируется на стороне БД
    unique: true,
  })
  request_number?: string;

  // Источник/UID дедупликации (email UID, внешняя форма и т.п.)
  @Column({
    field: 'source_uid',
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  source_uid?: string;

  @Column({
    field: 'vessel_name',
    type: DataType.STRING,
    allowNull: false,
  })
  vessel_name!: string;

  @Column({
    field: 'mmsi',
    type: DataType.STRING,
    allowNull: false,
  })
  mmsi!: string;

  @Column({
    field: 'imo_number',
    type: DataType.STRING,
    allowNull: true,
  })
  imo_number?: string;

  @Column({
    field: 'ssas_number',
    type: DataType.STRING,
    allowNull: true,
  })
  ssas_number?: string;

  // Историческое поле организации-владельца, оставляем (некоторые формы его шлют)
  @Column({
    field: 'owner_organization',
    type: DataType.STRING,
    allowNull: true,
  })
  owner_organization?: string;

  // Явный судовладелец — в БД стоит DEFAULT 'N/A SHIP OWNER'
  @Column({
    field: 'ship_owner',
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'N/A SHIP OWNER',
  })
  ship_owner!: string;

  @Column({
    field: 'contact_person',
    type: DataType.STRING,
    allowNull: false,
  })
  contact_person!: string;

  @Column({
    field: 'contact_phone',
    type: DataType.STRING,
    allowNull: false,
  })
  contact_phone!: string;

  @Column({
    field: 'contact_email',
    type: DataType.STRING,
    allowNull: false,
  })
  contact_email!: string;

  @Column({
    field: 'test_date',
    type: DataType.DATE,
    allowNull: true, // в БД теперь есть DEFAULT NOW(); здесь не мешаем валидацией
  })
  test_date?: Date;

  @Column({
    field: 'planned_test_date',
    type: DataType.DATE,
    allowNull: true,
  })
  planned_test_date?: Date;

  @Column({
    field: 'start_time',
    type: DataType.STRING,
    allowNull: true,
  })
  start_time?: string;

  @Column({
    field: 'end_time',
    type: DataType.STRING,
    allowNull: true,
  })
  end_time?: string;

  @Column({
    field: 'notes',
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @Column({
    field: 'status',
    type: DataType.STRING,
    defaultValue: 'DRAFT', // сервис нормализует в метки БД (pending, approved и т.п.)
  })
  status!: string;

  @Column({
    field: 'test_type',
    type: DataType.STRING,
    defaultValue: 'routine',
  })
  test_type!: string;

  @Column({
    field: 'signal_received_time',
    type: DataType.STRING,
    allowNull: true,
  })
  signal_received_time?: string;

  @Column({
    field: 'signal_coordinates',
    type: DataType.STRING,
    allowNull: true,
  })
  signal_coordinates?: string;

  @Column({
    field: 'signal_strength',
    type: DataType.STRING,
    allowNull: true,
  })
  signal_strength?: string;

  @Column({
    field: 'vessel_id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  vessel_id?: number;

  @Column({
    field: 'signal_id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  signal_id?: number;

  @Column({
    field: 'confirmation_sent_at',
    type: DataType.STRING,
    allowNull: true,
  })
  confirmation_sent_at?: string;

  @CreatedAt
  @Column({
    field: 'created_at',
    type: DataType.DATE,
  })
  created_at!: Date;

  @UpdatedAt
  @Column({
    field: 'updated_at',
    type: DataType.DATE,
  })
  updated_at!: Date;
}

// ВОССТАНАВЛИВАЕМ default‑экспорт (его ожидают импорты по всему проекту)
export default SSASRequest;
