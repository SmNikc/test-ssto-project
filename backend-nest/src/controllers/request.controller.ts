
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RequestService } from '../request/request.service';

@Controller('requests')
export class RequestController {
  constructor(private readonly service: RequestService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: Record<string, unknown>) {
    return this.service.create(dto as any);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
