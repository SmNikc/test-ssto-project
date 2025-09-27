// check-request-model.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\check-request-model.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Анализ модели Request...\n');

// Пути к файлам моделей
const modelPaths = [
  'src/models/request.model.ts',
  'src/models/request.ts',
  'src/entities/request.entity.ts',
  'src/entities/ssas-request.entity.ts'
];

// Ищем файл модели
let modelFile = null;
for (const modelPath of modelPaths) {
  const fullPath = path.join(__dirname, modelPath);
  if (fs.existsSync(fullPath)) {
    modelFile = fullPath;
    console.log(`✅ Найден файл модели: ${modelPath}`);
    break;
  }
}

if (modelFile) {
  const content = fs.readFileSync(modelFile, 'utf8');
  
  // Ищем поля с @Column
  console.log('\n📋 Поля модели Request:');
  const columnMatches = content.match(/@Column[^}]*}/g) || [];
  columnMatches.forEach(match => {
    const fieldName = match.match(/(\w+)(?:\?)?:/);
    if (fieldName) {
      console.log(`  - ${fieldName[1]}`);
    }
  });
  
  // Проверяем наличие terminal_number
  if (content.includes('terminal_number')) {
    console.log('\n✅ Поле terminal_number найдено в модели');
  } else {
    console.log('\n⚠️  Поле terminal_number НЕ найдено в модели!');
  }
  
  // Сохраняем полное содержимое для анализа
  console.log('\n📄 Содержимое модели (первые 100 строк):');
  const lines = content.split('\n').slice(0, 100);
  lines.forEach((line, index) => {
    if (line.includes('@Column') || line.includes('terminal_number') || line.includes('class')) {
      console.log(`${index + 1}: ${line}`);
    }
  });
  
} else {
  console.log('❌ Файл модели не найден!');
  console.log('\n🔍 Проверяем структуру проекта:');
  
  const srcPath = path.join(__dirname, 'src');
  if (fs.existsSync(srcPath)) {
    const dirs = fs.readdirSync(srcPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log('Папки в src:');
    dirs.forEach(dir => console.log(`  - ${dir}/`));
    
    // Проверяем файлы в каждой папке
    dirs.forEach(dir => {
      const dirPath = path.join(srcPath, dir);
      const files = fs.readdirSync(dirPath)
        .filter(file => file.includes('request'));
      
      if (files.length > 0) {
        console.log(`\nФайлы с 'request' в ${dir}/:`)
        files.forEach(file => console.log(`  - ${file}`));
      }
    });
  }
}

console.log('\n💡 РЕШЕНИЕ:');
console.log('Если terminal_number отсутствует в модели, нужно:');
console.log('1. Добавить поле в модель Request');
console.log('2. Или удалить это поле из запроса в контроллере');
console.log('3. Перезапустить backend после изменений');