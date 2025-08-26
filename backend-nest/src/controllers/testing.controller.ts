import { Controller, Get, Param, Post, Body, Patch, Delete } from '@nestjs/common';
import { TestingService } from '../testing/testing.service';
import { ScenarioPayload } from '../validators/testingScenario.validator';

@Controller('testing-scenarios')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Get()
  findAll() {
    return this.testingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testingService.findOne(id);
  }

  @Post()
  create(@Body() dto: ScenarioPayload) {
    return this.testingService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<ScenarioPayload>) {
    return this.testingService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testingService.remove(id);
  }
}
