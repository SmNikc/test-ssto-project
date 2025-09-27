 #!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix_status_update.py - Добавление правильной логики обновления статусов
"""

from pathlib import Path

PROJECT_PATH = Path("C:/Projects/test-ssto-project/backend-nest")
SRC_PATH = PROJECT_PATH / "src"

# Правильная реализация сервиса с контролем статусов
REQUEST_SERVICE_CONTENT = '''import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import SSASRequest from '../models/request';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

// Enum статусов
export enum RequestStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Разрешенные переходы статусов
const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.DRAFT]: [RequestStatus.PENDING, RequestStatus.CANCELLED],
  [RequestStatus.PENDING]: [RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED],
  [RequestStatus.IN_PROGRESS]: [RequestStatus.COMPLETED, RequestStatus.CANCELLED],
  [RequestStatus.COMPLETED]: [], // Финальный статус
  [RequestStatus.CANCELLED]: [], // Финальный статус
};

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(SSASRequest)
    private requestModel: typeof SSASRequest,
    private sequelize: Sequelize,
  ) {}

  async findAll(): Promise<SSASRequest[]> {
    return await this.requestModel.findAll({
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string | number): Promise<SSASRequest> {
    const request = await this.requestModel.findByPk(id);
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }
    return request;
  }

  async create(data: any): Promise<SSASRequest> {
    // Установка начального статуса
    const requestData = {
      ...data,
      status: RequestStatus.DRAFT,
      request_id: `REQ-${Date.now()}`,
    };
    return await this.requestModel.create(requestData);
  }

  async updateStatus(id: number | string, newStatus: string): Promise<SSASRequest> {
    // Валидация нового статуса
    if (!Object.values(RequestStatus).includes(newStatus as RequestStatus)) {
      throw new BadRequestException(`Invalid status: ${newStatus}`);
    }

    // Используем транзакцию для предотвращения race conditions
    return await this.sequelize.transaction(async (t) => {
      // Блокировка записи для обновления (SELECT FOR UPDATE)
      const request = await this.requestModel.findByPk(id, {
        lock: true,
        transaction: t,
      });

      if (!request) {
        throw new NotFoundException(`Request with ID ${id} not found`);
      }

      const currentStatus = request.status as RequestStatus;
      const targetStatus = newStatus as RequestStatus;

      // Проверка разрешенного перехода
      const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
      if (!allowedTransitions.includes(targetStatus)) {
        throw new ForbiddenException(
          `Transition from ${currentStatus} to ${targetStatus} is not allowed`
        );
      }

      // Обновление статуса
      request.status = targetStatus;
      await request.save({ transaction: t });

      // Логирование изменения статуса (опционально)
      console.log(`Request ${id}: ${currentStatus} -> ${targetStatus}`);

      return request;
    });
  }

  async findByStatus(status: string): Promise<SSASRequest[]> {
    if (!Object.values(RequestStatus).includes(status as RequestStatus)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    return await this.requestModel.findAll({
      where: { status },
      order: [['created_at', 'DESC']],
    });
  }

  async delete(id: number | string): Promise<void> {
    const request = await this.findOne(id);
    
    // Можно удалять только черновики и отмененные
    if (![RequestStatus.DRAFT, RequestStatus.CANCELLED].includes(request.status as RequestStatus)) {
      throw new ForbiddenException(
        `Cannot delete request with status ${request.status}`
      );
    }

    await request.destroy();
  }
}'''

# Правильная реализация контроллера с корректными HTTP статусами
REQUEST_CONTROLLER_CONTENT = '''import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  HttpException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { RequestService, RequestStatus } from '../services/request.service';

@Controller('requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: any) {
    try {
      const request = await this.requestService.create(createDto);
      return {
        success: true,
        data: request,
        message: 'Request created successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create request');
    }
  }

  @Get()
  async findAll(@Query('status') status?: string) {
    try {
      const requests = status
        ? await this.requestService.findByStatus(status)
        : await this.requestService.findAll();
      
      return {
        success: true,
        data: requests,
        count: requests.length,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch requests');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const request = await this.requestService.findOne(id);
      return {
        success: true,
        data: request,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch request');
    }
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    // Валидация входных данных
    if (!status) {
      throw new BadRequestException('Status is required');
    }

    try {
      const updatedRequest = await this.requestService.updateStatus(id, status);
      return {
        success: true,
        data: updatedRequest,
        message: `