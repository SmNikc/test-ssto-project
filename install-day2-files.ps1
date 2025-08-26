# Полная установка всех файлов Day 2
Write-Host "🚀 Установка всех файлов Day 2" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$projectPath = "C:\Projects\test-ssto-project\backend-nest"
$srcPath = "$projectPath\src"

# Переход в папку проекта
Set-Location $projectPath

# Создание структуры папок
Write-Host "`n📁 Создание структуры папок..." -ForegroundColor Yellow
@("models", "services", "controllers", "dto") | ForEach-Object {
    New-Item -ItemType Directory -Path "$srcPath\$_" -Force | Out-Null
}

# ============== 1. REQUEST.MODEL.TS ==============
Write-Host "`n📝 Создание request.model.ts..." -ForegroundColor Yellow
@'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

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
}
'@ | Set-Content -Path "$srcPath\models\request.model.ts" -Encoding UTF8

# ============== 2. SIGNAL.MODEL.TS ==============
Write-Host "📝 Создание signal.model.ts..." -ForegroundColor Yellow
@'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
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
}
'@ | Set-Content -Path "$srcPath\models\signal.model.ts" -Encoding UTF8

# ============== 3. REQUEST.DTO.TS ==============
Write-Host "📝 Создание request.dto.ts..." -ForegroundColor Yellow
@'
import { IsEmail, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
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
}
'@ | Set-Content -Path "$srcPath\dto\request.dto.ts" -Encoding UTF8

# ============== 4. REQUEST.SERVICE.TS ==============
Write-Host "📝 Создание request.service.ts..." -ForegroundColor Yellow
@'
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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
        ? `${request.notes}\n\n[${new Date().toISOString()}] Status changed from ${oldStatus} to ${updateStatusDto.status}: ${updateStatusDto.notes}`
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
}
'@ | Set-Content -Path "$srcPath\services\request.service.ts" -Encoding UTF8

# ============== 5. EMAIL.SERVICE.TS (упрощенная версия) ==============
Write-Host "📝 Создание email.service.ts..." -ForegroundColor Yellow
@'
import { Injectable, Logger } from '@nestjs/common';
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
    const hexPattern = /\b[A-F0-9]{15}\b/i;
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
}
'@ | Set-Content -Path "$srcPath\services\email.service.ts" -Encoding UTF8

# ============== 6. REQUEST.CONTROLLER.TS ==============
Write-Host "📝 Создание request.controller.ts..." -ForegroundColor Yellow
@'
import { 
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
}
'@ | Set-Content -Path "$srcPath\controllers\request.controller.ts" -Encoding UTF8

# ============== 7. SSTO.MODULE.TS ==============
Write-Host "📝 Создание ssto.module.ts..." -ForegroundColor Yellow
@'
import { Module } from '@nestjs/common';
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
export class SstoModule {}
'@ | Set-Content -Path "$srcPath\ssto.module.ts" -Encoding UTF8

# ============== 8. APP.MODULE.TS ==============
Write-Host "📝 Создание app.module.ts..." -ForegroundColor Yellow
@'
import { Module } from '@nestjs/common';
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
export class AppModule {}
'@ | Set-Content -Path "$srcPath\app.module.ts" -Encoding UTF8

# ============== 9. APP.CONTROLLER.TS ==============
Write-Host "📝 Создание app.controller.ts..." -ForegroundColor Yellow
@'
import { Controller, Get } from '@nestjs/common';
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
}
'@ | Set-Content -Path "$srcPath\app.controller.ts" -Encoding UTF8

# ============== 10. APP.SERVICE.TS ==============
Write-Host "📝 Создание app.service.ts..." -ForegroundColor Yellow
@'
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SSTO Test API - Day 2 Ready!';
  }
}
'@ | Set-Content -Path "$srcPath\app.service.ts" -Encoding UTF8

# Проверка созданных файлов
Write-Host "`n✅ Проверка созданных файлов..." -ForegroundColor Green

$files = @(
    "models\request.model.ts",
    "models\signal.model.ts",
    "dto\request.dto.ts",
    "services\request.service.ts",
    "services\email.service.ts",
    "controllers\request.controller.ts",
    "ssto.module.ts",
    "app.module.ts",
    "app.controller.ts",
    "app.service.ts"
)

$allCreated = $true
foreach ($file in $files) {
    $fullPath = Join-Path $srcPath $file
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length
        Write-Host "✅ $file ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - НЕ СОЗДАН" -ForegroundColor Red
        $allCreated = $false
    }
}

# Установка npm пакетов
Write-Host "`n📦 Установка необходимых npm пакетов..." -ForegroundColor Yellow
npm install class-validator class-transformer imap mailparser @types/imap --save

# Финальное сообщение
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
if ($allCreated) {
    Write-Host "    ✨ ВСЕ ФАЙЛЫ УСПЕШНО СОЗДАНЫ! ✨      " -ForegroundColor Green
} else {
    Write-Host "    ⚠️ НЕКОТОРЫЕ ФАЙЛЫ НЕ СОЗДАНЫ ⚠️      " -ForegroundColor Red
}
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📊 Прогресс MVP: 40% " -NoNewline -ForegroundColor Yellow
Write-Host "████████" -NoNewline -ForegroundColor Green
Write-Host "████████████" -ForegroundColor Gray

Write-Host "`n🎯 Следующие шаги:" -ForegroundColor Cyan
Write-Host "1. Запустите сервер: npm run start:dev"
Write-Host "2. Дождитесь сообщения: [Nest] ... application successfully started"
Write-Host "3. В новом окне PowerShell: node test-api.js"
Write-Host "4. Проверьте API: Invoke-RestMethod http://localhost:3000/health"

Write-Host "`n💡 Команды для запуска:" -ForegroundColor Yellow
Write-Host "cd C:\Projects\test-ssto-project\backend-nest"
Write-Host "npm run start:dev"

Write-Host "`n🔍 Для проверки:" -ForegroundColor Yellow
Write-Host "Invoke-RestMethod http://localhost:3000/health"
Write-Host "Invoke-RestMethod http://localhost:3000/api/requests"