<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { HealthController } from '../controllers/health.controller';

@Module({ controllers: [HealthController] })
=======
CopyEdit
import { Module } from '@nestjs/common';
import { HealthController } from '../controllers/health.controller';
@Module({
  controllers: [HealthController],
})
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
export class HealthModule {}
