<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';

=======
CopyEdit
import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
@Module({
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
