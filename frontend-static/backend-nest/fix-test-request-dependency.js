// fix-test-request-dependency.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\fix-test-request-dependency.js

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'C:\\Projects\\test-ssto-project\\backend-nest';
const appModulePath = path.join(PROJECT_ROOT, 'src', 'app.module.ts');

console.log('🔧 Исправление зависимости TestRequest...\n');

let content = fs.readFileSync(appModulePath, 'utf8');

// Находим SequelizeModule.forFeature и добавляем TestRequest
const forFeatureMatch = content.match(/SequelizeModule\.forFeature\(\[\s*([^]]*?)\s*\]\)/);

if (forFeatureMatch) {
  const currentModels = forFeatureMatch[1];
  
  // Проверяем есть ли уже TestRequest
  if (!currentModels.includes('TestRequest')) {
    // Добавляем TestRequest в список
    const newModels = currentModels.trim() + ',\n      TestRequest';
    const newForFeature = `SequelizeModule.forFeature([\n      ${newModels}\n    ])`;
    
    content = content.replace(/SequelizeModule\.forFeature\(\[[^]]*?\]\)/, newForFeature);
    
    console.log('✅ TestRequest добавлен в SequelizeModule.forFeature');
  } else {
    console.log('✅ TestRequest уже есть в SequelizeModule.forFeature');
  }
}

// Сохраняем
fs.writeFileSync(appModulePath, content, 'utf8');

console.log('\n📋 Проверка обновленного SequelizeModule.forFeature:');
const updatedContent = fs.readFileSync(appModulePath, 'utf8');
const checkForFeature = updatedContent.match(/SequelizeModule\.forFeature\(\[\s*([^]]*?)\s*\]\)/);
if (checkForFeature) {
  console.log(checkForFeature[0]);
}

console.log('\n🚀 Перезапустите backend:');
console.log('  cd C:\\Projects\\test-ssto-project\\backend-nest');
console.log('  Ctrl+C и npm run start:dev');