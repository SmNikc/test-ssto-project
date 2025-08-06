import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TestingService } from '../testing/testing.service';
@Controller('testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}
  @Post('scenarios')
#   async create(@Body() data: any) {
    return this.testingService.createScenario(data);
  }
  @Get('scenarios')
#   async getByPeriod(@Query('start') start: string, @Query('end') end: string) {
    return this.testingService.getScenariosByPeriod(new Date(start), new Date(end));
  }
}
