import { Controller, Get } from '@nestjs/common';

@Controller('api/reports')
export class ReportController {
  @Get()
  findAll() {
    return { message: 'Reports endpoint' };
  }
}
