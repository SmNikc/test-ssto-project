import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}
  @Get('daily')
  getDaily(@Query('date') date: string) {
    return this.reportService.dailyReport(date);
  }
  @Get('custom')
  getCustom(@Query() params: any) {
    return this.reportService.customReport(params);
  }
}
