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
    return []; // Реализуйте фильтрацию, если нужно
  }
}
