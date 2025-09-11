// src/controllers/vessel.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { VesselService } from '../services/vessel.service';
import { CreateVesselDto } from '../dto/create-vessel.dto';
import { UpdateVesselDto } from '../dto/update-vessel.dto';

@Controller('api/vessels')
export class VesselController {
  constructor(private readonly vesselService: VesselService) {}

  // Создание нового судна
  @Post()
  async create(@Body() createVesselDto: CreateVesselDto) {
    try {
      const vessel = await this.vesselService.create(createVesselDto);
      return {
        success: true,
        data: vessel,
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

  // Получение всех судов с пагинацией
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    const result = await this.vesselService.findAll(pageNum, limitNum, search);
    return {
      success: true,
      ...result,
    };
  }

  // Получение судна по ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const vessel = await this.vesselService.findOne(+id);
    if (!vessel) {
      throw new HttpException(
        {
          success: false,
          message: `Судно с ID ${id} не найдено`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      success: true,
      data: vessel,
    };
  }

  // Обновление судна
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVesselDto: UpdateVesselDto,
  ) {
    try {
      const vessel = await this.vesselService.update(+id, updateVesselDto);
      if (!vessel) {
        throw new HttpException(
          {
            success: false,
            message: `Судно с ID ${id} не найдено`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: vessel,
        message: 'Судно успешно обновлено',
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

  // Удаление судна
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.vesselService.remove(+id);
      return {
        success: true,
        message: `Судно с ID ${id} успешно удалено`,
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

  // Поиск судна по IMO
  @Get('imo/:imo')
  async findByImo(@Param('imo') imo: string) {
    const vessel = await this.vesselService.findByImo(imo);
    if (!vessel) {
      throw new HttpException(
        {
          success: false,
          message: `Судно с IMO ${imo} не найдено`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      success: true,
      data: vessel,
    };
  }

  // Поиск судна по MMSI
  @Get('mmsi/:mmsi')
  async findByMmsi(@Param('mmsi') mmsi: string) {
    const vessel = await this.vesselService.findByMmsi(mmsi);
    if (!vessel) {
      throw new HttpException(
        {
          success: false,
          message: `Судно с MMSI ${mmsi} не найдено`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      success: true,
      data: vessel,
    };
  }

  // Обновление позиции судна
  @Put(':id/position')
  async updatePosition(
    @Param('id') id: string,
    @Body() positionData: {
      latitude: number;
      longitude: number;
      speed?: number;
      course?: number;
    },
  ) {
    try {
      const vessel = await this.vesselService.updatePosition(+id, positionData);
      if (!vessel) {
        throw new HttpException(
          {
            success: false,
            message: `Судно с ID ${id} не найдено`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: vessel,
        message: 'Позиция судна обновлена',
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
}