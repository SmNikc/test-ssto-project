// src/controllers/signal.controller.ts
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { SignalService } from '../signal/signal.service';
import { EmailService } from '../signal/email.service';
import { AuthGuard } from '../security/auth.guard';

@Controller('signals')
@UseGuards(AuthGuard)
export class SignalController {
  constructor(
    private readonly signalService: SignalService,
    private readonly emailService: EmailService
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.signalService.findAll();
  }

  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.signalService.getSignalStatistics(start, end);
  }

  @Get('by-request/:requestId')
  @HttpCode(HttpStatus.OK)
  getSignalsByRequestId(@Param('requestId') requestId: string) {
    return this.signalService.getSignalsByRequestId(requestId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.signalService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSignalDto: any) {
    return this.signalService.create(createSignalDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateSignalDto: any
  ) {
    return this.signalService.update(id, updateSignalDto);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id', ParseIntPipe) id: number, 
    @Body('status') status: string
  ) {
    return this.signalService.updateStatus(id, status);
  }

  @Patch(':id/link-request/:requestId')
  @HttpCode(HttpStatus.OK)
  linkToRequest(
    @Param('id', ParseIntPipe) id: number,
    @Param('requestId') requestId: string,
  ) {
    return this.signalService.linkToRequest(id, parseInt(requestId));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.signalService.remove(id);
  }

  @Post('process-email')
  @HttpCode(HttpStatus.CREATED)
  async processEmail(@Body() processEmailDto: any) {
    return this.signalService.processEmailSignal(
      processEmailDto.subject,
      processEmailDto.body,
      new Date(processEmailDto.received_at || processEmailDto.receivedDate || new Date()),
      processEmailDto.emailId || processEmailDto.message_id || `email-${Date.now()}`
    );
  }

  @Post('check-emails')
  @HttpCode(HttpStatus.OK)
  async checkEmails() {
    const result = await this.emailService.checkEmailsManually();
    return { 
      message: 'Email check completed', 
      ...result 
    };
  }
}