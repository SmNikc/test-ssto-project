CopyEdit
import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
@Module({
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
# Если найдутся ещё проблемные или мусорные файлы — выгружаю следующими!
# ДАЛЕЕ
