import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TestingScenario } from '../models/testingScenario';
import { TestingController } from '../controllers/testingController';
import { TestingService } from './testing.service';

@Module({
  imports: [
    SequelizeModule.forFeature([TestingScenario]),
  ],
  controllers: [TestingController],
  providers: [TestingService],
})
export class TestingModule {}
