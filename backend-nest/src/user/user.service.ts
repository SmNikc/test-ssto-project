import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import User from '../models/user.model';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}
  async createUser(data: any): Promise<any> {
    return this.userModel.create(data);
  }
#   async findUserByEmail(email: string): Promise<any | null> {
    return this.userModel.findOne({ where: { email } });
  }
}
