#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
adapt_day2_to_sequelize.py - Адаптация файлов Day 2 под Sequelize
Сохранить в: C:\Projects\test-ssto-project\backend-nest\scripts\
Запуск: python scripts\adapt_day2_to_sequelize.py
"""

import shutil
from pathlib import Path

PROJECT_PATH = Path("C:/Projects/test-ssto-project/backend-nest")
SRC_PATH = PROJECT_PATH / "src"

def main():
    print("=== Адаптация Day 2 под Sequelize ===\n")
    
    # 1. Переименуем старые TypeORM модели в .old
    old_request_model = SRC_PATH / "models" / "request.model.ts"
    old_signal_model = SRC_PATH / "models" / "signal.model.ts"
    
    if old_request_model.exists():
        backup = old_request_model.with_suffix('.ts.typeorm')
        shutil.move(str(old_request_model), str(backup))
        print(f"📄 Сохранен бэкап: {backup.name}")
    
    if old_signal_model.exists():
        backup = old_signal_model.with_suffix('.ts.typeorm')
        shutil.move(str(old_signal_model), str(backup))
        print(f"📄 Сохранен бэкап: {backup.name}")
    
    # 2. Создаем модель Request для Sequelize (если нет request.ts)
    request_sequelize = SRC_PATH / "models" / "request.ts"
    if not request_sequelize.exists():
        print("⚠️  models/request.ts уже существует, пропускаем")
    
    # 3. Создаем модель Signal для Sequelize
    signal_model_content = '''import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { SSASRequest } from './request';

@Table({ tableName: 'signals' })
export class Signal extends Model {
  @Column({ type: DataType.STRING, allowNull: false, primaryKey: true })
  id: string;

  @ForeignKey(() => SSASRequest)
  @Column({ type: DataType.STRING, allowNull: true })
  request_id: string;

  @Column({ type: DataType.STRING(15), allowNull: false })
  beacon_hex_id: string;

  @Column({ 
    type: DataType.ENUM('406', '121.5', 'both'),
    defaultValue: '406'
  })
  frequency: string;

  @Column({ type: DataType.DATE, allowNull: false })
  detection_time: Date;

  @Column({ type: DataType.STRING(255), allowNull: false })
  email_subject: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  email_body: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  email_from: string;

  @Column({ type: DataType.DATE, allowNull: false })
  email_received_at: Date;

  @Column({ type: DataType.STRING(255), allowNull: true })
  email_message_id: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  latitude: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  longitude: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  satellite_name: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  lut_name: string;

  @Column({ type: DataType.STRING(10), allowNull: true })
  country_code: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  beacon_type: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  mmsi: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  call_sign: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  serial_number: string;

  @Column({
    type: DataType.ENUM('received', 'processed', 'confirmed', 'false_alarm'),
    defaultValue: 'received'
  })
  status: string;

  @Column({ type: DataType.DATE, allowNull: true })
  processed_at: Date;

  @Column({ type: DataType.STRING(100), allowNull: true })
  processed_by: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @Column({ type: DataType.JSON, allowNull: true })
  metadata: any;

  @BelongsTo(() => SSASRequest)
  request: SSASRequest;
}'''
    
    signal_path = SRC_PATH / "models" / "signal.model.ts"
    signal_path.write_text(signal_model_content, encoding='utf-8')
    print("✅ Создан signal.model.ts для Sequelize")
    
    # 4. Обновляем app.module.ts для Sequelize
    app_module_content = '''import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import models
import { SSASRequest } from './models/request';
import { Signal } from './models/signal.model';
import { User } from './models/user.model';
import { Log } from './models/log.model';
import { TestingScenario } from './models/testingScenario.model';

// Import modules
import { RequestModule } from './request/request.module';
import { UserModule } from './user/user.module';
import { LogModule } from './log/log.module';
import { TestingModule } from './testing/testing.module';
import { SstoModule } from './ssto.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database - Sequelize
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'ssto_test'),
        models: [SSASRequest, Signal, User, Log, TestingScenario],
        autoLoadModels: true,
        synchronize: configService.get('NODE_ENV', 'development') === 'development',
        logging: configService.get('NODE_ENV', 'development') === 'development' ? console.log : false,
      }),
    }),
    
    // Feature modules
    RequestModule,
    UserModule,
    LogModule,
    TestingModule,
    SstoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}'''
    
    app_module = SRC_PATH / "app.module.ts"
    if app_module.exists():
        backup = app_module.with_suffix('.ts.backup')
        shutil.copy2(app_module, backup)
        print(f"📄 Бэкап app.module.ts -> {backup.name}")
    
    app_module.write_text(app_module_content, encoding='utf-8')
    print("✅ Обновлен app.module.ts для Sequelize")
    
    # 5. Обновляем ssto.module.ts для Sequelize
    ssto_module_content = '''import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';

// Models
import { SSASRequest } from './models/request';
import { Signal } from './models/signal.model';

// Services
import { RequestService } from './services/request.service';
import { EmailService } from './services/email.service';

// Controllers
import { RequestController } from './controllers/request.controller';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([SSASRequest, Signal]),
  ],
  controllers: [RequestController],
  providers: [RequestService, EmailService],
  exports: [RequestService, EmailService],
})
export class SstoModule {}'''
    
    ssto_module = SRC_PATH / "ssto.module.ts"
    ssto_module.write_text(ssto_module_content, encoding='utf-8')
    print("✅ Обновлен ssto.module.ts для Sequelize")
    
    # 6. Обновляем email.service.ts для Sequelize
    email_service_content = '''import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Signal } from '../models/signal.model';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(Signal)
    private signalModel: typeof Signal,
  ) {}

  async checkEmails(): Promise<Signal[]> {
    this.logger.log('Checking emails (stub implementation)');
    // Упрощенная реализация для MVP
    return [];
  }

  async sendTestEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`Test email would be sent to: ${to}`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log(`Body preview: ${body.substring(0, 100)}...`);
  }

  async testConnection(): Promise<boolean> {
    this.logger.log('Email connection test (stub)');
    return true;
  }

  private extractBeaconId(text: string): string {
    const hexPattern = /\\b[A-F0-9]{15}\\b/i;
    const match = text.match(hexPattern);
    return match ? match[0].toUpperCase() : 'UNKNOWN';
  }

  private detectFrequency(text: string): string {
    const text_lower = text.toLowerCase();
    
    if (text_lower.includes('406') && text_lower.includes('121')) {
      return 'both';
    } else if (text_lower.includes('406')) {
      return '406';
    } else if (text_lower.includes('121')) {
      return '121.5';
    }
    
    return '406';
  }
}'''
    
    email_service = SRC_PATH / "services" / "email.service.ts"
    email_service.write_text(email_service_content, encoding='utf-8')
    print("✅ Обновлен email.service.ts для Sequelize")
    
    # 7. Удаляем TypeORM зависимости из package.json (информируем пользователя)
    print("\n📦 Теперь можно удалить TypeORM пакеты:")
    print("npm uninstall @nestjs/typeorm typeorm")
    print("\n✅ Или оставить их, если планируете миграцию в будущем")
    
    print("\n✨ Адаптация завершена!")
    print("\n🎯 Следующие шаги:")
    print("1. Проверьте, что все модели правильные")
    print("2. Запустите: npm run start:dev")
    print("3. Протестируйте API: node test-api.js")

if __name__ == "__main__":
    main()