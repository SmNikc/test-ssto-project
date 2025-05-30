import { Controller, Get, Query, Res } from '@nestjs/common';
import { ReportService } from './report.service';
import { Response } from 'express';
import * as fs from 'fs';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('daily')
  async getDailyReport(
    @Query('date') date: string,
    @Query('format') format: 'pdf' | 'excel',
    @Res() res: Response,
  ) {
    if (!date || !format || !['pdf', 'excel'].includes(format)) {
      throw new Error('Invalid date or format');
    }

    const reportPath = await this.reportService.generateDailyReport(date, format);
    const fileStream = fs.createReadStream(reportPath);

    res.set({
      'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="daily_report_${date}.${format}"`,
    });

    fileStream.pipe(res);
  }
}
