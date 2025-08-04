<<<<<<< HEAD
import { Controller, Post, Body, Get, Param, Patch, Query } from '@nestjs/common';
import { RequestService } from '../request/request.service';

@Controller('requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  async createRequest(@Body() requestData: any) {
    const request = await this.requestService.createRequest({
      ...requestData,
      request_id: `REQ-${Date.now()}`,
    });
    return { request_id: request.request_id, status: request.status };
  }

  @Get(':requestId')
  async getRequestById(@Param('requestId') requestId: string) {
    const request = await this.requestService.findRequestById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }
    return request;
  }

  @Patch(':requestId/status')
  async updateRequestStatus(
    @Param('requestId') requestId: string,
    @Body('status') status: string,
  ) {
    await this.requestService.updateRequestStatus(requestId, status);
    return { message: 'Request status updated' };
  }

  @Get('period')
  async getRequestsByPeriod(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const requests = await this.requestService.getRequestsByPeriod(
      new Date(startDate),
      new Date(endDate),
    );
    return requests;
  }
}
=======
CopyEdit
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RequestService } from '../request/request.service';
@Controller('requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}
  @Post()
#   async create(@Body() data: any) {
    return this.requestService.createRequest(data);
  }
  @Get(':id')
#   async findOne(@Param('id') id: string) {
    return this.requestService.findRequestById(id);
  }
  @Get()
  async findAll() {
#     // Можно реализовать параметры фильтрации
    return []; // Заглушка, реализовать как нужно
  }
}
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
