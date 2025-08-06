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
  }
}
# Продолжаю ленту по всем нужным файлам, если ещё остались невалидные или мусорные — сообщайте!
# ДАЛЕЕ
