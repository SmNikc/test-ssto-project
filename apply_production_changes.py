#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
apply_production_changes.py - Применение production изменений к проекту ССТО
Запускать из корня проекта: C:\\Projects\\test-ssto-project
Python 3.8+
"""

import os
import sys
import shutil
import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple

class ProductionUpdater:
    """Класс для обновления проекта до production-ready состояния"""
    
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root).resolve()
        self.backend_path = self.project_root / "backend-nest"
        self.backup_dir = self.project_root / f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.changes_log = []
        
    def log(self, message: str, level: str = "INFO"):
        """Логирование действий"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        color = {
            "INFO": "\033[0m",      # Белый
            "SUCCESS": "\033[92m",   # Зеленый
            "WARNING": "\033[93m",   # Желтый
            "ERROR": "\033[91m",     # Красный
            "ACTION": "\033[96m"     # Голубой
        }
        print(f"{color.get(level, '')}{timestamp} [{level}] {message}\033[0m")
        self.changes_log.append(f"{timestamp} [{level}] {message}")
        
    def create_backup(self):
        """Создание резервной копии важных файлов"""
        self.log("Создание резервной копии...", "INFO")
        
        files_to_backup = [
            "backend-nest/src/request/request.service.ts",
            "backend-nest/src/signal/signal.service.ts",
            "backend-nest/src/controllers/request.controller.ts",
            "backend-nest/src/controllers/signal.controller.ts",
            "backend-nest/src/models/request.ts",
            "backend-nest/src/models/signal.model.ts",
            "backend-nest/src/main.ts",
            "backend-nest/src/app.module.ts"
        ]
        
        os.makedirs(self.backup_dir, exist_ok=True)
        
        for file_path in files_to_backup:
            full_path = self.project_root / file_path
            if full_path.exists():
                backup_path = self.backup_dir / file_path
                backup_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(full_path, backup_path)
                self.log(f"  ✓ Backup: {file_path}", "SUCCESS")
                
    def create_dto_files(self):
        """Создание DTO файлов для валидации"""
        self.log("Создание DTO файлов...", "INFO")
        
        dto_dir = self.backend_path / "src" / "dto"
        dto_dir.mkdir(exist_ok=True)
        
        # request.dto.ts
        request_dto_content = '''import { IsString, IsEmail, IsDateString, Matches, IsOptional, IsEnum, Length } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @Matches(/^\\d{9}$/, { message: 'MMSI должен содержать 9 цифр' })
  mmsi: string;

  @IsString()
  @Length(1, 100)
  vessel_name: string;

  @IsString()
  @Length(1, 200)
  owner_organization: string;

  @IsString()
  @Length(1, 100)
  contact_person: string;

  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^[+]?[0-9\\s-()]+$/, { message: 'Некорректный номер телефона' })
  phone?: string;

  @IsDateString()
  test_date: string;

  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Время в формате HH:MM' })
  start_time: string;

  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Время в формате HH:MM' })
  end_time: string;
}

export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  vessel_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  test_date?: string;

  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  start_time?: string;

  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  end_time?: string;
}
'''
        
        (dto_dir / "request.dto.ts").write_text(request_dto_content, encoding='utf-8')
        self.log("  ✓ Создан src/dto/request.dto.ts", "SUCCESS")
        
    def create_exception_filter(self):
        """Создание глобального обработчика ошибок"""
        self.log("Создание обработчика ошибок...", "INFO")
        
        filters_dir = self.backend_path / "src" / "filters"
        filters_dir.mkdir(exist_ok=True)
        
        exception_filter_content = '''import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message = typeof errorResponse === 'string' 
        ? errorResponse 
        : (errorResponse as any).message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    });
  }
}
'''
        
        (filters_dir / "all-exceptions.filter.ts").write_text(exception_filter_content, encoding='utf-8')
        self.log("  ✓ Создан src/filters/all-exceptions.filter.ts", "SUCCESS")
        
    def update_request_service(self):
        """Обновление request.service.ts - добавление enums и методов"""
        self.log("Обновление request.service.ts...", "WARNING")
        
        file_path = self.backend_path / "src" / "request" / "request.service.ts"
        if not file_path.exists():
            self.log(f"  ✗ Файл не найден: {file_path}", "ERROR")
            return
            
        content = file_path.read_text(encoding='utf-8')
        
        # Проверяем, не добавлены ли уже изменения
        if "RequestStatus" in content:
            self.log("  ⚠ RequestStatus уже существует, пропускаем", "WARNING")
            return
            
        # Добавляем enums после импортов
        enums_to_add = """
export enum RequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  IN_TESTING = 'IN_TESTING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.DRAFT]: [RequestStatus.SUBMITTED, RequestStatus.CANCELLED],
  [RequestStatus.SUBMITTED]: [RequestStatus.IN_REVIEW, RequestStatus.CANCELLED],
  [RequestStatus.IN_REVIEW]: [RequestStatus.APPROVED, RequestStatus.REJECTED],
  [RequestStatus.APPROVED]: [RequestStatus.IN_TESTING, RequestStatus.CANCELLED],
  [RequestStatus.IN_TESTING]: [RequestStatus.COMPLETED, RequestStatus.CANCELLED],
  [RequestStatus.COMPLETED]: [],
  [RequestStatus.REJECTED]: [RequestStatus.DRAFT],
  [RequestStatus.CANCELLED]: []
};
"""
        
        # Вставляем после импортов, перед @Injectable
        if "@Injectable()" in content:
            content = content.replace("@Injectable()", enums_to_add + "\n@Injectable()")
            file_path.write_text(content, encoding='utf-8')
            self.log("  ✓ Добавлены enums и матрица переходов", "SUCCESS")
        
        self.log("  ⚠ НЕОБХОДИМО ВРУЧНУЮ добавить метод transitionStatus в класс RequestService", "ACTION")
        
    def install_dependencies(self):
        """Установка npm зависимостей"""
        self.log("Установка зависимостей...", "INFO")
        
        dependencies = [
            "class-validator",
            "class-transformer",
            "helmet",
            "compression",
            "express-rate-limit",
            "@nestjs/swagger",
            "@nestjs/terminus",
            "winston"
        ]
        
        dev_dependencies = [
            "@types/compression",
            "@types/express-rate-limit"
        ]
        
        os.chdir(self.backend_path)
        
        # Установка production зависимостей
        self.log("  Установка production зависимостей...", "INFO")
        cmd = f"npm install {' '.join(dependencies)}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            self.log("  ✓ Production зависимости установлены", "SUCCESS")
        else:
            self.log(f"  ✗ Ошибка установки: {result.stderr}", "ERROR")
            
        # Установка dev зависимостей
        self.log("  Установка dev зависимостей...", "INFO")
        cmd_dev = f"npm install --save-dev {' '.join(dev_dependencies)}"
        result_dev = subprocess.run(cmd_dev, shell=True, capture_output=True, text=True)
        if result_dev.returncode == 0:
            self.log("  ✓ Dev зависимости установлены", "SUCCESS")
        else:
            self.log(f"  ✗ Ошибка установки dev: {result_dev.stderr}", "ERROR")
            
        os.chdir(self.project_root)
        
    def create_checklist(self):
        """Создание чек-листа изменений"""
        checklist = """
# ЧЕКЛИСТ PRODUCTION ОБНОВЛЕНИЙ
=====================================

## 📁 Обновление файлов сервисов:

### 1. backend-nest/src/request/request.service.ts
- [ ] Добавить импорты: Sequelize, Transaction, Op
- [ ] Добавить enum RequestStatus
- [ ] Добавить матрицу STATUS_TRANSITIONS
- [ ] Добавить Sequelize в constructor
- [ ] Добавить метод transitionStatus()
- [ ] Добавить метод getAvailableTransitions()
- [ ] Обновить метод create() - добавить валидацию

### 2. backend-nest/src/signal/signal.service.ts
- [ ] Добавить enum SignalType
- [ ] Добавить enum SignalStatus
- [ ] Добавить метод processEmailSignal()
- [ ] Добавить метод parseEmailContent()
- [ ] Добавить метод matchSignalToRequest()

### 3. backend-nest/src/controllers/request.controller.ts
- [ ] Импортировать RequestStatus из сервиса
- [ ] Добавить POST /:id/submit
- [ ] Добавить POST /:id/approve
- [ ] Добавить POST /:id/reject
- [ ] Добавить POST /:id/cancel
- [ ] Добавить POST /:id/start-testing
- [ ] Добавить POST /:id/complete
- [ ] Добавить GET /:id/available-transitions

### 4. backend-nest/src/models/request.ts
- [ ] Добавить поле status (ENUM)
- [ ] Добавить поле status_updated_at (DATE)
- [ ] Добавить поле rejection_reason (TEXT)
- [ ] Добавить поле phone (STRING)

### 5. backend-nest/src/models/signal.model.ts
- [ ] Добавить поле status (ENUM)
- [ ] Добавить поле latitude (DECIMAL)
- [ ] Добавить поле longitude (DECIMAL)
- [ ] Добавить поле vessel_name (STRING)
- [ ] Добавить поле error_message (TEXT)

### 6. backend-nest/src/main.ts
- [ ] Импортировать ValidationPipe
- [ ] Добавить app.useGlobalPipes(new ValidationPipe())
- [ ] Добавить helmet
- [ ] Добавить compression
- [ ] Добавить rate limiting
- [ ] Добавить global exception filter

## ✅ Новые файлы (созданы автоматически):
- [x] src/dto/request.dto.ts
- [x] src/filters/all-exceptions.filter.ts

## 🧪 Тестирование:
- [ ] npm run build - компиляция успешна
- [ ] npm run test - тесты проходят
- [ ] npm run start:dev - приложение запускается
- [ ] Проверить GET /api/health
- [ ] Проверить новые endpoints статусов

## 📝 Финальные действия:
- [ ] Удалить временные файлы из Downloads
- [ ] Сделать git commit изменений
- [ ] Запустить миграции БД
"""
        
        checklist_path = self.project_root / "PRODUCTION_CHECKLIST.md"
        checklist_path.write_text(checklist, encoding='utf-8')
        self.log(f"✓ Создан чек-лист: {checklist_path}", "SUCCESS")
        
    def print_manual_changes(self):
        """Вывод инструкций для ручных изменений"""
        print("\n" + "="*60)
        print("ТРЕБУЮТСЯ РУЧНЫЕ ИЗМЕНЕНИЯ:")
        print("="*60)
        
        instructions = [
            ("request.service.ts", [
                "1. Откройте backend-nest/src/request/request.service.ts",
                "2. Добавьте 'private readonly sequelize: Sequelize' в constructor",
                "3. Добавьте метод transitionStatus (код в чек-листе)",
                "4. Обновите метод create - добавьте валидацию MMSI"
            ]),
            ("signal.service.ts", [
                "1. Откройте backend-nest/src/signal/signal.service.ts",
                "2. Добавьте enums SignalType и SignalStatus",
                "3. Добавьте метод processEmailSignal",
                "4. Добавьте private метод matchSignalToRequest"
            ]),
            ("request.controller.ts", [
                "1. Откройте backend-nest/src/controllers/request.controller.ts",
                "2. Добавьте новые POST endpoints для статусов",
                "3. Импортируйте RequestStatus из request.service"
            ]),
            ("Модели Sequelize", [
                "1. Обновите models/request.ts - добавьте поля status, status_updated_at",
                "2. Обновите models/signal.model.ts - добавьте поля status, latitude, longitude"
            ])
        ]
        
        for file, steps in instructions:
            print(f"\n📁 {file}:")
            for step in steps:
                print(f"   {step}")
                
    def run(self):
        """Запуск всех обновлений"""
        print("\n" + "="*60)
        print("PRODUCTION UPDATER для проекта ССТО")
        print("="*60)
        
        # Проверка, что мы в правильной директории
        if not (self.backend_path / "package.json").exists():
            self.log("ОШИБКА: Запустите скрипт из корня проекта!", "ERROR")
            self.log(f"Текущая директория: {self.project_root}", "ERROR")
            sys.exit(1)
            
        try:
            # 1. Резервное копирование
            self.create_backup()
            
            # 2. Создание новых файлов
            self.create_dto_files()
            self.create_exception_filter()
            
            # 3. Обновление существующих файлов
            self.update_request_service()
            
            # 4. Установка зависимостей
            response = input("\nУстановить npm зависимости? (y/n): ")
            if response.lower() == 'y':
                self.install_dependencies()
                
            # 5. Создание чек-листа
            self.create_checklist()
            
            # 6. Инструкции для ручных изменений
            self.print_manual_changes()
            
            # 7. Сохранение лога
            log_path = self.project_root / "production_update.log"
            log_path.write_text("\n".join(self.changes_log), encoding='utf-8')
            
            print("\n" + "="*60)
            print("✅ ОБНОВЛЕНИЕ ЗАВЕРШЕНО!")
            print("="*60)
            print(f"📁 Резервная копия: {self.backup_dir}")
            print(f"📝 Чек-лист: PRODUCTION_CHECKLIST.md")
            print(f"📄 Лог изменений: production_update.log")
            print("\n⚠️  ВАЖНО: Выполните ручные изменения по чек-листу!")
            print("\n🗑️  Удалите файлы из Downloads:")
            print("   - C:\\Users\\smeta\\Downloads\\migration-plan.ts")
            print("   - C:\\Users\\smeta\\Downloads\\production-ready-fixes.ts")
            
        except Exception as e:
            self.log(f"КРИТИЧЕСКАЯ ОШИБКА: {e}", "ERROR")
            import traceback
            traceback.print_exc()
            sys.exit(1)


if __name__ == "__main__":
    # Проверка версии Python
    if sys.version_info < (3, 6):
        print("Требуется Python 3.6 или выше!")
        sys.exit(1)
        
    # Запуск обновления
    updater = ProductionUpdater()
    updater.run()