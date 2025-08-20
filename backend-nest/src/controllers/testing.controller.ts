
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { TestingService } from '../testing/testing.service';

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
  create(@Body() dto: Record<string, unknown>) {
    return this.testingService.create(dto as any);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.testingService.update(id, dto as any);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testingService.remove(id);
  }
}
