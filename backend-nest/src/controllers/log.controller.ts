import { Controller, Post, Body, Get, Query, Delete } from '@nestjs/common';
import { LogService } from '../log/log.service';

@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post()
  async createLog(@Body('event') event: string, @Body('details') details?: string) {
    const log = await this.logService.createLog(event, details);
    return { log_id: log.log_id, event: log.event };
  }

  @Get()
  async getLogsByPeriod(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const logs = await this.logService.getLogsByPeriod(
      new Date(startDate),
      new Date(endDate),
    );
    return logs;
  }

  @Delete('old')
  async deleteOldLogs(@Query('days') days: string) {
    await this.logService.deleteOldLogs(parseInt(days, 10));
    return { message: 'Старые логи удалены' };
  }
}
