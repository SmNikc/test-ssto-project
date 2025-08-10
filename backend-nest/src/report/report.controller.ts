import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}
  @Get('full')
  async full(@Query('request_id') request_id: string) {
    return this.reportService.fullReport(request_id);
  }
  @Get('daily')
  getDaily(@Query('date') date: string) {
    return this.reportService.dailyReport(date);
  }
  @Get('custom')
  getCustom(@Query() params: any) {
    return this.reportService.customReport(params);
  }
}
