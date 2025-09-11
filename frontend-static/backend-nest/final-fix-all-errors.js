// final-fix-all-errors.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\final-fix-all-errors.js
// Исправляет ВСЕ ошибки компиляции с использованием ПОЛНЫХ путей

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'C:\\Projects\\test-ssto-project\\backend-nest';

console.log('🔧 Финальное исправление всех ошибок компиляции...\n');
console.log(`📁 Рабочая папка: ${PROJECT_ROOT}\n`);

// 1. Исправляем C:\Projects\test-ssto-project\backend-nest\src\app.module.ts
console.log('1️⃣ Исправляем app.module.ts...');
const appModulePath = path.join(PROJECT_ROOT, 'src', 'app.module.ts');
let appContent = fs.readFileSync(appModulePath, 'utf8');

// Добавляем импорт Vessel если его нет
if (!appContent.includes("from './models/vessel.model'")) {
  const lastModelImport = appContent.lastIndexOf("from './models/");
  const endOfLine = appContent.indexOf('\n', lastModelImport);
  appContent = appContent.substring(0, endOfLine + 1) + 
    "import Vessel from './models/vessel.model';\n" + 
    appContent.substring(endOfLine + 1);
  console.log('  ✅ Добавлен импорт Vessel');
}

// Добавляем Vessel в массив models
if (!appContent.match(/models:\s*\[[^\]]*Vessel/)) {
  appContent = appContent.replace(
    /(models:\s*\[[^\]]+)(]\s*,)/,
    '$1, Vessel$2'
  );
  console.log('  ✅ Vessel добавлен в models');
}

// Добавляем Vessel в SequelizeModule.forFeature
if (!appContent.match(/SequelizeModule\.forFeature\(\[[^\]]*Vessel/)) {
  appContent = appContent.replace(
    /(SequelizeModule\.forFeature\(\[[^\]]+)(]\s*\))/,
    '$1, Vessel$2'
  );
  console.log('  ✅ Vessel добавлен в forFeature');
}

fs.writeFileSync(appModulePath, appContent, 'utf8');

// 2. Исправляем C:\Projects\test-ssto-project\backend-nest\src\models\request.model.ts
console.log('\n2️⃣ Исправляем request.model.ts...');
const requestModelPath = path.join(PROJECT_ROOT, 'src', 'models', 'request.model.ts');
let requestContent = fs.readFileSync(requestModelPath, 'utf8');

// Добавляем поле signal_id если его нет
if (!requestContent.includes('signal_id:')) {
  const classEnd = requestContent.lastIndexOf('}');
  const insertPoint = requestContent.lastIndexOf('\n', classEnd - 1);
  
  const signalIdField = `

  @Column({
    field: 'signal_id',
    type: DataType.INTEGER,
    allowNull: true
  })
  signal_id: number;
`;
  
  requestContent = requestContent.substring(0, insertPoint) + signalIdField + requestContent.substring(insertPoint);
  console.log('  ✅ Добавлено поле signal_id');
}

// Добавляем геттеры для совместимости
if (!requestContent.includes('get imo_number()')) {
  const classEnd = requestContent.lastIndexOf('}');
  const insertPoint = requestContent.lastIndexOf('\n', classEnd - 1);
  
  const getters = `

  // Геттеры для совместимости с разными названиями полей
  get imo_number(): string {
    return this.imo || '';
  }

  get planned_test_date(): Date {
    return this.test_date;
  }
`;
  
  requestContent = requestContent.substring(0, insertPoint) + getters + requestContent.substring(insertPoint);
  console.log('  ✅ Добавлены геттеры для совместимости');
}

fs.writeFileSync(requestModelPath, requestContent, 'utf8');

// 3. Исправляем C:\Projects\test-ssto-project\backend-nest\src\signal\signal.service.ts
console.log('\n3️⃣ Исправляем signal.service.ts...');
const signalServicePath = path.join(PROJECT_ROOT, 'src', 'signal', 'signal.service.ts');
if (fs.existsSync(signalServicePath)) {
  let signalContent = fs.readFileSync(signalServicePath, 'utf8');
  
  // Добавляем импорт Vessel
  if (!signalContent.includes('import Vessel')) {
    const lastImport = signalContent.lastIndexOf('import');
    const endOfLine = signalContent.indexOf('\n', lastImport);
    signalContent = signalContent.substring(0, endOfLine + 1) + 
      "import Vessel from '../models/vessel.model';\n" + 
      signalContent.substring(endOfLine + 1);
    console.log('  ✅ Добавлен импорт Vessel');
  }
  
  // Добавляем инъекцию Vessel в конструктор
  if (!signalContent.includes('@InjectModel(Vessel)')) {
    signalContent = signalContent.replace(
      /constructor\s*\(([^)]+)\)\s*{/,
      `constructor(
    $1,
    @InjectModel(Vessel) private vesselModel: typeof Vessel
  ) {`
    );
    console.log('  ✅ Добавлена инъекция Vessel');
  }
  
  fs.writeFileSync(signalServicePath, signalContent, 'utf8');
}

// 4. Исправляем C:\Projects\test-ssto-project\backend-nest\src\controllers\confirmation.controller.ts
console.log('\n4️⃣ Исправляем confirmation.controller.ts...');
const confirmationPath = path.join(PROJECT_ROOT, 'src', 'controllers', 'confirmation.controller.ts');
if (fs.existsSync(confirmationPath)) {
  let confirmContent = fs.readFileSync(confirmationPath, 'utf8');
  
  // Исправляем вызов sendConfirmation - преобразуем number в string
  confirmContent = confirmContent.replace(
    /await this\.sendConfirmation\(request\.id,/g,
    'await this.sendConfirmation(request.id.toString(),'
  );
  
  fs.writeFileSync(confirmationPath, confirmContent, 'utf8');
  console.log('  ✅ Исправлены типы в confirmation.controller.ts');
}

// 5. Исправляем C:\Projects\test-ssto-project\backend-nest\src\services\email-parser.service.ts
console.log('\n5️⃣ Исправляем email-parser.service.ts...');
const emailParserPath = path.join(PROJECT_ROOT, 'src', 'services', 'email-parser.service.ts');
if (fs.existsSync(emailParserPath)) {
  let emailContent = fs.readFileSync(emailParserPath, 'utf8');
  
  // Исправляем тип id при создании request
  emailContent = emailContent.replace(
    /id:\s*['"]([^'"]+)['"]/g,
    "id: parseInt('$1')"
  );
  
  fs.writeFileSync(emailParserPath, emailContent, 'utf8');
  console.log('  ✅ Исправлены типы в email-parser.service.ts');
}

// 6. Исправляем C:\Projects\test-ssto-project\backend-nest\src\models\signal.model.ts
console.log('\n6️⃣ Исправляем signal.model.ts...');
const signalModelPath = path.join(PROJECT_ROOT, 'src', 'models', 'signal.model.ts');
if (fs.existsSync(signalModelPath)) {
  let signalModelContent = fs.readFileSync(signalModelPath, 'utf8');
  
  // Меняем тип request_id чтобы принимал и string и number
  signalModelContent = signalModelContent.replace(
    /request_id:\s*number;/g,
    'request_id: string | number;'
  );
  
  // Если request_id определен как INTEGER, добавляем геттер/сеттер для совместимости
  if (!signalModelContent.includes('get request_id_string()')) {
    const classEnd = signalModelContent.lastIndexOf('}');
    const insertPoint = signalModelContent.lastIndexOf('\n', classEnd - 1);
    
    const compatibility = `

  // Совместимость типов для request_id
  set request_id(value: string | number) {
    this.setDataValue('request_id', typeof value === 'string' ? parseInt(value) : value);
  }

  get request_id(): any {
    return this.getDataValue('request_id');
  }
`;
    
    signalModelContent = signalModelContent.substring(0, insertPoint) + compatibility + signalModelContent.substring(insertPoint);
  }
  
  fs.writeFileSync(signalModelPath, signalModelContent, 'utf8');
  console.log('  ✅ Исправлены типы в signal.model.ts');
}

console.log('\n✨ Все исправления завершены!');
console.log('\n📋 Исправлены файлы:');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\app.module.ts');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\models\\request.model.ts');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\signal\\signal.service.ts');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\controllers\\confirmation.controller.ts');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\services\\email-parser.service.ts');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\models\\signal.model.ts');

console.log('\n🚀 Теперь перезапустите backend:');
console.log('  1. Ctrl+C (остановить)');
console.log('  2. npm run start:dev');