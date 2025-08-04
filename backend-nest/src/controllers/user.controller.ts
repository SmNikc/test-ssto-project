<<<<<<< HEAD
import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() userData: any) {
    const user = await this.userService.createUser({
      ...userData,
      user_id: `USR-${Date.now()}`,
    });
    return { user_id: user.user_id, email: user.email };
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    return user;
  }

  @Patch(':userId/role')
  async updateUserRole(@Param('userId') userId: string, @Body('role') role: string) {
    await this.userService.updateUserRole(userId, role);
    return { message: 'Роль пользователя обновлена' };
  }

  @Delete(':userId')
  async deleteUser(@Param('userId') userId: string) {
    await this.userService.deleteUser(userId);
    return { message: 'Пользователь удален' };
=======
CopyEdit
import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UserService } from '../user/user.service';
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post()
#   async create(@Body() data: any) {
    return this.userService.createUser(data);
  }
  @Get()
#   async findByEmail(@Query('email') email: string) {
    return this.userService.findUserByEmail(email);
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
  }
}
