import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { RequestService } from '../request/request.service';

@Controller('requests')
export class RequestController {
  constructor(private readonly service: RequestService) {}

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() patch: any) {
    return this.service.update(Number(id), patch);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}

5) SignalService — строковый PK signal_id, привязка request_id
