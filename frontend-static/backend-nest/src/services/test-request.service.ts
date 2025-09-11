// src/services/test-request.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import TestRequest from '../models/test-request.model';
import Vessel from '../models/vessel.model';
import { CreateTestRequestDto } from '../dto/create-test-request.dto';

@Injectable()
export class TestRequestService {
  constructor(
    @InjectModel(TestRequest)
    private testRequestModel: typeof TestRequest,
  ) {}

  // Создание новой заявки
  async create(createTestRequestDto: CreateTestRequestDto): Promise<TestRequest> {
    return await this.testRequestModel.create({
      ...createTestRequestDto,
      test_date: new Date(createTestRequestDto.test_date),
    } as any);
  }

  // Получение всех заявок с пагинацией и фильтрацией
  async findAll(page: number = 1, limit: number = 10, status?: string) {
    const offset = (page - 1) * limit;
    
    const where = status ? { status } : {};

    const { count: total, rows: requests } = await this.testRequestModel.findAndCountAll({
      where,
      include: [Vessel],
      offset,
      limit,
      order: [['created_at', 'DESC']],
    });

    return {
      data: requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Получение заявки по ID
  async findOne(id: number): Promise<TestRequest> {
    const request = await this.testRequestModel.findByPk(id, {
      include: [Vessel],
    });
    
    if (!request) {
      throw new NotFoundException(`Заявка #${id} не найдена`);
    }
    
    return request;
  }

  // Обновление статуса заявки
  async updateStatus(
    id: number,
    status: 'approved' | 'rejected' | 'completed',
    rejectionReason?: string,
  ): Promise<TestRequest> {
    const request = await this.findOne(id);
    
    const updateData: any = { status };
    
    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }
    
    await request.update(updateData);
    return request;
  }

  // Получение заявок по судну
  async findByVessel(vesselId: number): Promise<TestRequest[]> {
    return await this.testRequestModel.findAll({
      where: { vessel_id: vesselId },
      include: [Vessel],
      order: [['created_at', 'DESC']],
    });
  }

  // Получение заявок, ожидающих подтверждения
  async findPendingConfirmations(): Promise<TestRequest[]> {
    return await this.testRequestModel.findAll({
      where: {
        status: 'approved',
        confirmation_sent: false,
      },
      include: [Vessel],
    });
  }
}