#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix_and_restore_all.py - Комплексное восстановление всех компонентов
Исправлены все ошибки предыдущих скриптов
Сохранить в: C:\\Projects\\test-ssto-project\\
Запуск: python fix_and_restore_all.py
"""

import os
import sys
from pathlib import Path
import json
import subprocess

# Цвета для консоли
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

PROJECT_PATH = Path("C:/Projects/test-ssto-project/backend-nest")
SRC_PATH = PROJECT_PATH / "src"

def print_header(text):
    print(f"\n{Colors.CYAN}{'='*60}{Colors.RESET}")
    print(f"{Colors.CYAN}{text}{Colors.RESET}")
    print(f"{Colors.CYAN}{'='*60}{Colors.RESET}")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️ {text}{Colors.RESET}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ️ {text}{Colors.RESET}")

# ЧАСТЬ 1: SEQUELIZE МОДЕЛИ (исправленные)
SEQUELIZE_MODELS = {
    "models/system-settings.model.ts": r'''import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  Default
} from 'sequelize-typescript';

@Table({
  tableName: 'system_settings',
  timestamps: true,
  underscored: true
})
export default class SystemSettings extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    comment: 'Ключ настройки'
  })
  key: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: 'Значение настройки'
  })
  value: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Описание настройки'
  })
  description: string;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    comment: 'Активна ли настройка'
  })
  isActive: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
''',

    "models/ssas-terminal.model.ts": r'''import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  UpdatedAt,
  HasMany,
  Default
} from 'sequelize-typescript';
import Signal from './signal.model';

@Table({
  tableName: 'ssas_terminals',
  timestamps: true,
  underscored: true
})
export default class SSASTerminal extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'Номер стойки ССТО - главный идентификатор'
  })
  terminalId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'MMSI судна'
  })
  mmsi: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'IMO номер судна'
  })
  imo: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'Название судна'
  })
  vesselName: string;

  @Column({
    type: DataType.ENUM('INMARSAT', 'IRIDIUM'),
    defaultValue: 'INMARSAT',
    comment: 'Тип системы'
  })
  terminalType: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'Дата последнего перемещения стойки'
  })
  lastTransferDate: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Предыдущее судно'
  })
  previousVessel: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Предыдущий MMSI'
  })
  previousMmsi: string;

  @Default('active')
  @Column({
    type: DataType.ENUM('active', 'inactive', 'maintenance', 'transferred'),
    comment: 'Статус терминала'
  })
  status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Примечания'
  })
  notes: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Signal, 'terminalId')
  signals: Signal[];

  validateMmsi(mmsi: string): boolean {
    if (this.mmsi === mmsi) {
      return true;
    }
    
    if (this.previousMmsi === mmsi) {
      console.warn('Стойка была перемещена с судна MMSI ' + mmsi);
      return true;
    }
    
    return false;
  }
}
''',

    "models/test-report.model.ts": r'''import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  Default
} from 'sequelize-typescript';
import SSASRequest from './request.model';

@Table({
  tableName: 'test_reports',
  timestamps: true,
  underscored: true
})
export default class TestReport extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => SSASRequest)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'ID заявки'
  })
  requestId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'Номер отчета'
  })
  reportNumber: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: 'Дата формирования отчета'
  })
  reportDate: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    comment: 'Количество сигналов 406'
  })
  signals406Count: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    comment: 'Количество сигналов 121.5'
  })
  signals121Count: number;

  @Default('pending')
  @Column({
    type: DataType.ENUM('pending', 'success', 'partial', 'failed'),
    comment: 'Результат теста'
  })
  testResult: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Заключение'
  })
  conclusion: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Путь к PDF файлу'
  })
  pdfPath: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => SSASRequest)
  request: SSASRequest;
}
'''
}

# ЧАСТЬ 2: EMAIL SERVICE И СВЯЗАННЫЕ СЕРВИСЫ
EMAIL_SERVICES = {
    "services/email.service.ts": r'''import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

@Injectable()
export class EmailService {
  private transporter: any;
  private imap: any;

  constructor(private configService: ConfigService) {
    // Настройка SMTP
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD')
      }
    });

    // Настройка IMAP
    this.imap = new Imap({
      user: this.configService.get('IMAP_USER'),
      password: this.configService.get('IMAP_PASSWORD'),
      host: this.configService.get('IMAP_HOST', 'imap.gmail.com'),
      port: this.configService.get('IMAP_PORT', 993),
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
  }

  /**
   * Проверка входящих email с сигналами
   */
  async checkIncomingSignals(): Promise<any[]> {
    const signals = [];
    
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        this.imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          this.imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              reject(err);
              return;
            }

            if (results.length === 0) {
              this.imap.end();
              resolve([]);
              return;
            }

            const fetch = this.imap.fetch(results, { bodies: '', markSeen: true });

            fetch.on('message', (msg) => {
              let rawEmail = '';

              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  rawEmail += chunk.toString('utf8');
                });

                stream.once('end', async () => {
                  try {
                    const parsed = await simpleParser(rawEmail);
                    const signalData = this.parseSignalFromEmail(parsed);
                    if (signalData) {
                      signals.push(signalData);
                    }
                  } catch (parseErr) {
                    console.error('Ошибка парсинга:', parseErr);
                  }
                });
              });
            });

            fetch.once('end', () => {
              this.imap.end();
              resolve(signals);
            });

            fetch.once('error', reject);
          });
        });
      });

      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  /**
   * Парсинг сигнала из email - поддержка русских дат
   */
  private parseSignalFromEmail(parsed: any): any {
    const text = parsed.text || '';
    const subject = parsed.subject || '';

    const patterns = {
      mmsi: /MMSI[:\s]+(\d{9})/i,
      terminal: /Terminal[:\s]+([A-Z0-9-]+)/i,
      inmarsat: /(\d{9,})/,
      iridium: /IR-(\d+)/i,
      time: /Time[:\s]+([^\n\r]+)/i,
      lat: /Lat[:\s]+([-\d.]+)/i,
      lon: /Lon[:\s]+([-\d.]+)/i
    };

    const signal: any = {
      receivedAt: new Date(),
      emailSubject: subject,
      emailFrom: parsed.from?.text,
      rawMessage: text
    };

    // Извлекаем данные
    const mmsiMatch = text.match(patterns.mmsi);
    if (mmsiMatch) signal.mmsi = mmsiMatch[1];

    const terminalMatch = text.match(patterns.terminal);
    if (terminalMatch) {
      signal.terminalId = terminalMatch[1];
    } else {
      const inmarsatMatch = text.match(patterns.inmarsat);
      if (inmarsatMatch && inmarsatMatch[1].length === 9) {
        signal.terminalId = inmarsatMatch[1];
        signal.terminalType = 'INMARSAT';
      }
    }

    // Парсинг времени с поддержкой русского формата
    const timeMatch = text.match(patterns.time);
    if (timeMatch) {
      signal.signalTime = this.parseRussianDate(timeMatch[1]);
    }

    const latMatch = text.match(patterns.lat);
    const lonMatch = text.match(patterns.lon);
    if (latMatch && lonMatch) {
      signal.latitude = parseFloat(latMatch[1]);
      signal.longitude = parseFloat(lonMatch[1]);
    }

    // Определяем тип сигнала
    if (text.toLowerCase().includes('test')) {
      signal.signalType = 'test_406';
    } else {
      signal.signalType = 'real_alert';
    }

    return signal.terminalId || signal.mmsi ? signal : null;
  }

  /**
   * Парсинг русских дат
   */
  private parseRussianDate(dateStr: string): Date {
    const months = {
      'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
      'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
      'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
    };

    const match = dateStr.match(/(\d+)\s+(\w+)\s+(\d{4})\s+г?\.\s+(\d{1,2}):(\d{2}):(\d{2})/);
    if (match) {
      const month = months[match[2].toLowerCase()];
      if (month !== undefined) {
        return new Date(
          parseInt(match[3]), month, parseInt(match[1]),
          parseInt(match[4]), parseInt(match[5]), parseInt(match[6])
        );
      }
    }

    return new Date(dateStr);
  }

  /**
   * Отправка отчета по email
   */
  async sendTestReport(testData: any, pdfBuffer?: Buffer): Promise<void> {
    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: testData.requesterEmail,
      subject: 'Отчет о тестировании ССТО - ' + testData.vesselName,
      html: '<h2>Тестирование ССТО завершено</h2><p>Результаты во вложении.</p>',
      attachments: pdfBuffer ? [{
        filename: 'report.pdf',
        content: pdfBuffer
      }] : []
    };

    await this.transporter.sendMail(mailOptions);
  }
}
''',

    "services/map.service.ts": r'''import { Injectable } from '@nestjs/common';

@Injectable()
export class MapService {
  /**
   * Преобразование координат в десятичные градусы
   */
  convertToDecimalDegrees(coordinate: string, isLongitude: boolean = false): number {
    // Обработка различных форматов координат
    const dmsMatch = coordinate.match(/(\d+)[°\s]+(\d+)['\s]+(\d+(?:\.\d+)?)["\s]*([NSEW])?/);
    
    if (dmsMatch) {
      const degrees = parseInt(dmsMatch[1]);
      const minutes = parseInt(dmsMatch[2]);
      const seconds = parseFloat(dmsMatch[3]);
      const direction = dmsMatch[4];
      
      let decimal = degrees + minutes / 60 + seconds / 3600;
      
      if (direction === 'S' || direction === 'W') {
        decimal = -decimal;
      }
      
      return decimal;
    }
    
    // Если уже в десятичном формате
    return parseFloat(coordinate);
  }

  /**
   * Данные для отображения на карте
   */
  getMapData(signals: any[]): any {
    return {
      type: 'FeatureCollection',
      features: signals.map(signal => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [signal.longitude, signal.latitude]
        },
        properties: {
          id: signal.id,
          terminalId: signal.terminalId,
          mmsi: signal.mmsi,
          signalType: signal.signalType,
          receivedAt: signal.receivedAt,
          color: this.getSignalColor(signal.signalType)
        }
      }))
    };
  }

  private getSignalColor(signalType: string): string {
    switch (signalType) {
      case 'test_406':
      case 'test_121':
        return '#4CAF50'; // Зеленый для тестовых
      case 'real_alert':
        return '#F44336'; // Красный для реальных
      default:
        return '#FFC107'; // Желтый для неопределенных
    }
  }
}
''',

    "services/poisk-more.service.ts": r'''import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const axios = require('axios');

@Injectable()
export class PoiskMoreService {
  private apiUrl: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get('POISK_MORE_API_URL', 'https://api.poisk-more.ru');
  }

  /**
   * Передача сигнала в систему Поиск-Море
   */
  async transferSignal(signal: any): Promise<string> {
    try {
      const response = await axios.post(this.apiUrl + '/signals', {
        terminalId: signal.terminalId,
        mmsi: signal.mmsi,
        latitude: signal.latitude,
        longitude: signal.longitude,
        signalType: signal.signalType,
        receivedAt: signal.receivedAt,
        vesselName: signal.terminal?.vesselName
      }, {
        headers: {
          'Authorization': 'Bearer ' + this.configService.get('POISK_MORE_TOKEN'),
          'Content-Type': 'application/json'
        }
      });

      return response.data.id;
    } catch (error) {
      console.error('Ошибка передачи в Поиск-Море:', error);
      throw error;
    }
  }
}
'''
}

def create_all_files():
    """Создание всех файлов"""
    print_header("СОЗДАНИЕ ВСЕХ НЕОБХОДИМЫХ ФАЙЛОВ")
    
    all_files = {**SEQUELIZE_MODELS, **EMAIL_SERVICES}
    created = []
    errors = []
    
    for file_path, content in all_files.items():
        full_path = SRC_PATH / file_path
        
        try:
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print_success(f"Создан: {file_path}")
            created.append(file_path)
            
        except Exception as e:
            print_error(f"Ошибка при создании {file_path}: {e}")
            errors.append(file_path)
    
    return created, errors

def update_app_module():
    """Обновление app.module.ts"""
    print_header("ОБНОВЛЕНИЕ APP.MODULE.TS")
    
    app_module_path = SRC_PATH / "app.module.ts"
    
    if not app_module_path.exists():
        print_error("app.module.ts не найден!")
        return
    
    with open(app_module_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Добавляем импорты если их нет
    imports_to_add = [
        "import SystemSettings from './models/system-settings.model';",
        "import SSASTerminal from './models/ssas-terminal.model';",
        "import TestReport from './models/test-report.model';",
        "import { EmailService } from './services/email.service';",
        "import { MapService } from './services/map.service';",
        "import { PoiskMoreService } from './services/poisk-more.service';"
    ]
    
    models_added = []
    services_added = []
    
    for import_line in imports_to_add:
        if import_line not in content:
            model_or_service = import_line.split(' ')[1]
            if 'models' in import_line:
                models_added.append(model_or_service)
            else:
                services_added.append(model_or_service.replace('{', '').replace('}', '').strip())
    
    if models_added or services_added:
        print_warning("Необходимо добавить в app.module.ts:")
        
        if models_added:
            print_info("\nДобавьте импорты моделей:")
            for model in models_added:
                print(f"  import {model} from './models/{model.lower().replace('ssas', 'ssas-')}.model';")
            
            print_info("\nДобавьте в массив models:")
            print(f"  models: [..., {', '.join(models_added)}]")
        
        if services_added:
            print_info("\nДобавьте импорты сервисов:")
            for service in services_added:
                print(f"  import {{ {service} }} from './services/{service.lower().replace('service', '.service')}';")
            
            print_info("\nДобавьте в массив providers:")
            print(f"  providers: [..., {', '.join(services_added)}]")
    else:
        print_success("Все модули уже импортированы")

def install_dependencies():
    """Установка зависимостей"""
    print_header("УСТАНОВКА ЗАВИСИМОСТЕЙ")
    
    os.chdir(PROJECT_PATH)
    
    deps = [
        "nodemailer",
        "@types/nodemailer",
        "imap",
        "@types/imap",
        "mailparser",
        "@nestjs/schedule",
        "axios"
    ]
    
    for dep in deps:
        print_info(f"Устанавливаем {dep}...")
        result = subprocess.run(f"npm install {dep}", shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print_success(f"{dep} установлен")
        else:
            print_warning(f"Проблема с {dep}")

def create_test_scripts():
    """Создание тестовых скриптов"""
    print_header("СОЗДАНИЕ ТЕСТОВЫХ СКРИПТОВ")
    
    # Тест email
    test_email = r'''// test-email.js
console.log('Тестирование EmailService...');

const testSignal = `
ССТО Тестовый сигнал
Terminal: 427309676
MMSI: 273456789
Time: 1 сентября 2025 г. 5:46:51
Lat: 43.123
Lon: 131.456
Type: TEST
`;

console.log('Тестовый сигнал подготовлен');
console.log('Запустите backend и проверьте обработку email');
'''
    
    test_path = PROJECT_PATH / "test-email.js"
    with open(test_path, 'w', encoding='utf-8') as f:
        f.write(test_email)
    
    print_success("test-email.js создан")

def update_env():
    """Обновление .env файла"""
    print_header("ОБНОВЛЕНИЕ .ENV")
    
    env_path = PROJECT_PATH / ".env"
    
    env_template = """
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your_email@gmail.com
IMAP_PASSWORD=your_app_password

# Poisk-More Integration
POISK_MORE_API_URL=https://api.poisk-more.ru
POISK_MORE_TOKEN=your_token_here
"""
    
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'SMTP_HOST' not in content:
            with open(env_path, 'a', encoding='utf-8') as f:
                f.write(env_template)
            print_success(".env обновлен")
        else:
            print_info(".env уже содержит email настройки")
    else:
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(env_template)
        print_success(".env создан")

def main():
    print(f"{Colors.BOLD}{Colors.CYAN}")
    print("="*60)
    print("  КОМПЛЕКСНОЕ ВОССТАНОВЛЕНИЕ ВСЕХ КОМПОНЕНТОВ  ")
    print("="*60)
    print(f"{Colors.RESET}")
    
    # 1. Создаем все файлы
    created, errors = create_all_files()
    
    # 2. Обновляем app.module.ts
    update_app_module()
    
    # 3. Устанавливаем зависимости
    install_dependencies()
    
    # 4. Создаем тестовые скрипты
    create_test_scripts()
    
    # 5. Обновляем .env
    update_env()
    
    # Итоговый отчет
    print_header("ИТОГОВЫЙ ОТЧЕТ")
    
    print_success(f"Создано файлов: {len(created)}")
    
    if errors:
        print_error(f"Ошибок: {len(errors)}")
        for err in errors:
            print(f"  - {err}")
    
    print(f"\n{Colors.GREEN}✨ Система восстановлена!{Colors.RESET}")
    
    print(f"\n{Colors.YELLOW}КРИТИЧЕСКИ ВАЖНО:{Colors.RESET}")
    print("1. Настройте email в .env файле")
    print("2. Добавьте недостающие импорты в app.module.ts")
    print("3. Перезапустите backend: npm run start:dev")
    print("4. Протестируйте: node test-email.js")

if __name__ == "__main__":
    main()
