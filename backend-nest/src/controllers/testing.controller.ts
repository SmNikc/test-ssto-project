<<<<<<< HEAD
import { Controller, Post, Body, Patch, Get, Param, Query } from '@nestjs/common';
import { TestingService } from '../testing/testing.service';

@Controller('testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Post('scenarios')
  async createScenario(@Body() scenarioData: any) {
    const scenario = await this.testingService.createScenario({
      ...scenarioData,
      scenario_id: `SCN-${Date.now()}`,
    });
    return { scenario_id: scenario.scenario_id, status: scenario.status };
  }

  @Patch('scenarios/:scenarioId')
  async updateScenario(@Param('scenarioId') scenarioId: string, @Body() updateData: any) {
    await this.testingService.updateScenario(scenarioId, updateData);
    return { message: 'Сценарий обновлен' };
  }

  @Get('scenarios')
  async getScenariosByPeriod(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const scenarios = await this.testingService.getScenariosByPeriod(
      new Date(startDate),
      new Date(endDate),
    );
    return scenarios;
=======
CopyEdit
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
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
  }
}
