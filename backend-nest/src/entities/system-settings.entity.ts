import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'system_settings',
  timestamps: true
})
export class SystemSettings extends Model {
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: 'Режим автоматической отправки подтверждений без участия дежурного'
  })
  auto_confirmation_enabled: boolean;

  @Column({
    type: DataType.DATE,
    comment: 'Время последнего изменения настройки автоподтверждения'
  })
  auto_confirmation_updated_at: Date;

  @Column({
    type: DataType.STRING,
    comment: 'ID пользователя, изменившего настройку'
  })
  auto_confirmation_updated_by: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
    comment: 'Дополнительные настройки системы'
  })
  additional_settings: any;
}
