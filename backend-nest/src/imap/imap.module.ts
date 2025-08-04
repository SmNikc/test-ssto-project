<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { ImapService } from './imap.service';
import { NotificationModule } from '../notification/notification.module';
import { SignalModule } from '../signal/signal.module';

@Module({
  imports: [NotificationModule, SignalModule],
  providers: [ImapService],
=======
CopyEdit
import { Module } from '@nestjs/common';
import { ImapService } from './imap.service';
@Module({
  providers: [ImapService],
  exports: [ImapService],
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
})
export class ImapModule {}
