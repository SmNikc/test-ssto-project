<<<<<<< HEAD
import { Controller, Post, Body, Get, Param, Patch, Query } from '@nestjs/common';
import { SignalService } from '../signal/signal.service';

@Controller('signals')
export class SignalController {
  constructor(private readonly signalService: SignalService) {}

  @Post()
  async createSignal(@Body() signalData: any) {
    const signal = await this.signalService.createSignal(signalData);
    return { signal_id: signal.signal_id, status: signal.status };
  }

  @Get('mmsi/:mmsi')
  async getSignalByMMSI(@Param('mmsi') mmsi: string) {
    const signal = await this.signalService.findSignalByMMSI(mmsi);
    if (!signal) {
      throw new Error('Signal not found');
    }
    return signal;
  }

  @Patch(':signalId/status')
  async updateSignalStatus(
    @Param('signalId') signalId: string,
    @Body('status') status: string,
    @Body('comments') comments?: string,
  ) {
    await this.signalService.updateSignalStatus(signalId, status, comments);
    return { message: 'Signal status updated' };
  }

  @Get('type/:signalType')
  async getSignalsByType(
    @Param('signalType') signalType: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const signals = await this.signalService.getSignalsByType(
      signalType,
      new Date(startDate),
      new Date(endDate),
    );
    return signals;
=======
CopyEdit
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SignalService } from '../signal/signal.service';
@Controller('signals')
export class SignalController {
  constructor(private readonly signalService: SignalService) {}
  @Post()
#   async create(@Body() data: any) {
    return this.signalService.createSignal(data);
  }
  @Get()
  async getByType(
    @Query('type') type: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.signalService.getSignalsByType(type, new Date(start), new Date(end));
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
  }
}
