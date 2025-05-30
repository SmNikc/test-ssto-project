import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import User from '../models/user.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async createUser(data: any): Promise<User> {
    return this.userModel.create(data);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    await this.userModel.update({ role }, { where: { user_id: userId } });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.userModel.destroy({ where: { user_id: userId } });
  }
}
