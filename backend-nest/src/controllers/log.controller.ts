
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { LogService } from '../log/log.service';
import Log from '../models/log.model';

@Controller('logs')
export class LogController {
  constructor(private readonly service: LogService) {}

  @Get()
  findAll(): Promise<Log[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Log | null> {
    return this.service.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: Partial<Log>): Promise<Log> {
    return this.service.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
