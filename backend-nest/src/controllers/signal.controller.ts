// backend-nest/src/controllers/signal.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  HttpException,
  HttpStatus 
} from '@nestjs/common';
import { SignalService } from '../services/signal.service';

@Controller('signals')
export class SignalController {
  constructor(private readonly signalService: SignalService) {}

  @Get()
  async getSignals(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      return await this.signalService.getAll({
        status,
        type,
        startDate,
        endDate,
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch signals',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('statistics')
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      return await this.signalService.getStatistics(startDate, endDate);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getSignalById(@Param('id') id: string) {
    try {
      const signal = await this.signalService.findById(parseInt(id));
      if (!signal) {
        throw new HttpException('Signal not found', HttpStatus.NOT_FOUND);
      }
      return signal;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch signal',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createSignal(@Body() signalData: any) {
    try {
      return await this.signalService.create(signalData);
    } catch (error) {
      throw new HttpException(
        'Failed to create signal',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async updateSignal(
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    try {
      const updated = await this.signalService.update(parseInt(id), updateData);
      if (!updated) {
        throw new HttpException('Signal not found', HttpStatus.NOT_FOUND);
      }
      return updated;
    } catch (error) {
      throw new HttpException(
        'Failed to update signal',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async deleteSignal(@Param('id') id: string) {
    try {
      const deleted = await this.signalService.delete(parseInt(id));
      if (!deleted) {
        throw new HttpException('Signal not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Signal deleted successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to delete signal',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/link/:requestId')
  async linkToRequest(
    @Param('id') signalId: string,
    @Param('requestId') requestId: string,
  ) {
    try {
      return await this.signalService.linkToRequest(
        parseInt(signalId),
        parseInt(requestId),
      );
    } catch (error) {
      throw new HttpException(
        'Failed to link signal to request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('generate-report/:id')
  async generateReport(@Param('id') id: string) {
    try {
      return await this.signalService.generateReport(parseInt(id));
    } catch (error) {
      throw new HttpException(
        'Failed to generate report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}