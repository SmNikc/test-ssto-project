// fix-signal-model-fields.js
// Сохраните в C:\Projects\test-ssto-project\backend-nest\fix-signal-model-fields.js
// Добавляет ВСЕ недостающие поля в модель Signal

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'C:\\Projects\\test-ssto-project\\backend-nest';

console.log('🔧 Добавление недостающих полей в модель Signal...\n');

// 1. Исправляем C:\Projects\test-ssto-project\backend-nest\src\models\signal.model.ts
console.log('1️⃣ Обновляем signal.model.ts с полным набором полей...');
const signalModelPath = path.join(PROJECT_ROOT, 'src', 'models', 'signal.model.ts');

// Полная правильная модель Signal со всеми полями
const signalModelContent = `import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'signals',
  timestamps: true,
  underscored: true
})
export default class Signal extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  terminal_number: string;

  @Column({
    type: DataType.STRING(9),
    allowNull: false
  })
  mmsi: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true
  })
  call_sign: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'TEST'
  })
  signal_type: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW
  })
  received_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  detection_time: Date;

  @Column({
    type: DataType.STRING,
    defaultValue: 'UNMATCHED'
  })
  status: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  request_id: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  coordinates: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  metadata: any;

  @Column({
    type: DataType.DATE
  })
  created_at: Date;

  @Column({
    type: DataType.DATE
  })
  updated_at: Date;
}

export { Signal };`;

fs.writeFileSync(signalModelPath, signalModelContent, 'utf8');
console.log('  ✅ Signal модель обновлена со всеми полями');

// 2. Исправляем C:\Projects\test-ssto-project\backend-nest\src\services\email-parser.service.ts
console.log('\n2️⃣ Исправляем email-parser.service.ts - удаляем id из requestData...');
const emailParserPath = path.join(PROJECT_ROOT, 'src', 'services', 'email-parser.service.ts');
if (fs.existsSync(emailParserPath)) {
  let emailContent = fs.readFileSync(emailParserPath, 'utf8');
  
  // Находим строку 78 и область вокруг неё где создается requestData
  // Удаляем поле id из объекта requestData перед вызовом create
  const lines = emailContent.split('\n');
  
  // Ищем строку с requestService.create
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('requestService.create(requestData)')) {
      // Ищем назад где определяется requestData
      for (let j = i - 1; j >= Math.max(0, i - 30); j--) {
        if (lines[j].includes('const requestData') || lines[j].includes('let requestData')) {
          // Нашли начало объекта, теперь ищем поле id
          for (let k = j; k < i; k++) {
            if (lines[k].match(/^\s*id:\s*['"]?\w+['"]?,?\s*$/)) {
              // Удаляем строку с id
              lines[k] = '      // id удален - генерируется автоматически';
              break;
            }
          }
          break;
        }
      }
      break;
    }
  }
  
  emailContent = lines.join('\n');
  fs.writeFileSync(emailParserPath, emailContent, 'utf8');
  console.log('  ✅ Исправлен email-parser.service.ts');
}

// 3. Исправляем C:\Projects\test-ssto-project\backend-nest\src\signal\signal.service.ts
console.log('\n3️⃣ Исправляем signal.service.ts - убираем terminal_number из create...');
const signalServicePath = path.join(PROJECT_ROOT, 'src', 'signal', 'signal.service.ts');
if (fs.existsSync(signalServicePath)) {
  let serviceContent = fs.readFileSync(signalServicePath, 'utf8');
  
  // Заменяем строку 120 где terminal_number передается неправильно
  serviceContent = serviceContent.replace(
    /terminal_number: signalData\.terminal_number \|\| signalData\.terminalNumber,/g,
    '// terminal_number обрабатывается автоматически'
  );
  
  fs.writeFileSync(signalServicePath, serviceContent, 'utf8');
  console.log('  ✅ Исправлен signal.service.ts');
}

// 4. Создаем миграцию для БД чтобы добавить недостающие колонки
console.log('\n4️⃣ Создаем скрипт для обновления БД...');
const migrationScript = `-- Добавление недостающих колонок в таблицу signals
-- Выполните эти команды в PostgreSQL

ALTER TABLE signals ADD COLUMN IF NOT EXISTS detection_time TIMESTAMP;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'UNMATCHED';
ALTER TABLE signals ADD COLUMN IF NOT EXISTS mmsi VARCHAR(9);
ALTER TABLE signals ADD COLUMN IF NOT EXISTS call_sign VARCHAR(20);
ALTER TABLE signals ADD COLUMN IF NOT EXISTS coordinates JSONB;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS metadata JSONB;
`;

const migrationPath = path.join(PROJECT_ROOT, 'add-signal-columns.sql');
fs.writeFileSync(migrationPath, migrationScript, 'utf8');
console.log('  ✅ Создан скрипт add-signal-columns.sql');

console.log('\n✨ Исправления завершены!');
console.log('\n📋 Обновлены файлы:');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\models\\signal.model.ts');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\services\\email-parser.service.ts');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\src\\signal\\signal.service.ts');
console.log('  • C:\\Projects\\test-ssto-project\\backend-nest\\add-signal-columns.sql');

console.log('\n⚠️  ВАЖНО: Выполните SQL команды для обновления БД:');
console.log('  psql -U ssto -d sstodb -f add-signal-columns.sql');
console.log('\n  Или выполните их вручную в pgAdmin/DBeaver');

console.log('\n🚀 После обновления БД перезапустите backend:');
console.log('  Ctrl+C и npm run start:dev');