import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import User from '../models/user.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) 
    private readonly userModel: typeof User
  ) {}

  findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  findOne(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }
  
  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    
    return this.userModel.findOne({
      where: { email }
    });
  }
  
  async create(userData: Partial<User>): Promise<User> {
    return this.userModel.create(userData as any);
  }
  
  async update(id: number, userData: Partial<User>): Promise<[number, User[]]> {
    return this.userModel.update(userData, {
      where: { id },
      returning: true
    });
  }
  
  async remove(id: number): Promise<number> {
    return this.userModel.destroy({
      where: { id }
    });
  }
}