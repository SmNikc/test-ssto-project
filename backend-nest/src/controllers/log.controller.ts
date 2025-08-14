import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { LogService } from '../log/log.service';

@Controller('logs')
export class LogController {
  constructor(private readonly service: LogService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}

11) UserService / UserController — корректные импорты
