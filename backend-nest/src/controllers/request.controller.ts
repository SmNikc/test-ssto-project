import { Controller, Get } from '@nestjs/common';

@Controller('api/requests')
export class RequestController {
  @Get()
  findAll() {
    return { message: 'Requests endpoint' };
  }
}
