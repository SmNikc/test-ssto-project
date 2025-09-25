// backend-nest/src/app.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Заявки
  @Get('requests')
  getRequests() {
    return this.appService.getRequests();
  }

  @Post('requests')
  createRequest(@Body() data: any) {
    return this.appService.createRequest(data);
  }

  @Put('requests/:id')
  updateRequest(@Param('id') id: string, @Body() data: any) {
    return this.appService.updateRequest(id, data);
  }

  @Delete('requests/:id')
  deleteRequest(@Param('id') id: string) {
    return this.appService.deleteRequest(id);
  }

  // Сигналы
  @Get('signals')
  getSignals() {
    return this.appService.getSignals();
  }

  @Get('signals/statistics')
  getSignalStatistics() {
    return this.appService.getSignalStatistics();
  }

  @Post('signals')
  createSignal(@Body() data: any) {
    return this.appService.createSignal(data);
  }

  @Put('signals/:id')
  updateSignal(@Param('id') id: string, @Body() data: any) {
    return this.appService.updateSignal(id, data);
  }

  @Delete('signals/:id')
  deleteSignal(@Param('id') id: string) {
    return this.appService.deleteSignal(id);
  }

  // Терминалы
  @Get('terminals')
  getTerminals() {
    return this.appService.getTerminals();
  }

  @Post('terminals')
  createTerminal(@Body() data: any) {
    return this.appService.createTerminal(data);
  }

  @Put('terminals/:id')
  updateTerminal(@Param('id') id: string, @Body() data: any) {
    return this.appService.updateTerminal(id, data);
  }

  @Delete('terminals/:id')
  deleteTerminal(@Param('id') id: string) {
    return this.appService.deleteTerminal(id);
  }

  // Тестирование
  @Post('testing/simulate')
  simulateTest(@Body() data: any) {
    return this.appService.simulateTest(data);
  }

  // Отчеты
  @Get('reports')
  getReports() {
    return this.appService.getReports();
  }

  @Post('reports/generate/:id')
  generateReport(@Param('id') id: string) {
    return this.appService.generateReport(id);
  }
}