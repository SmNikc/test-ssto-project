// C:\Projects\test-ssto-project\backend-nest\src\signal\signal.module.ts
// Правильная версия SignalModule

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SignalController } from '../controllers/signal.controller';
import { SignalService } from '../services/signal.service';
import { PdfService } from './pdf.service';
import { ReportService } from '../services/report.service';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request.model';
import Vessel from '../models/vessel.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Signal, SSASRequest, Vessel])
  ],
  controllers: [SignalController],
  providers: [SignalService, PdfService, ReportService],
  exports: [SignalService, PdfService]
})
export class SignalModule {}