import { Module } from '@nestjs/common';
import { ImapService } from './imap.service';
import { NotificationModule } from '../notification/notification.module';
import { SignalModule } from '../signal/signal.module';

@Module({
  imports: [NotificationModule, SignalModule],
  providers: [ImapService],
})
export class ImapModule {}
