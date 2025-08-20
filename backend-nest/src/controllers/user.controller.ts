
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UserService } from '../user/user.service';
import User from '../models/user.model';

@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User | null> {
    return this.service.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: Partial<User>): Promise<User> {
    return this.service.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
