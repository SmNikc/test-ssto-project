
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SignalService } from '../signal/signal.service';
import { AuthGuard } from '../security/auth.guard';

@Controller('signals')
@UseGuards(AuthGuard)
export class SignalController {
  constructor(private readonly service: SignalService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Record<string, unknown>) {
    return this.service.create(dto as any);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() patch: Record<string, unknown>) {
    return this.service.update(id, patch as any);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') next: string) {
    return this.service.updateStatus(id, next);
  }

  @Patch(':id/link-request/:requestId')
  linkToRequest(@Param('id') id: string, @Param('requestId') requestId: string) {
    return this.service.linkToRequest(id, Number(requestId));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { ok: true };
  }
}
