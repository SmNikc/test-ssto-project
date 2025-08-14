import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SignalService } from '../signal/signal.service';
import { AuthGuard } from '../security/auth.guard';

@UseGuards(AuthGuard)
@Controller('signals')
export class SignalController {
  constructor(private readonly service: SignalService) {}

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
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() patch: any) {
    return this.service.update(id, patch);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') next: string) {
    return this.service.updateStatus(id, next);
  }

  @Patch(':id/link-request/:requestId')
  linkRequest(@Param('id') id: string, @Param('requestId') requestId: string) {
    return this.service.linkToRequest(id, Number(requestId));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { ok: true };
  }
}

7) TestingService — стандартный CRUD, строковый scenario_id
