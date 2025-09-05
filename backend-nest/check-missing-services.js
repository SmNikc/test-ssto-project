// check-missing-services.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\check-missing-services.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка структуры проекта и недостающих компонентов...\n');

const checks = {
  controllers: [
    'src/controllers/request.controller.ts',
    'src/controllers/signal.controller.ts',
    'src/controllers/request-ssto.controller.ts'
  ],
  services: [
    'src/signal/signal.service.ts',
    'src/signal/pdf.service.ts',
    'src/request/request.service.ts',
    'src/services/signal.service.ts',
    'src/services/request.service.ts'
  ],
  models: [
    'src/models/request.model.ts',
    'src/models/signal.model.ts',
    'src/models/request.ts'
  ],
  modules: [
    'src/app.module.ts',
    'src/signal/signal.module.ts',
    'src/request/request.module.ts'
  ]
};

const results = {};

Object.keys(checks).forEach(category => {
  console.log(`📁 ${category.toUpperCase()}:`);
  results[category] = [];
  
  checks[category].forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${file}`);
      results[category].push(file);
    } else {
      console.log(`  ❌ ${file} - НЕ НАЙДЕН`);
    }
  });
  console.log('');
});

// Проверяем импорты в app.module.ts
console.log('📋 Проверка app.module.ts:');
const appModulePath = path.join(__dirname, 'src/app.module.ts');
if (fs.existsSync(appModulePath)) {
  const content = fs.readFileSync(appModulePath, 'utf8');
  
  const checkImports = [
    'SignalController',
    'SignalService', 
    'RequestController',
    'RequestService',
    'Signal',
    'SSASRequest'
  ];
  
  checkImports.forEach(name => {
    if (content.includes(name)) {
      console.log(`  ✅ ${name} импортирован`);
    } else {
      console.log(`  ⚠️  ${name} НЕ импортирован`);
    }
  });
}

console.log('\n💡 РЕКОМЕНДАЦИИ:');
console.log('1. Если отсутствует SignalService - нужно его создать');
console.log('2. Если отсутствует PdfService - нужно его создать');
console.log('3. Все контроллеры должны быть добавлены в app.module.ts');
console.log('4. Все сервисы должны быть добавлены в providers в app.module.ts');