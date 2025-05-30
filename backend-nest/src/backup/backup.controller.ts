import { Controller, Post, Get, Query } from '@nestjs/common';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  async createBackup() {
    await this.backupService.createBackup();
    return { message: 'Бэкап успешно создан', timestamp: new Date().toISOString() };
  }

  @Post('restore')
  async restoreBackup(
    @Query('dbBackupPath') dbBackupPath: string,
    @Query('configBackupPath') configBackupPath: string,
  ) {
    await this.backupService.restoreBackup(dbBackupPath, configBackupPath);
    return { message: 'Бэкап успешно восстановлен', timestamp: new Date().toISOString() };
  }

  @Get('list')
  async listBackups() {
    const backups = await this.backupService.listBackups();
    return { backups };
  }
}
