// backend-nest/src/controllers/log.controller.ts
import { Body, Controller, Get, Param, Post, Delete, ParseIntPipe } from '@nestjs/common';
import { LogService } from '../log/log.service';
import Log from '../models/log.model';

@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get()
  findAll(): Promise<Log[]> {
    return this.logService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Log | null> {
    return this.logService.findOne(id);
  }

  @Post()
  create(@Body() dto: Partial<Log>): Promise<Log> {
    return this.logService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ deleted: number }> {
    return this.logService.remove(id).then((deleted) => ({ deleted }));
  }
}
