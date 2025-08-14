import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { TestingService } from '../testing/testing.service';

@Controller('testing-scenarios')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Post()
  create(@Body() dto: any) {
    return this.testingService.create(dto);
  }

  @Get()
  findAll() {
    return this.testingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testingService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.testingService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testingService.remove(id);
  }
}

9) LogService — корректный импорт default
