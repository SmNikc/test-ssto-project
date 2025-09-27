// fix-enhanced-confirmation.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\fix-enhanced-confirmation.js

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'C:\\Projects\\test-ssto-project\\backend-nest';
const servicePath = path.join(PROJECT_ROOT, 'src', 'services', 'enhanced-confirmation.service.ts');

console.log('🔧 Исправление EnhancedConfirmationService...\n');

if (fs.existsSync(servicePath)) {
  let content = fs.readFileSync(servicePath, 'utf8');
  
  // Заменяем @InjectModel(TestRequest) на @InjectModel(SSASRequest) если TestRequest проблемный
  content = content.replace(
    /@InjectModel\(TestRequest\)/g,
    '@InjectModel(SSASRequest)'
  );
  
  content = content.replace(
    /private\s+testRequestModel:\s*typeof\s+TestRequest/g,
    'private requestModel: typeof SSASRequest'
  );
  
  // Заменяем импорт TestRequest на SSASRequest если нужно
  if (!content.includes("import SSASRequest")) {
    content = content.replace(
      /import.*TestRequest.*from.*['"].*test-request.*['"];?/g,
      "import SSASRequest from '../models/request.model';"
    );
  }
  
  fs.writeFileSync(servicePath, content, 'utf8');
  console.log('✅ Заменены зависимости TestRequest на SSASRequest');
} else {
  console.log('⚠️ Файл enhanced-confirmation.service.ts не найден');
  console.log('Создаем заглушку...');
  
  const stubContent = `// C:\\Projects\\test-ssto-project\\backend-nest\\src\\services\\enhanced-confirmation.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import SSASRequest from '../models/request.model';
import ConfirmationDocument from '../models/confirmation-document.model';
import Signal from '../models/signal.model';

@Injectable()
export class EnhancedConfirmationService {
  constructor(
    @InjectModel(SSASRequest) private requestModel: typeof SSASRequest,
    @InjectModel(ConfirmationDocument) private confirmationModel: typeof ConfirmationDocument,
    @InjectModel(Signal) private signalModel: typeof Signal,
  ) {}

  async sendConfirmation(requestId: string) {
    return { sent: true, requestId };
  }

  async generateDocument(requestId: string) {
    return { generated: true, requestId };
  }
}`;
  
  fs.writeFileSync(servicePath, stubContent, 'utf8');
  console.log('✅ Создан файл enhanced-confirmation.service.ts');
}

// Также добавляем все модели в forFeature в app.module
const appModulePath = path.join(PROJECT_ROOT, 'src', 'app.module.ts');
let appContent = fs.readFileSync(appModulePath, 'utf8');

// Находим SequelizeModule.forFeature и обновляем
const forFeatureRegex = /SequelizeModule\.forFeature\(\[\s*([^]]*?)\s*\]\)/;
const match = appContent.match(forFeatureRegex);

if (match) {
  const models = ['SSASRequest', 'Signal', 'ConfirmationDocument', 'TestRequest', 'SSASTerminal', 'SystemSettings'];
  const newForFeature = `SequelizeModule.forFeature([
      ${models.join(',\n      ')}
    ])`;
  
  appContent = appContent.replace(forFeatureRegex, newForFeature);
  fs.writeFileSync(appModulePath, appContent, 'utf8');
  console.log('\n✅ Обновлен SequelizeModule.forFeature со всеми моделями');
}

console.log('\n🚀 Перезапустите backend:');
console.log('  cd C:\\Projects\\test-ssto-project\\backend-nest');
console.log('  Ctrl+C и npm run start:dev');