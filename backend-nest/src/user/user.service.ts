<<<<<<< HEAD
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import User from '../models/user.model';

=======
CopyEdit
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import User from '../models/user.model';
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}
<<<<<<< HEAD

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
=======
  async createUser(data: any): Promise<any> {
    return this.userModel.create(data);
  }
#   async findUserByEmail(email: string): Promise<any | null> {
    return this.userModel.findOne({ where: { email } });
  }
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
}
