import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }
}

12) Исправляем импорты контроллеров в модулях
