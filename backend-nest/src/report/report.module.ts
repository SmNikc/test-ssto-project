import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { SignalModule } from '../signal/signal.module';

@Module({
  imports: [SignalModule],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
