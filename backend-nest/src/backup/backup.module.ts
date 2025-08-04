<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';

@Module({
  providers: [BackupService],
  controllers: [BackupController],
  exports: [BackupService],
=======
CopyEdit
import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
@Module({
  providers: [BackupService],
  controllers: [BackupController],
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
})
export class BackupModule {}
