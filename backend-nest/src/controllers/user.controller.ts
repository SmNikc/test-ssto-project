// backend-nest/src/controllers/user.controller.ts
import { Body, Controller, Get, Param, Post, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { UserService } from '../user/user.service';
import User from '../models/user.model';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User | null> {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() dto: Partial<User>): Promise<User> {
    return this.userService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<User>,
  ): Promise<[number, User[]]> {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ deleted: number }> {
    return this.userService.remove(id).then((deleted) => ({ deleted }));
  }
}
