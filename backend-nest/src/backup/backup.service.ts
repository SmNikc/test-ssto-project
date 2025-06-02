import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  async createBackup(): Promise<void> {
    const backupDir = process.env.BACKUP_DIR || '/opt/test-ssto/backups';
    const date = new Date().toISOString().split('T')[0];
    const dbBackupPath = `${backupDir}/db_backup_${date}.sql`;
    const configBackupPath = `${backupDir}/config_backup_${date}.tar.gz`;

    try {
      // Бэкап базы данных
      await execAsync(`pg_dump -U user -h localhost test_ssto > ${dbBackupPath}`);

      // Бэкап конфигурации
      await execAsync(`tar -czf ${configBackupPath} /opt/test-ssto/backend-nest/.env`);

      console.log(`Бэкап успешно создан: ${dbBackupPath}, ${configBackupPath}`);
    } catch (error) {
      console.error('Ошибка при создании бэкапа:', error);
      throw new Error('Не удалось создать бэкап');
    }
  }

  async restoreBackup(dbBackupPath: string, configBackupPath: string): Promise<void> {
    try {
      // Остановить backend
      await execAsync('docker-compose stop backend');

      // Восстановить базу данных
      await execAsync(`psql -U user -h localhost test_ssto < ${dbBackupPath}`);

      // Восстановить конфигурацию
      await execAsync(`tar -xzf ${configBackupPath} -C /opt/test-ssto/backend-nest/`);

      // Запустить backend
      await execAsync('docker-compose start backend');

      console.log('Восстановление успешно завершено');
    } catch (error) {
      console.error('Ошибка при восстановлении бэкапа:', error);
      throw new Error('Не удалось восстановить бэкап');
    }
  }

  async listBackups(): Promise<string[]> {
    const backupDir = process.env.BACKUP_DIR || '/opt/test-ssto/backups';
    return fs.readdirSync(backupDir);
  }
}
