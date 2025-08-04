<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { IntegrationService } from './integration.service';

=======
CopyEdit
import { Module } from '@nestjs/common';
import { IntegrationService } from './integration.service';
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
@Module({
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
