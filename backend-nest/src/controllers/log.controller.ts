<<<<<<< HEAD
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
=======
CopyEdit
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { LogService } from '../log/log.service';
@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}
  @Post()
#   async create(@Body() data: { event: string; details?: string }) {
    return this.logService.createLog(data.event, data.details);
  }
  @Get('period')
#   async byPeriod(@Query('start') start: string, @Query('end') end: string) {
    return this.logService.getLogsByPeriod(new Date(start), new Date(end));
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
  }
}
