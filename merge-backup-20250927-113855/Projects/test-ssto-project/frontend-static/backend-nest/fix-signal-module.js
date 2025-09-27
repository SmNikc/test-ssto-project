// fix-signal-module.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\fix-signal-module.js

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'C:\\Projects\\test-ssto-project\\backend-nest';
const signalModulePath = path.join(PROJECT_ROOT, 'src', 'signal', 'signal.module.ts');

console.log('🔧 Добавление PdfService в SignalModule...\n');

if (fs.existsSync(signalModulePath)) {
  let content = fs.readFileSync(signalModulePath, 'utf8');
  
  // Добавляем импорт PdfService если его нет
  if (!content.includes("import { PdfService }")) {
    const lastImportIndex = content.lastIndexOf('import');
    const endOfLine = content.indexOf('\n', lastImportIndex);
    content = content.substring(0, endOfLine + 1) + 
      "import { PdfService } from './pdf.service';\n" + 
      content.substring(endOfLine + 1);
    console.log('✅ Добавлен импорт PdfService');
  }
  
  // Добавляем PdfService в providers
  if (!content.includes('PdfService')) {
    content = content.replace(
      /providers:\s*\[([^]]*?)SignalService([^]]*?)\]/,
      'providers: [$1SignalService, PdfService$2]'
    );
    console.log('✅ PdfService добавлен в providers');
  }
  
  fs.writeFileSync(signalModulePath, content, 'utf8');
  console.log('✅ signal.module.ts обновлен');
  
} else {
  console.log('❌ signal.module.ts не найден, создаем новый...');
  
  const newSignalModule = `import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SignalController } from '../controllers/signal.controller';
import { SignalService } from './signal.service';
import { PdfService } from './pdf.service';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request.model';
import Vessel from '../models/vessel.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Signal, SSASRequest, Vessel])
  ],
  controllers: [SignalController],
  providers: [SignalService, PdfService],
  exports: [SignalService, PdfService]
})
export class SignalModule {}`;
  
  fs.writeFileSync(signalModulePath, newSignalModule, 'utf8');
  console.log('✅ Создан новый signal.module.ts');
}

console.log('\n🚀 Перезапустите backend:');
console.log('  cd C:\\Projects\\test-ssto-project\\backend-nest');
console.log('  Ctrl+C и npm run start:dev');