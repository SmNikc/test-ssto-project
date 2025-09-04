// backend-nest/src/controllers/requests.controller.ts
// Простой контроллер для обработки запросов от frontend

import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import SSASRequest from '../models/request.model';

@Controller('requests') // Путь: /requests (без /api)
export class RequestsController {
  constructor(
    @InjectModel(SSASRequest)
    private requestModel: typeof SSASRequest,
  ) {}

  // GET /requests
  @Get()
  async findAll() {
    try {
      const requests = await this.requestModel.findAll({
        order: [['createdAt', 'DESC']]
      });
      return requests || [];
    } catch (error) {
      console.error('Error fetching requests:', error);
      return [];
    }
  }

  // GET /requests/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.requestModel.findByPk(id);
  }

  // POST /requests
  @Post()
  async create(@Body() createRequestDto: any) {
    try {
      // Преобразуем поля из frontend формата в backend формат
      const requestData = {
        vessel_name: createRequestDto.vessel_name || createRequestDto.vesselName,
        mmsi: createRequestDto.mmsi,
        imo: createRequestDto.imo,
        terminal_id: createRequestDto.terminal_id || createRequestDto.terminalId,
        contact_person: createRequestDto.contact_person || createRequestDto.contactPerson,
        contact_email: createRequestDto.contact_email || createRequestDto.contactEmail,
        contact_phone: createRequestDto.contact_phone || createRequestDto.contactPhone,
        test_date: createRequestDto.test_date || createRequestDto.testDate || new Date(),
        status: createRequestDto.status || 'pending',
        source: createRequestDto.source || 'web'
      };

      const newRequest = await this.requestModel.create(requestData);
      return newRequest;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  // PUT /requests/:id
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateRequestDto: any) {
    await this.requestModel.update(updateRequestDto, {
      where: { request_id: id }
    });
    return this.requestModel.findByPk(id);
  }

  // DELETE /requests/:id
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const request = await this.requestModel.findByPk(id);
    if (request) {
      await request.destroy();
      return { success: true };
    }
    return { success: false, message: 'Request not found' };
  }
}