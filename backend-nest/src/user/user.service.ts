
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import User from '../models/user.model';

@Injectable()
export class UserService {
  constructor(@InjectModel(User) private readonly model: typeof User) {}

  findAll(): Promise<User[]> {
    return this.model.findAll();
  }

  findOne(id: number): Promise<User | null> {
    return this.model.findByPk(id);
  }

  create(dto: Partial<User>): Promise<User> {
    return this.model.create(dto as any);
  }

  remove(id: number): Promise<number> {
    return this.model.destroy({ where: { id } });
  }
}
