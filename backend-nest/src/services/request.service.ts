// C:\Projects\test-ssto-project\backend-nest\src\services\request.service.ts
// Сервис для работы с заявками

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Request } from '../models/request.model';
import { SSASRequest } from '../models/request';
import { Op } from 'sequelize';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(SSASRequest)
    private requestModel: typeof SSASRequest,
  ) {}

  // Создание новой заявки
  async create(data: any): Promise<Request> {
    return await this.requestModel.create(data);
  }

  // Получение всех заявок
  async findAll(): Promise<Request[]> {
    return await this.requestModel.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  // Получение заявки по ID
  async findOne(id: number): Promise<Request> {
    return await this.requestModel.findByPk(id);
  }

  // Поиск заявок по MMSI и временному окну
  async findByMMSIAndTime(mmsi: string, time: Date): Promise<Request[]> {
    const minTime = new Date(time.getTime() - 2 * 60 * 60 * 1000); // -2 часа
    const maxTime = new Date(time.getTime() + 2 * 60 * 60 * 1000); // +2 часа

    return await this.requestModel.findAll({
      where: {
        mmsi: mmsi,
        test_datetime: {
          [Op.between]: [minTime, maxTime],
        },
        status: 'pending',
      },
    });
  }

  // Обновление заявки
  async update(id: number, data: any): Promise<[number, Request[]]> {
    return await this.requestModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // Обновление статуса заявки
  async updateStatus(id: number, status: string): Promise<void> {
    await this.requestModel.update(
      { status },
      { where: { id } }
    );
  }

  // Удаление заявки
  async remove(id: number): Promise<void> {
    await this.requestModel.destroy({
      where: { id },
    });
  }

  // Получение заявок со статусом pending
  async findPending(): Promise<Request[]> {
    return await this.requestModel.findAll({
      where: { status: 'pending' },
      order: [['test_datetime', 'ASC']],
    });
  }
}