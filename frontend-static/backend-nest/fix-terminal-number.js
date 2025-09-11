// fix-terminal-number.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\fix-terminal-number.js

const fs = require('fs');
const path = require('path');

console.log('🔧 Исправление поля terminal_number в модели...\n');

const modelPath = path.join(__dirname, 'src/models/request.model.ts');

if (fs.existsSync(modelPath)) {
  // Читаем файл
  let content = fs.readFileSync(modelPath, 'utf8');
  
  // Создаем резервную копию
  const backupPath = modelPath + '.backup_' + Date.now();
  fs.writeFileSync(backupPath, content);
  console.log(`✅ Создана резервная копия: ${path.basename(backupPath)}`);
  
  // Ищем строку с terminal_number без @Column
  const lines = content.split('\n');
  let fixed = false;
  
  for (let i = 0; i < lines.length; i++) {
    // Если нашли terminal_number без декоратора @Column перед ним
    if (lines[i].includes('terminal_number:') && !lines[i].includes('@Column')) {
      // Проверяем, что перед этой строкой нет @Column
      if (i > 0 && !lines[i-1].includes('@Column')) {
        console.log(`📍 Найдено поле без декоратора на строке ${i+1}: ${lines[i].trim()}`);
        
        // Добавляем декоратор @Column перед полем
        const indent = lines[i].match(/^\s*/)[0]; // Сохраняем отступ
        const columnDecorator = `${indent}@Column({
${indent}  field: 'terminal_number',
${indent}  type: DataType.STRING
${indent}})`;
        
        lines[i] = columnDecorator + '\n' + lines[i];
        fixed = true;
        console.log('✅ Добавлен декоратор @Column');
        break;
      }
    }
  }
  
  if (fixed) {
    // Сохраняем исправленный файл
    content = lines.join('\n');
    fs.writeFileSync(modelPath, content);
    console.log('✅ Файл модели исправлен!');
  } else {
    console.log('⚠️  Поле terminal_number уже имеет декоратор или не найдено');
  }
  
  // Показываем исправленную часть
  console.log('\n📄 Проверка исправления:');
  const newContent = fs.readFileSync(modelPath, 'utf8');
  const newLines = newContent.split('\n');
  
  for (let i = 0; i < newLines.length; i++) {
    if (newLines[i].includes('terminal_number')) {
      // Показываем 3 строки до и 1 после
      const start = Math.max(0, i - 3);
      const end = Math.min(newLines.length, i + 2);
      
      console.log('\nКонтекст вокруг terminal_number:');
      for (let j = start; j < end; j++) {
        const marker = j === i ? ' → ' : '   ';
        console.log(`${marker}${j+1}: ${newLines[j]}`);
      }
      break;
    }
  }
  
} else {
  console.log('❌ Файл модели не найден!');
}

console.log('\n🚀 Следующие шаги:');
console.log('1. Перезапустите backend:');
console.log('   Ctrl+C (остановить)');
console.log('   npm run start:dev (запустить)');
console.log('2. Обновите страницу браузера');
console.log('3. Проверьте http://localhost:3001/requests');