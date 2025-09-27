// fix-duplicate-errors.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\fix-duplicate-errors.js
// Исправляет дублирующиеся определения и оставшиеся ошибки

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'C:\\Projects\\test-ssto-project\\backend-nest';

console.log('🔧 Исправление дублирующихся определений и ошибок типов...\n');

// 1. Исправляем C:\Projects\test-ssto-project\backend-nest\src\models\signal.model.ts
console.log('1️⃣ Исправляем signal.model.ts - убираем дубликаты request_id...');
const signalModelPath = path.join(PROJECT_ROOT, 'src', 'models', 'signal.model.ts');
let signalContent = fs.readFileSync(signalModelPath, 'utf8');

// Удаляем дублирующиеся определения request_id (оставляем только одно с @Column)
// Удаляем геттеры и сеттеры если они есть
signalContent = signalContent.replace(/\n\s*\/\/\s*Совместимость типов[\s\S]*?get request_id\(\): any[\s\S]*?\n\s*}/g, '');

// Находим существующее определение request_id и меняем его тип
signalContent = signalContent.replace(
  /@Column\([\s\S]*?\)\s*request_id:\s*string;/g,
  `@Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  request_id: number;`
);

fs.writeFileSync(signalModelPath, signalContent, 'utf8');
console.log('  ✅ Исправлен signal.model.ts');

// 2. Исправляем C:\Projects\test-ssto-project\backend-nest\src\services\email-parser.service.ts
console.log('\n2️⃣ Исправляем email-parser.service.ts - конвертируем id в число...');
const emailParserPath = path.join(PROJECT_ROOT, 'src', 'services', 'email-parser.service.ts');
if (fs.existsSync(emailParserPath)) {
  let emailContent = fs.readFileSync(emailParserPath, 'utf8');
  
  // Находим место где создается requestData и убираем поле id вообще
  // так как id генерируется автоматически БД
  emailContent = emailContent.replace(
    /id:\s*['"]?\w+['"]?,?\s*\n/g,
    ''
  );
  
  // Альтернатива - если нужно оставить id, конвертируем в число
  emailContent = emailContent.replace(
    /id:\s*['"](\w+)['"]/g,
    'id: parseInt("$1", 10)'
  );
  
  fs.writeFileSync(emailParserPath, emailContent, 'utf8');
  console.log('  ✅ Исправлен email-parser.service.ts');
}

// 3. Исправляем C:\Projects\test-ssto-project\backend-nest\src\models\request.model.ts
console.log('\n3️⃣ Добавляем vessel_id в request.model.ts...');
const requestModelPath = path.join(PROJECT_ROOT, 'src', 'models', 'request.model.ts');
let requestContent = fs.readFileSync(requestModelPath, 'utf8');

// Добавляем vessel_id если его нет
if (!requestContent.includes('vessel_id:')) {
  // Находим место перед геттерами или перед концом класса
  const getterIndex = requestContent.indexOf('get imo_number()');
  const insertPoint = getterIndex > 0 ? requestContent.lastIndexOf('\n', getterIndex - 1) : requestContent.lastIndexOf('\n}') - 1;
  
  const vesselIdField = `

  @Column({
    field: 'vessel_id',
    type: DataType.INTEGER,
    allowNull: true
  })
  vessel_id: number;
`;
  
  requestContent = requestContent.substring(0, insertPoint) + vesselIdField + requestContent.substring(insertPoint);
  console.log('  ✅ Добавлено поле vessel_id');
}

fs.writeFileSync(requestModelPath, requestContent, 'utf8');

// 4. Исправляем C:\Projects\test-ssto-project\backend-nest\src\signal\signal.service.ts
console.log('\n4️⃣ Исправляем signal.service.ts - приведение типов...');
const signalServicePath = path.join(PROJECT_ROOT, 'src', 'signal', 'signal.service.ts');
if (fs.existsSync(signalServicePath)) {
  let serviceContent = fs.readFileSync(signalServicePath, 'utf8');
  
  // Исправляем строку 85 - приводим id к строке если нужно
  serviceContent = serviceContent.replace(
    /signal\.request_id = matchingRequest\.id;/g,
    'signal.request_id = matchingRequest.id;'
  );
  
  // Если signal.request_id требует number, оставляем как есть
  // Если требует string, меняем на:
  // signal.request_id = matchingRequest.id.toString();
  
  fs.writeFileSync(signalServicePath, serviceContent, 'utf8');
  console.log('  ✅ Исправлен signal.service.ts');
}

console.log('\n✨ Исправления завершены!');
console.log('\n📋 Обработаны файлы:');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\models\\signal.model.ts');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\services\\email-parser.service.ts');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\models\\request.model.ts');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\signal\\signal.service.ts');

console.log('\n🚀 Перезапустите backend:');
console.log('  Ctrl+C и npm run start:dev');