import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import TestingScenario from '../models/testingScenario.model';
import { TestingController } from '../controllers/testing.controller';
import { TestingService } from './testing.service';

@Module({
  imports: [
    SequelizeModule.forFeature([TestingScenario]),
  ],
  controllers: [TestingController],
  providers: [TestingService],
})
export class TestingModule {}
