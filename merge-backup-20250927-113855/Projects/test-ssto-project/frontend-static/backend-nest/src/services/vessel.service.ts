// src/services/vessel.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import Vessel from '../models/vessel.model';
import { CreateVesselDto } from '../dto/create-vessel.dto';
import { UpdateVesselDto } from '../dto/update-vessel.dto';

@Injectable()
export class VesselService {
  constructor(
    @InjectModel(Vessel)
    private vesselModel: typeof Vessel,
  ) {}

  // Создание нового судна
  async create(createVesselDto: CreateVesselDto): Promise<Vessel> {
    return await this.vesselModel.create(createVesselDto as any);
  }

  // Получение всех судов с пагинацией и поиском
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const offset = (page - 1) * limit;
    
    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { imo_number: { [Op.iLike]: `%${search}%` } },
            { call_sign: { [Op.iLike]: `%${search}%` } },
            { mmsi: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    const { count: total, rows: vessels } = await this.vesselModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [['created_at', 'DESC']],
    });

    return {
      data: vessels,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Получение судна по ID
  async findOne(id: number): Promise<Vessel> {
    const vessel = await this.vesselModel.findByPk(id, {
      include: ['testRequests'],
    });
    
    if (!vessel) {
      throw new NotFoundException(`Судно с ID ${id} не найдено`);
    }
    
    return vessel;
  }

  // Обновление судна
  async update(id: number, updateVesselDto: UpdateVesselDto): Promise<Vessel> {
    const vessel = await this.findOne(id);
    
    // Если обновляются координаты, обновляем и время последней позиции
    if (updateVesselDto.latitude !== undefined || updateVesselDto.longitude !== undefined) {
      updateVesselDto.last_position_time = new Date();
    }

    await vessel.update(updateVesselDto);
    return vessel;
  }

  // Удаление судна
  async remove(id: number): Promise<void> {
    const vessel = await this.findOne(id);
    await vessel.destroy();
  }

  // Поиск по IMO
  async findByImo(imo: string): Promise<Vessel> {
    const vessel = await this.vesselModel.findOne({
      where: { imo_number: imo },
    });
    
    if (!vessel) {
      throw new NotFoundException(`Судно с IMO ${imo} не найдено`);
    }
    
    return vessel;
  }

  // Поиск по MMSI
  async findByMmsi(mmsi: string): Promise<Vessel> {
    const vessel = await this.vesselModel.findOne({
      where: { mmsi },
    });
    
    if (!vessel) {
      throw new NotFoundException(`Судно с MMSI ${mmsi} не найдено`);
    }
    
    return vessel;
  }

  // Обновление позиции судна
  async updatePosition(
    id: number,
    positionData: {
      latitude: number;
      longitude: number;
      speed?: number;
      course?: number;
    },
  ): Promise<Vessel> {
    const vessel = await this.findOne(id);
    
    await vessel.update({
      ...positionData,
      last_position_time: new Date(),
    });
    
    return vessel;
  }
}