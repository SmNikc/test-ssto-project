// backend-nest/src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import User from '../models/user.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  findOne(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  create(data: Partial<User>): Promise<User> {
    return this.userModel.create(data as any);
  }

  update(id: number, data: Partial<User>): Promise<[number, User[]]> {
    return this.userModel.update(data, { where: { id }, returning: true });
  }

  remove(id: number): Promise<number> {
    return this.userModel.destroy({ where: { id } });
  }
}
