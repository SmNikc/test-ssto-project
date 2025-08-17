import { Body, Controller, Get, Param, Post, Put, Delete, Patch } from '@nestjs/common';
import { SignalService } from '../signal/signal.service';

@Controller('signals')
export class SignalController {
  constructor(private readonly signalService: SignalService) {}

  @Post()
  create(@Body() dto: any) {
    return this.signalService.create(dto);
  }

  @Get()
  findAll() {
    return this.signalService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.signalService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.signalService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.signalService.remove(+id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.signalService.updateStatus(+id, body.status);
  }

  @Patch(':id/link-request/:requestId')
  linkToRequest(@Param('id') id: string, @Param('requestId') requestId: string) {
    return this.signalService.linkToRequest(+id, requestId);
  }
}
