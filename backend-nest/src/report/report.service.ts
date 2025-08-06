import { Injectable } from '@nestjs/common';
@Injectable()
export class ReportService {
  async dailyReport(date: string) {
    return { report: 'daily', date };
  }
  async customReport(params: any) {
    return { report: 'custom', params };
  }
}
