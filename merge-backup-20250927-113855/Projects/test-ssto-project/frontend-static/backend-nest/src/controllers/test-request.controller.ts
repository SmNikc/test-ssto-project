// src/controllers/test-request.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { TestRequestService } from '../services/test-request.service';
import { ConfirmationService } from '../services/confirmation.service';
import { CreateTestRequestDto } from '../dto/create-test-request.dto';

@Controller('api/requests')
export class TestRequestController {
  constructor(
    private readonly testRequestService: TestRequestService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  // Создание новой заявки
  @Post()
  async create(@Body() createTestRequestDto: CreateTestRequestDto) {
    try {
      const request = await this.testRequestService.create(createTestRequestDto);
      return {
        success: true,
        data: request,
        message: 'Заявка успешно создана',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Получение всех заявок
  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    const result = await this.testRequestService.findAll(
      pageNum,
      limitNum,
      status,
    );
    return {
      success: true,
      ...result,
    };
  }

  // Получение заявки по ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const request = await this.testRequestService.findOne(+id);
    if (!request) {
      throw new HttpException(
        {
          success: false,
          message: `Заявка #${id} не найдена`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      success: true,
      data: request,
    };
  }

  // Одобрение заявки
  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    try {
      const request = await this.testRequestService.updateStatus(
        +id,
        'approved',
      );
      return {
        success: true,
        data: request,
        message: `Заявка #${id} одобрена`,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Отклонение заявки
  @Put(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    try {
      const request = await this.testRequestService.updateStatus(
        +id,
        'rejected',
        reason,
      );
      return {
        success: true,
        data: request,
        message: `Заявка #${id} отклонена`,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Отправка подтверждения для конкретной заявки
  @Post(':id/send-confirmation')
  async sendConfirmation(@Param('id') id: string) {
    try {
      const result = await this.confirmationService.sendConfirmation(+id);
      return result;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Массовая отправка подтверждений
  @Post('send-all-confirmations')
  async sendAllConfirmations() {
    try {
      const result = await this.confirmationService.sendAllConfirmations();
      return result;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

// Отдельный контроллер для глобального эндпоинта массовой отправки
@Controller('api')
export class MassConfirmationController {
  constructor(
    private readonly confirmationService: ConfirmationService,
  ) {}

  @Post('send-all-confirmations')
  async sendAllConfirmations() {
    try {
      const result = await this.confirmationService.sendAllConfirmations();
      return result;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}