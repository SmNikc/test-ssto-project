import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'confirmation_documents',
  timestamps: true
})
export default class ConfirmationDocument extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  signal_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  request_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  test_request_id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false
  })
  document_number: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'draft'
  })
  status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  html_content: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  pdf_content: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  pdf_path: string;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  sent_at: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  sent_to: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  sent_by: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  recipient_email: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  auto_send_enabled: boolean;
}
