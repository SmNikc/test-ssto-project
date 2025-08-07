import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { LogService } from '../log/log.service';
@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}
  @Post()
  async create(@Body() data: { event: string; details?: string }) {
    return this.logService.createLog(data.event, data.details);
  }
  @Get('period')
  async byPeriod(@Query('start') start: string, @Query('end') end: string) {
    return this.logService.getLogsByPeriod(new Date(start), new Date(end));
  }
}
