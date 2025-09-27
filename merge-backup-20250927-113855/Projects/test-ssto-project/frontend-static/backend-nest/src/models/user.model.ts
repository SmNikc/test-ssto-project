import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'users', timestamps: false })
export default class User extends Model {
  @Column({ type: DataType.STRING, allowNull: false, primaryKey: true })
  user_id!: string;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.ENUM('shipowner', 'operator', 'admin', 'tester'), allowNull: false })
  role!: 'shipowner' | 'operator' | 'admin' | 'tester';

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at?: Date;
}

export { default as User } from "./user.model";

