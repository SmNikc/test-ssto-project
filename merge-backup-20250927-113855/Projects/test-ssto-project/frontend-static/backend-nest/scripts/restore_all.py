#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
restore_all.py - Полное восстановление всех испорченных файлов
Сохранить в: C:\Projects\test-ssto-project\backend-nest\scripts\
Запуск: python scripts\restore_all.py
"""

import shutil
from pathlib import Path

PROJECT_PATH = Path("C:/Projects/test-ssto-project/backend-nest")
SRC_PATH = PROJECT_PATH / "src"

# Правильные версии всех файлов
FILES_TO_RESTORE = {
    "models/request.model.ts": '''import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum RequestStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum RequestType {
  TEST_406 = 'test_406',
  TEST_121 = 'test_121',
  COMBINED = 'combined'
}

@Entity('requests')
export class Request {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vessel_name' })
  vesselName: string;

  @Column({ name: 'vessel_imo', nullable: true })
  vesselIMO: string;

  @Column({ name: 'vessel_type', nullable: true })
  vesselType: string;

  @Column({ name: 'vessel_flag', nullable: true })
  vesselFlag: string;

  @Column({ name: 'requester_name' })
  requesterName: string;

  @Column({ name: 'requester_email' })
  requesterEmail: string;

  @Column({ name: 'requester_phone', nullable: true })
  requesterPhone: string;

  @Column({ name: 'requester_company', nullable: true })
  requesterCompany: string;

  @Column({
    type: 'enum',
    enum: RequestType,
    default: RequestType.COMBINED
  })
  testType: RequestType;

  @Column({ type: 'date', name: 'test_date' })
  testDate: Date;

  @Column({ type: 'time', name: 'test_time', nullable: true })
  testTime: string;

  @Column({ name: 'test_location', nullable: true })
  testLocation: string;

  @Column({ name: 'test_coordinator', nullable: true })
  testCoordinator: string;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.DRAFT
  })
  status: RequestStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'report_url', nullable: true })
  reportUrl: string;

  @Column({ name: 'beacon_id', nullable: true })
  beaconId: string;

  @Column({ name: 'beacon_manufacturer', nullable: true })
  beaconManufacturer: string;

  @Column({ name: 'beacon_model', nullable: true })
  beaconModel: string;

  @Column({ name: 'last_email_check', type: 'timestamp', nullable: true })
  lastEmailCheck: Date;

  @Column({ name: 'email_count', default: 0 })
  emailCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}''',

    "models/signal.model.ts": '''import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Request } from './request.model';

export enum SignalFrequency {
  F_406_MHZ = '406',
  F_121_5_MHZ = '121.5',
  BOTH = 'both'
}

export enum SignalStatus {
  RECEIVED = 'received',
  PROCESSED = 'processed',
  CONFIRMED = 'confirmed',
  FALSE_ALARM = 'false_alarm'
}

@Entity('signals')
export class Signal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'request_id', nullable: true })
  requestId: number;

  @ManyToOne(() => Request, { nullable: true })
  @JoinColumn({ name: 'request_id' })
  request: Request;

  @Column({ name: 'beacon_hex_id' })
  beaconHexId: string;

  @Column({
    type: 'enum',
    enum: SignalFrequency,
    default: SignalFrequency.F_406_MHZ
  })
  frequency: SignalFrequency;

  @Column({ name: 'detection_time', type: 'timestamp' })
  detectionTime: Date;

  @Column({ name: 'email_subject' })
  emailSubject: string;

  @Column({ name: 'email_body', type: 'text' })
  emailBody: string;

  @Column({ name: 'email_from' })
  emailFrom: string;

  @Column({ name: 'email_received_at', type: 'timestamp' })
  emailReceivedAt: Date;

  @Column({ name: 'email_message_id', nullable: true })
  emailMessageId: string;

  @Column({ nullable: true })
  latitude: string;

  @Column({ nullable: true })
  longitude: string;

  @Column({ name: 'satellite_name', nullable: true })
  satelliteName: string;

  @Column({ name: 'lut_name', nullable: true })
  lutName: string;

  @Column({ name: 'country_code', nullable: true })
  countryCode: string;

  @Column({ name: 'beacon_type', nullable: true })
  beaconType: string;

  @Column({ name: 'mmsi', nullable: true })
  mmsi: string;

  @Column({ name: 'call_sign', nullable: true })
  callSign: string;

  @Column({ name: 'serial_number', nullable: true })
  serialNumber: string;

  @Column({
    type: 'enum',
    enum: SignalStatus,
    default: SignalStatus.RECEIVED
  })
  status: SignalStatus;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ name: 'processed_by', nullable: true })
  processedBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}''',

    "app.module.ts": '''import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SstoModule } from './ssto.module';

// Import models for TypeORM
import { Request } from './models/request.model';
import { Signal } from './models/signal.model';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'ssto_test'),
        entities: [Request, Signal],
        synchronize: configService.get('NODE_ENV', 'development') === 'development',
        logging: configService.get('NODE_ENV', 'development') === 'development',
        autoLoadEntities: true,
        retryAttempts: 3,
        retryDelay: 3000,
        extra: {
          max: 10,
          connectionTimeoutMillis: 2000,
        }
      }),
    }),
    
    // Feature modules
    SstoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}''',

    "main.ts": '''import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();'''
}

def main():
    print("=== Полное восстановление файлов Day 2 ===\n")
    
    # 1. Удаляем лишние папки
    folders_to_delete = ['report', 'signal']
    for folder in folders_to_delete:
        folder_path = SRC_PATH / folder
        if folder_path.exists():
            shutil.rmtree(folder_path)
            print(f"🗑️ Удалена папка {folder}")
    
    # 2. Восстанавливаем все файлы
    for file_path, content in FILES_TO_RESTORE.items():
        full_path = SRC_PATH / file_path
        
        # Создаем папку если нет
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Бэкап если файл существует
        if full_path.exists():
            backup = full_path.with_suffix('.ts.old')
            shutil.copy2(full_path, backup)
            print(f"📄 Бэкап: {backup.name}")
        
        # Записываем правильную версию
        full_path.write_text(content, encoding='utf-8')
        print(f"✅ Восстановлен: {file_path}")
    
    print("\n✨ Все файлы восстановлены!")
    print("\nТеперь запустите сервер:")
    print("cd C:\\Projects\\test-ssto-project\\backend-nest")
    print("npm run start:dev")

if __name__ == "__main__":
    main()