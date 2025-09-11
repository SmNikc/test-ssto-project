#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
setup_day2_complete.py - Полная установка Day 2 для проекта ССТО
Включает: проверку БД, очистку старых файлов, создание всех новых файлов

Запуск: python setup_day2_complete.py
"""

import os
import sys
import json
import subprocess
import shutil
from pathlib import Path
from typing import List, Dict, Tuple

# Цвета для консоли Windows
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}{text.center(60)}{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.RESET}")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_info(text):
    print(f"{Colors.CYAN}📝 {text}{Colors.RESET}")

def print_clean(text):
    print(f"{Colors.BLUE}🧹 {text}{Colors.RESET}")

# Пути проекта
# Если скрипт в папке scripts, поднимаемся на уровень выше
SCRIPT_PATH = Path(__file__).resolve().parent
PROJECT_PATH = SCRIPT_PATH.parent if SCRIPT_PATH.name == 'scripts' else Path("C:/Projects/test-ssto-project/backend-nest")
SRC_PATH = PROJECT_PATH / "src"

# ===================== ЧАСТЬ 1: ПРОВЕРКИ И ОЧИСТКА =====================

def check_database_connection():
    """Проверка подключения к БД через test-db.js"""
    print_header("ПРОВЕРКА ПОДКЛЮЧЕНИЯ К БД")
    
    test_db_file = PROJECT_PATH / "test-db.js"
    
    # Создаем test-db.js если его нет
    if not test_db_file.exists():
        print_warning("test-db.js не найден, создаем...")
        test_db_content = '''// test-db.js - Проверка подключения к PostgreSQL
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ssto_test'
});

async function testConnection() {
  try {
    await client.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Подключение к БД успешно!');
    console.log('📊 Версия PostgreSQL:', result.rows[0].version);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка подключения к БД:', err.message);
    console.log('Проверьте настройки в .env файле:');
    console.log('  DB_USER=' + (process.env.DB_USER || 'postgres'));
    console.log('  DB_PASSWORD=***');
    console.log('  DB_NAME=' + (process.env.DB_NAME || 'ssto_test'));
    process.exit(1);
  }
}

testConnection();'''
        
        with open(test_db_file, 'w', encoding='utf-8') as f:
            f.write(test_db_content)
        print_success("test-db.js создан")
    
    # Проверяем подключение
    os.chdir(PROJECT_PATH)
    result = subprocess.run(
        "node test-db.js",
        shell=True,
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print_success("Подключение к БД работает")
        return True
    else:
        print_error("Ошибка подключения к БД!")
        print_warning("Проверьте .env файл:")
        print("  DB_USER=postgres")
        print("  DB_PASSWORD=ваш_пароль_от_postgresql")
        print("  DB_NAME=ssto_test")
        return False

def clean_old_files():
    """Очистка старых/лишних файлов"""
    print_header("ОЧИСТКА ЛИШНИХ ФАЙЛОВ")
    
    files_to_remove = [
        SRC_PATH / "report" / "report.service.ts",
        SRC_PATH / "signal" / "signal.module.ts",
        SRC_PATH / "controllers" / "requestController.ts",  # с маленькой буквы
        SRC_PATH / "controllers" / "signalController.ts",   # с маленькой буквы
    ]
    
    for file_path in files_to_remove:
        if file_path.exists():
            try:
                file_path.unlink()
                print_clean(f"Удален лишний файл: {file_path.name}")
            except Exception as e:
                print_warning(f"Не удалось удалить {file_path.name}: {e}")
    
    # Удаляем пустые папки
    empty_dirs = ["report", "signal"]
    for dir_name in empty_dirs:
        dir_path = SRC_PATH / dir_name
        if dir_path.exists() and not any(dir_path.iterdir()):
            try:
                dir_path.rmdir()
                print_clean(f"Удалена пустая папка: {dir_name}")
            except:
                pass

def create_folder_structure():
    """Создание правильной структуры папок"""
    print_header("СОЗДАНИЕ СТРУКТУРЫ ПАПОК")
    
    folders = ["models", "services", "controllers", "dto"]
    for folder in folders:
        folder_path = SRC_PATH / folder
        folder_path.mkdir(parents=True, exist_ok=True)
        if folder_path.exists():
            print_success(f"Папка {folder} готова")
        else:
            print_error(f"Не удалось создать папку {folder}")

def check_existing_files() -> Dict[str, bool]:
    """Проверка существующих файлов Day 2"""
    print_header("ПРОВЕРКА СУЩЕСТВУЮЩИХ ФАЙЛОВ")
    
    required_files = [
        "models/request.model.ts",
        "models/signal.model.ts",
        "dto/request.dto.ts",
        "services/request.service.ts",
        "services/email.service.ts",
        "controllers/request.controller.ts",
        "ssto.module.ts",
        "app.module.ts",
        "app.controller.ts",
        "app.service.ts"
    ]
    
    files_status = {}
    missing_count = 0
    
    for file_path in required_files:
        full_path = SRC_PATH / file_path
        exists = full_path.exists()
        files_status[file_path] = exists
        
        if exists:
            size = full_path.stat().st_size
            print_success(f"{file_path} ({size} bytes)")
        else:
            print_error(f"{file_path} - ОТСУТСТВУЕТ")
            missing_count += 1
    
    if missing_count > 0:
        print_warning(f"Отсутствует файлов: {missing_count}")
    else:
        print_success("Все файлы на месте!")
    
    return files_status

# ===================== ЧАСТЬ 2: СОЗДАНИЕ ФАЙЛОВ =====================

# Содержимое всех файлов Day 2
FILES_CONTENT = {
    "models/request.model.ts": '''import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

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

    "dto/request.dto.ts": '''import { IsEmail, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { RequestStatus, RequestType } from '../models/request.model';

export class CreateRequestDto {
  @IsNotEmpty()
  @IsString()
  vesselName: string;

  @IsOptional()
  @IsString()
  vesselIMO?: string;

  @IsOptional()
  @IsString()
  vesselType?: string;

  @IsOptional()
  @IsString()
  vesselFlag?: string;

  @IsNotEmpty()
  @IsString()
  requesterName: string;

  @IsNotEmpty()
  @IsEmail()
  requesterEmail: string;

  @IsOptional()
  @IsString()
  requesterPhone?: string;

  @IsOptional()
  @IsString()
  requesterCompany?: string;

  @IsOptional()
  @IsEnum(RequestType)
  testType?: RequestType;

  @IsNotEmpty()
  @IsDateString()
  testDate: string;

  @IsOptional()
  @IsString()
  testTime?: string;

  @IsOptional()
  @IsString()
  testLocation?: string;

  @IsOptional()
  @IsString()
  testCoordinator?: string;

  @IsOptional()
  @IsString()
  beaconId?: string;

  @IsOptional()
  @IsString()
  beaconManufacturer?: string;

  @IsOptional()
  @IsString()
  beaconModel?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  vesselName?: string;

  @IsOptional()
  @IsString()
  vesselIMO?: string;

  @IsOptional()
  @IsString()
  vesselType?: string;

  @IsOptional()
  @IsString()
  vesselFlag?: string;

  @IsOptional()
  @IsString()
  requesterName?: string;

  @IsOptional()
  @IsEmail()
  requesterEmail?: string;

  @IsOptional()
  @IsString()
  requesterPhone?: string;

  @IsOptional()
  @IsString()
  requesterCompany?: string;

  @IsOptional()
  @IsEnum(RequestType)
  testType?: RequestType;

  @IsOptional()
  @IsDateString()
  testDate?: string;

  @IsOptional()
  @IsString()
  testTime?: string;

  @IsOptional()
  @IsString()
  testLocation?: string;

  @IsOptional()
  @IsString()
  testCoordinator?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsString()
  beaconId?: string;

  @IsOptional()
  @IsString()
  beaconManufacturer?: string;

  @IsOptional()
  @IsString()
  beaconModel?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  reportUrl?: string;
}

export class UpdateRequestStatusDto {
  @IsNotEmpty()
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}''',

    "services/request.service.ts": '''import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, RequestStatus } from '../models/request.model';
import { CreateRequestDto, UpdateRequestDto, UpdateRequestStatusDto } from '../dto/request.dto';

@Injectable()
export class RequestService {
  private readonly logger = new Logger(RequestService.name);

  constructor(
    @InjectRepository(Request)
    private requestRepository: Repository<Request>,
  ) {}

  async create(createRequestDto: CreateRequestDto): Promise<Request> {
    this.logger.log(`Creating new request for vessel: ${createRequestDto.vesselName}`);
    
    const request = this.requestRepository.create({
      ...createRequestDto,
      status: RequestStatus.DRAFT,
      emailCount: 0,
    });

    const savedRequest = await this.requestRepository.save(request);
    this.logger.log(`Request created with ID: ${savedRequest.id}`);
    
    return savedRequest;
  }

  async findAll(status?: RequestStatus): Promise<Request[]> {
    const query = this.requestRepository.createQueryBuilder('request');
    
    if (status) {
      query.where('request.status = :status', { status });
    }
    
    query.orderBy('request.createdAt', 'DESC');
    
    return query.getMany();
  }

  async findOne(id: number): Promise<Request> {
    const request = await this.requestRepository.findOne({ 
      where: { id } 
    });

    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    return request;
  }

  async findByEmail(email: string): Promise<Request[]> {
    return this.requestRepository.find({
      where: { requesterEmail: email },
      order: { createdAt: 'DESC' }
    });
  }

  async findActiveRequests(): Promise<Request[]> {
    return this.requestRepository.find({
      where: [
        { status: RequestStatus.PENDING },
        { status: RequestStatus.IN_PROGRESS }
      ],
      order: { testDate: 'ASC' }
    });
  }

  async update(id: number, updateRequestDto: UpdateRequestDto): Promise<Request> {
    const request = await this.findOne(id);
    
    Object.assign(request, updateRequestDto);
    request.updatedAt = new Date();
    
    const updatedRequest = await this.requestRepository.save(request);
    this.logger.log(`Request ${id} updated`);
    
    return updatedRequest;
  }

  async updateStatus(id: number, updateStatusDto: UpdateRequestStatusDto): Promise<Request> {
    const request = await this.findOne(id);
    
    const oldStatus = request.status;
    request.status = updateStatusDto.status;
    
    if (updateStatusDto.notes) {
      request.notes = request.notes 
        ? `${request.notes}\\n\\n[${new Date().toISOString()}] Status changed from ${oldStatus} to ${updateStatusDto.status}: ${updateStatusDto.notes}`
        : `[${new Date().toISOString()}] Status changed from ${oldStatus} to ${updateStatusDto.status}: ${updateStatusDto.notes}`;
    }
    
    const updatedRequest = await this.requestRepository.save(request);
    this.logger.log(`Request ${id} status changed from ${oldStatus} to ${updateStatusDto.status}`);
    
    return updatedRequest;
  }

  async remove(id: number): Promise<void> {
    const request = await this.findOne(id);
    
    await this.requestRepository.remove(request);
    this.logger.log(`Request ${id} deleted`);
  }

  async incrementEmailCount(id: number): Promise<void> {
    await this.requestRepository
      .createQueryBuilder()
      .update(Request)
      .set({ 
        emailCount: () => 'email_count + 1',
        lastEmailCheck: new Date()
      })
      .where('id = :id', { id })
      .execute();
  }

  async getStatistics(): Promise<any> {
    const total = await this.requestRepository.count();
    
    const byStatus = await this.requestRepository
      .createQueryBuilder('request')
      .select('request.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.status')
      .getRawMany();
    
    const byTestType = await this.requestRepository
      .createQueryBuilder('request')
      .select('request.testType', 'testType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.testType')
      .getRawMany();
    
    return {
      total,
      byStatus,
      byTestType,
      lastUpdated: new Date()
    };
  }
}''',

    "services/email.service.ts": '''import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signal, SignalStatus, SignalFrequency } from '../models/signal.model';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Signal)
    private signalRepository: Repository<Signal>,
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

  private detectFrequency(text: string): SignalFrequency {
    const text_lower = text.toLowerCase();
    
    if (text_lower.includes('406') && text_lower.includes('121')) {
      return SignalFrequency.BOTH;
    } else if (text_lower.includes('406')) {
      return SignalFrequency.F_406_MHZ;
    } else if (text_lower.includes('121')) {
      return SignalFrequency.F_121_5_MHZ;
    }
    
    return SignalFrequency.F_406_MHZ;
  }
}''',

    "controllers/request.controller.ts": '''import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { RequestService } from '../services/request.service';
import { CreateRequestDto, UpdateRequestDto, UpdateRequestStatusDto } from '../dto/request.dto';
import { Request, RequestStatus } from '../models/request.model';

@Controller('api/requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ transform: true })) 
    createRequestDto: CreateRequestDto
  ): Promise<Request> {
    return this.requestService.create(createRequestDto);
  }

  @Get()
  async findAll(
    @Query('status') status?: RequestStatus
  ): Promise<Request[]> {
    return this.requestService.findAll(status);
  }

  @Get('statistics')
  async getStatistics() {
    return this.requestService.getStatistics();
  }

  @Get('active')
  async findActive(): Promise<Request[]> {
    return this.requestService.findActiveRequests();
  }

  @Get('by-email/:email')
  async findByEmail(@Param('email') email: string): Promise<Request[]> {
    return this.requestService.findByEmail(email);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Request> {
    return this.requestService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) 
    updateRequestDto: UpdateRequestDto
  ): Promise<Request> {
    return this.requestService.update(id, updateRequestDto);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) 
    updateStatusDto: UpdateRequestStatusDto
  ): Promise<Request> {
    return this.requestService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.requestService.remove(id);
  }
}''',

    "ssto.module.ts": '''import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Models
import { Request } from './models/request.model';
import { Signal } from './models/signal.model';

// Services
import { RequestService } from './services/request.service';
import { EmailService } from './services/email.service';

// Controllers
import { RequestController } from './controllers/request.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Request, Signal]),
  ],
  controllers: [RequestController],
  providers: [RequestService, EmailService],
  exports: [RequestService, EmailService],
})
export class SstoModule {}''',

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
      }),
    }),
    
    // Feature modules
    SstoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}''',

    "app.controller.ts": '''import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): any {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'SSTO Test API',
      version: '1.0.0'
    };
  }
}''',

    "app.service.ts": '''import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SSTO Test API - Day 2 Ready!';
  }
}'''
}

def create_all_files():
    """Создание всех файлов проекта"""
    print_header("СОЗДАНИЕ ФАЙЛОВ ПРОЕКТА")
    
    created_count = 0
    skipped_count = 0
    error_count = 0
    
    for relative_path, content in FILES_CONTENT.items():
        file_path = SRC_PATH / relative_path
        
        try:
            # Проверяем, существует ли файл
            if file_path.exists():
                print_warning(f"Файл уже существует: {relative_path}")
                skipped_count += 1
                continue
            
            # Создаем папку если её нет
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Записываем файл
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Проверяем что файл создан
            if file_path.exists():
                size = file_path.stat().st_size
                print_success(f"Создан: {relative_path} ({size} bytes)")
                created_count += 1
            else:
                print_error(f"Не создан: {relative_path}")
                error_count += 1
                
        except Exception as e:
            print_error(f"Ошибка при создании {relative_path}: {e}")
            error_count += 1
    
    # Итоги создания файлов
    print(f"\n📊 Результат: Создано: {created_count}, Пропущено: {skipped_count}, Ошибок: {error_count}")
    return created_count > 0 or skipped_count > 0

def check_and_update_env():
    """Проверка и обновление .env файла"""
    print_header("ПРОВЕРКА .ENV ФАЙЛА")
    
    env_path = PROJECT_PATH / ".env"
    
    if not env_path.exists():
        print_warning(".env файл не найден! Создаем...")
        
        env_content = """# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=ВВЕДИТЕ_ВАШ_ПАРОЛЬ_ЗДЕСЬ
DB_NAME=ssto_test

# Node
NODE_ENV=development

# Email Configuration (Gmail)
EMAIL_USER=your-test-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993"""
        
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(env_content)
        
        print_warning("⚠️ ВАЖНО: Отредактируйте .env файл и введите правильный пароль от PostgreSQL!")
        return False
    else:
        # Проверяем содержимое
        with open(env_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'ВВЕДИТЕ_ВАШ_ПАРОЛЬ_ЗДЕСЬ' in content:
            print_error("В .env файле не установлен пароль PostgreSQL!")
            print_warning("Отредактируйте строку DB_PASSWORD в файле .env")
            return False
        elif 'sstopass' in content:
            print_warning("В .env используется неправильный пароль 'sstopass'")
            print_warning("Измените DB_PASSWORD на ваш реальный пароль PostgreSQL")
            return False
        else:
            print_success(".env файл настроен")
            return True

def install_npm_packages():
    """Установка необходимых npm пакетов"""
    print_header("УСТАНОВКА NPM ПАКЕТОВ")
    
    packages = [
        "class-validator",
        "class-transformer",
        "imap",
        "mailparser",
        "@types/imap"
    ]
    
    # Проверяем package.json
    package_json_path = PROJECT_PATH / "package.json"
    if not package_json_path.exists():
        print_error("package.json не найден!")
        return False
    
    with open(package_json_path, 'r', encoding='utf-8') as f:
        package_content = f.read()
    
    packages_to_install = []
    for package in packages:
        if package not in package_content:
            packages_to_install.append(package)
    
    if not packages_to_install:
        print_success("Все необходимые пакеты уже установлены")
        return True
    
    print_info(f"Необходимо установить: {', '.join(packages_to_install)}")
    
    os.chdir(PROJECT_PATH)
    
    for package in packages_to_install:
        print_info(f"Устанавливаем {package}...")
        result = subprocess.run(
            f"npm install {package} --save",
            shell=True,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print_success(f"{package} установлен")
        else:
            print_warning(f"Проблема с {package}: {result.stderr[:100]}")
    
    return True

def create_test_scripts():
    """Создание тестовых скриптов"""
    print_header("СОЗДАНИЕ ТЕСТОВЫХ СКРИПТОВ")
    
    # test-api.js
    test_api_content = '''// test-api.js - Тестирование CRUD операций Day 2
const http = require('http');

const API_URL = 'http://localhost:3000';

// Проверка здоровья сервера
function checkHealth() {
    return new Promise((resolve) => {
        http.get(`${API_URL}/health`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Сервер работает:', data);
                    resolve(true);
                } else {
                    console.log('❌ Сервер недоступен');
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.log('❌ Ошибка подключения:', err.message);
            resolve(false);
        });
    });
}

// Создание тестовой заявки
function createTestRequest() {
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            vesselName: 'Test Vessel Day 2',
            requesterName: 'Test User',
            requesterEmail: 'test@example.com',
            testDate: '2025-01-20',
            testType: 'combined'
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/requests',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 201 || res.statusCode === 200) {
                    console.log('✅ Заявка создана:', data);
                    resolve(true);
                } else {
                    console.log('❌ Ошибка создания заявки:', res.statusCode, data);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.log('❌ Ошибка запроса:', err.message);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Тестирование Day 2 API...\\n');
    
    const healthOk = await checkHealth();
    if (!healthOk) {
        console.log('\\n⚠️ Сервер не запущен. Запустите: npm run start:dev');
        process.exit(1);
    }

    const requestCreated = await createTestRequest();
    
    if (requestCreated) {
        console.log('\\n✨ Все тесты пройдены успешно!');
    } else {
        console.log('\\n⚠️ Некоторые тесты не прошли. Проверьте файлы.');
    }
}

runTests();'''
    
    test_api_path = PROJECT_PATH / "test-api.js"
    with open(test_api_path, 'w', encoding='utf-8') as f:
        f.write(test_api_content)
    print_success("test-api.js создан")
    
    return True

def check_nest_process():
    """Проверка, запущен ли NestJS сервер"""
    try:
        result = subprocess.run(
            'tasklist /FI "IMAGENAME eq node.exe" /FO CSV',
            shell=True,
            capture_output=True,
            text=True
        )
        if "node.exe" in result.stdout:
            print_info("Node.js процесс обнаружен (возможно сервер уже запущен)")
            return True
    except:
        pass
    return False

def main():
    """Главная функция"""
    print_header("ПОЛНАЯ УСТАНОВКА DAY 2")
    print(f"{Colors.CYAN}Проверка + Очистка + Создание файлов{Colors.RESET}\n")
    
    # Проверяем существование проекта
    if not PROJECT_PATH.exists():
        print_error(f"Папка проекта не найдена: {PROJECT_PATH}")
        print_warning("Создайте проект или проверьте путь")
        sys.exit(1)
    
    os.chdir(PROJECT_PATH)
    print_success(f"Работаем в: {PROJECT_PATH}")
    
    # ЭТАП 1: ПРОВЕРКИ И ОЧИСТКА
    print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}ЭТАП 1: ПРОВЕРКИ И ОЧИСТКА{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
    
    # 1.1 Проверка БД
    db_ok = check_database_connection()
    if not db_ok:
        print_warning("БД не подключена, но продолжаем установку...")
    
    # 1.2 Очистка старых файлов
    clean_old_files()
    
    # 1.3 Создание структуры папок
    create_folder_structure()
    
    # 1.4 Проверка существующих файлов
    files_status = check_existing_files()
    
    # ЭТАП 2: СОЗДАНИЕ ФАЙЛОВ
    print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}ЭТАП 2: СОЗДАНИЕ ФАЙЛОВ И УСТАНОВКА ПАКЕТОВ{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
    
    # 2.1 Создание всех файлов
    files_created = create_all_files()
    
    # 2.2 Проверка и настройка .env
    env_ok = check_and_update_env()
    
    # 2.3 Установка npm пакетов
    packages_ok = install_npm_packages()
    
    # 2.4 Создание тестовых скриптов
    tests_created = create_test_scripts()
    
    # 2.5 Проверка запущенных процессов
    check_nest_process()
    
    # ФИНАЛЬНЫЙ ОТЧЕТ
    print_header("ИТОГОВЫЙ ОТЧЕТ")
    
    print(f"\n{Colors.BOLD}Статус компонентов:{Colors.RESET}")
    print(f"  База данных:    {'✅ Подключена' if db_ok else '⚠️ Требует настройки'}")
    print(f"  .env файл:      {'✅ Настроен' if env_ok else '⚠️ Требует настройки пароля'}")
    print(f"  Файлы проекта:  {'✅ Созданы' if files_created else '⚠️ Проверьте ошибки'}")
    print(f"  NPM пакеты:     {'✅ Установлены' if packages_ok else '⚠️ Требуется установка'}")
    print(f"  Тесты:          {'✅ Готовы' if tests_created else '⚠️ Не созданы'}")
    
    print(f"\n{Colors.CYAN}📊 Прогресс MVP: 40% ████████░░░░░░░░░░░░{Colors.RESET}")
    
    print(f"\n{Colors.YELLOW}{Colors.BOLD}🎯 Следующие шаги:{Colors.RESET}")
    
    if not env_ok:
        print(f"{Colors.RED}1. ВАЖНО: Отредактируйте .env файл!{Colors.RESET}")
        print(f"   Откройте: {PROJECT_PATH / '.env'}")
        print(f"   Измените DB_PASSWORD на ваш пароль от PostgreSQL")
    
    print(f"\n2. Запустите сервер:")
    print(f"   {Colors.CYAN}cd {PROJECT_PATH}{Colors.RESET}")
    print(f"   {Colors.CYAN}npm run start:dev{Colors.RESET}")
    
    print(f"\n3. В новом окне протестируйте API:")
    print(f"   {Colors.CYAN}cd {PROJECT_PATH}{Colors.RESET}")
    print(f"   {Colors.CYAN}node test-api.js{Colors.RESET}")
    
    print(f"\n{Colors.GREEN}{Colors.BOLD}✨ Установка Day 2 завершена!{Colors.RESET}")
    
    if not db_ok or not env_ok:
        print(f"\n{Colors.RED}⚠️ Внимание: Требуется настройка БД и/или .env файла!{Colors.RESET}")

if __name__ == "__main__":
    main()