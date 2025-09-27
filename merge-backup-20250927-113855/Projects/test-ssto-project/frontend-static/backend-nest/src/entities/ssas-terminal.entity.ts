import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';

@Table({
  tableName: 'ssas_terminals',
  timestamps: true
})
export class SSASTerminal extends Model {
  @Column({
    type: DataType.STRING(50),
    primaryKey: true,
    allowNull: false
  })
  terminal_number: string;

  @Column({
    type: DataType.ENUM('INMARSAT', 'IRIDIUM'),
    defaultValue: 'INMARSAT'
  })
  terminal_type: 'INMARSAT' | 'IRIDIUM';

  @Column({
    type: DataType.STRING(9)
  })
  current_mmsi: string;

  @Column({
    type: DataType.STRING(100)
  })
  current_vessel_name: string;

  @Column({
    type: DataType.STRING(7)
  })
  current_imo: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true
  })
  is_active: boolean;

  @Column({
    type: DataType.DATE
  })
  last_test_date: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  total_tests_count: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  successful_tests_count: number;
}
