// fix-email-parser-id.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\fix-email-parser-id.js
// Окончательно исправляет проблему с полем id в email-parser.service.ts

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'C:\\Projects\\test-ssto-project\\backend-nest';
const emailParserPath = path.join(PROJECT_ROOT, 'src', 'services', 'email-parser.service.ts');

console.log('🔧 Исправление поля id в email-parser.service.ts...\n');

if (fs.existsSync(emailParserPath)) {
  let content = fs.readFileSync(emailParserPath, 'utf8');
  
  // Создаем резервную копию
  const backupPath = emailParserPath + '.backup_' + Date.now();
  fs.writeFileSync(backupPath, content, 'utf8');
  console.log(`📄 Резервная копия: ${path.basename(backupPath)}`);
  
  // Находим строку где создается requestData и удаляем поле id
  // Ищем паттерн где requestData определяется
  const requestDataPattern = /const\s+requestData\s*=\s*{([^}]+)}/s;
  const match = content.match(requestDataPattern);
  
  if (match) {
    let objectContent = match[1];
    
    // Удаляем строку с id
    objectContent = objectContent.replace(/^\s*id:\s*['"]?\w+['"]?,?\s*$/m, '');
    
    // Если id все еще есть в другом формате, удаляем его
    objectContent = objectContent.replace(/,?\s*id:\s*['"]?\w+['"]?\s*,?/g, ',');
    
    // Убираем двойные запятые если появились
    objectContent = objectContent.replace(/,\s*,/g, ',');
    
    // Собираем обратно
    const newRequestData = `const requestData = {${objectContent}}`;
    content = content.replace(requestDataPattern, newRequestData);
    
    console.log('✅ Поле id удалено из requestData');
  }
  
  // Альтернативный подход - если структура другая
  // Просто закомментируем строку с id
  const lines = content.split('\n');
  let modified = false;
  
  for (let i = 0; i < lines.length; i++) {
    // Ищем строку около строки 78 где ошибка
    if (i >= 70 && i <= 85) {
      if (lines[i].match(/^\s*id:\s*['"]?\w+['"]?,?\s*$/)) {
        lines[i] = '      // id: автогенерируется БД,';
        modified = true;
        console.log(`✅ Закомментирована строка ${i + 1}: id`);
      }
    }
  }
  
  if (modified) {
    content = lines.join('\n');
  }
  
  // Сохраняем исправленный файл
  fs.writeFileSync(emailParserPath, content, 'utf8');
  
  console.log('\n📄 Файл C:\\Projects\\test-ssto-project\\backend-nest\\src\\services\\email-parser.service.ts исправлен');
  
  // Показываем область вокруг строки 78 для проверки
  const finalLines = content.split('\n');
  console.log('\n📋 Проверка области вокруг строки 78:');
  for (let i = 74; i <= 80 && i < finalLines.length; i++) {
    const marker = i === 77 ? ' → ' : '   ';
    console.log(`${marker}${i + 1}: ${finalLines[i].substring(0, 80)}`);
  }
  
} else {
  console.error('❌ Файл не найден:', emailParserPath);
}

console.log('\n✨ Исправление завершено!');
console.log('\n🚀 Перезапустите backend:');
console.log('  Ctrl+C и npm run start:dev');