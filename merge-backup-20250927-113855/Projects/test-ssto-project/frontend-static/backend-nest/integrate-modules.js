// integrate-modules.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\integrate-modules.js

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'C:\\Projects\\test-ssto-project\\backend-nest';
const appModulePath = path.join(PROJECT_ROOT, 'src', 'app.module.ts');

console.log('🔧 Интеграция модулей правильным способом...\n');
console.log(`📁 Рабочая папка: ${PROJECT_ROOT}\n`);

// Новый правильный app.module.ts
const newAppModule = `import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

// Импортируем МОДУЛИ, а не контроллеры напрямую
import { RequestModule } from './request/request.module';
import { SignalModule } from './signal/signal.module';

// Остальные контроллеры которых нет в модулях
import { AppController } from './app.controller';
import { EmailController } from './controllers/email.controller';
import { TestingController } from './controllers/testing.controller';
import { UserController } from './controllers/user.controller';
import { LogController } from './controllers/log.controller';
import { HealthController } from './controllers/health.controller';

// Сервисы для контроллеров вне модулей
import { AppService } from './app.service';
import { EmailSenderService } from './services/email-sender.service';
import { EmailParserService } from './services/email-parser.service';
import { EmailTaskService } from './services/email-task.service';
import { TestingService } from './testing/testing.service';
import { UserService } from './user/user.service';
import { LogService } from './log/log.service';

// Модели
import SSASRequest from './models/request.model';
import Signal from './models/signal.model';
import User from './models/user.model';
import Log from './models/log.model';
import TestingScenario from './models/testingScenario.model';
import Vessel from './models/vessel.model';

@Module({
  imports: [
    // Конфигурация
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // База данных
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'ssto'),
        password: configService.get('DB_PASSWORD', 'sstopass'),
        database: configService.get('DB_NAME', 'sstodb'),
        models: [SSASRequest, Signal, User, Log, TestingScenario, Vessel],
        autoLoadModels: true,
        synchronize: false,
        logging: false,
      }),
    }),
    
    // Модели для инъекций в сервисы вне модулей
    SequelizeModule.forFeature([User, Log, TestingScenario]),
    
    // ИМПОРТИРУЕМ МОДУЛИ, А НЕ КОНТРОЛЛЕРЫ
    RequestModule,  // Содержит RequestController и ConfirmationController
    SignalModule,   // Содержит SignalController
  ],
  controllers: [
    AppController,
    EmailController,
    TestingController,
    UserController,
    LogController,
    HealthController,
  ],
  providers: [
    AppService,
    EmailSenderService,
    EmailParserService,
    EmailTaskService,
    TestingService,
    UserService,
    LogService,
  ],
})
export class AppModule {}`;

// Создаем резервную копию
const backupPath = appModulePath + '.backup_' + Date.now();
const currentContent = fs.readFileSync(appModulePath, 'utf8');
fs.writeFileSync(backupPath, currentContent, 'utf8');
console.log(`📄 Резервная копия: ${path.basename(backupPath)}\n`);

// Сохраняем новый app.module.ts
fs.writeFileSync(appModulePath, newAppModule, 'utf8');

console.log('✅ app.module.ts обновлен с правильной структурой модулей');
console.log('\n📋 Что изменено:');
console.log('  • RequestModule импортирован как модуль (содержит RequestController)');
console.log('  • SignalModule импортирован как модуль (содержит SignalController)');
console.log('  • Убраны дублирующиеся импорты контроллеров');
console.log('  • Оставлены только контроллеры, которых нет в модулях');

console.log('\n🚀 Перезапустите backend:');
console.log('  cd C:\\Projects\\test-ssto-project\\backend-nest');
console.log('  Ctrl+C (остановить)');
console.log('  npm run start:dev');

console.log('\n✅ После перезапуска должны работать:');
console.log('  • http://localhost:3001/requests - список заявок');
console.log('  • http://localhost:3001/signals - список сигналов');
console.log('  • http://localhost:5173/requests - frontend страница заявок');