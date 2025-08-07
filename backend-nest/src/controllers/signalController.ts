import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SignalService } from '../signal/signal.service';
@Controller('signals')
export class SignalController {
  constructor(private readonly signalService: SignalService) {}
  @Post()
  async create(@Body() data: any) {
    return this.signalService.createSignal(data);
  }
  @Get()
  async getByType(
    @Query('type') type: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.signalService.getSignalsByType(type, new Date(start), new Date(end));
  }
}
