<<<<<<< HEAD
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth() {
=======
CopyEdit
import { Controller, Get } from '@nestjs/common';
@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
