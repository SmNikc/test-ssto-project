<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { SignalModule } from '../signal/signal.module';

@Module({
  imports: [SignalModule],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
=======
CopyEdit
import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
@Module({
  controllers: [ReportController],
  providers: [ReportService],
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
})
export class ReportModule {}
