CopyEdit
import { Injectable } from '@nestjs/common';
@Injectable()
export class BackupService {
  async createBackup() {
    return { status: 'backup created', timestamp: new Date().toISOString() };
  }
}
