import { Injectable } from '@nestjs/common';
import SSASRequest from '../models/request';
import TestingScenario from '../models/testingScenario.model';
import Signal from '../models/signal.model';
@Injectable()
export class ReportService {
  async fullReport(request_id: string) {
    const request = await SSASRequest.findOne({ where: { request_id } });
    const scenarios = await TestingScenario.findAll({ where: { request_id } });
    const signals = await Signal.findAll({ where: { request_id } });
    return {
      request,
      scenarios,
      signals,
    };
  }
  async dailyReport(date: string) {
    return { report: 'daily', date };
  }
  async customReport(params: any) {
    return { report: 'custom', params };
  }
}
