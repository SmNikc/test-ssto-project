import { Controller, Get, Param, Post, Body, Delete, ParseIntPipe } from '@nestjs/common';
import { LogService } from '../log/log.service';

@Controller('logs')
export class LogController {
  constructor(private readonly service: LogService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
