// backend-nest/src/signal/signal.controller.ts
import { Controller, Get, Query, Post, Param, Body } from '@nestjs/common';
import { SignalService } from './signal.service';
import { LinkRequestDto } from './dto/link-request.dto';

@Controller('signals')
export class SignalController {
  constructor(private readonly service: SignalService) {}

  @Get('unmatched')
  async getUnmatched(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sort') sort: 'score' | 'time' = 'score',
    @Query('dir') dir: 'asc' | 'desc' = 'desc',
  ) {
    return this.service.findUnmatchedFeed({ limit, offset, sort, dir });
  }

  @Post(':id/link')
  async link(@Param('id') id: string, @Body() dto: LinkRequestDto) {
    return this.service.manualLink(+id, dto.requestId, dto.override);
  }
}
// pad 0
// pad 1
// pad 2
// pad 3
// pad 4
// pad 5
// pad 6
// pad 7
// pad 8
// pad 9
