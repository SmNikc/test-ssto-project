// backend-nest/test-email-full.js
// Полное тестирование EmailService и парсинга дат

const http = require('http');

console.log('\n   📧 ПОЛНОЕ ТЕСТИРОВАНИЕ EMAIL И СИГНАЛОВ\n');
console.log('='.repeat(60));

// Конфигурация
const API_BASE = 'http://localhost:3001';

// Функция для парсинга русских дат
function parseRussianDate(dateStr) {
  const months = {
    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
    'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
    'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
  };

  // Паттерн: "4 сентября 2025 г. 12:30:45"
  const pattern = /(\d{1,2})\s+([а-я]+)\s+(\d{4})\s+г\.\s+(\d{1,2}):(\d{2}):(\d{2})/i;
  const match = dateStr.match(pattern);
  
  if (match) {
    const [, day, monthStr, year, hours, minutes, seconds] = match;
    const month = months[monthStr.toLowerCase()];
    
    if (month !== undefined) {
      return new Date(
        parseInt(year),
        month,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );
    }
  }
  
  return null;
}

// HTTP запрос
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          data: data,
          headers: res.headers 
        });
      });
    });
    
    req.on('error', reject);
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Основные тесты
async function runTests() {
  console.log('🧪 Тестирование EmailService...');
  
  // 1. Проверка сервера
  console.log('\n1️⃣  Проверка сервера...');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    });
    
    if (result.status === 200 || result.status === 404) {
      console.log('✅ Backend доступен на порту 3001');
    } else {
      console.log(`⚠️ Backend ответил кодом: ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Ошибка тестирования:', error.message);
    console.log('\n⚠️ Убедитесь что:');
    console.log('   1. Backend запущен (npm run start:dev)');
    console.log('   2. База данных доступна');
    console.log('   3. Email настроен в .env файле');
    return;
  }

  // 2. Тест парсинга дат
  console.log('\n📅 Тест парсинга русских дат:');
  const testDates = [
    "1 сентября 2025 г. 5:46:51",
    "15 января 2025 г. 14:30:00",
    "31 декабря 2024 г. 23:59:59",
    "4 сентября 2025 г. 12:30:45"
  ];

  testDates.forEach(dateStr => {
    const parsed = parseRussianDate(dateStr);
    if (parsed) {
      console.log(`   "${dateStr}" -> ✅ ${parsed.toLocaleString('ru-RU')}`);
    } else {
      console.log(`   "${dateStr}" -> ❌ НЕ РАСПОЗНАНО`);
    }
  });
  console.log('   ℹ️ EmailService имеет специальный парсер для русских дат');

  // 3. Тест отправки email
  console.log('\n2️⃣  Тест отправки email...');
  try {
    const emailData = JSON.stringify({
      to: 'test@example.com',
      subject: 'Тест системы ССТО',
      text: 'Это тестовое сообщение',
      html: '<h1>Тест</h1><p>Это тестовое сообщение</p>'
    });

    const result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/email/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(emailData)
      }
    }, emailData);

    if (result.status === 200 || result.status === 201) {
      console.log('✅ Email endpoint работает');
      try {
        const response = JSON.parse(result.data);
        console.log('   Ответ:', response);
      } catch {
        console.log('   Ответ:', result.data);
      }
    } else if (result.status === 404) {
      console.log('❌ Email endpoint не найден (/api/email/send)');
      console.log('   Проверьте что EmailModule добавлен в app.module.ts');
    } else {
      console.log(`❌ Ошибка: статус ${result.status}`);
      console.log('   Ответ:', result.data);
    }
  } catch (error) {
    console.log('❌ Ошибка отправки:', error.message);
  }

  // 4. Тест проверки входящих писем
  console.log('\n3️⃣  Тест проверки входящих email...');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/email/check',
      method: 'GET'
    });

    if (result.status === 200) {
      console.log('✅ Проверка входящих работает');
      const data = JSON.parse(result.data);
      console.log(`   Заявок: ${data.requests?.length || 0}`);
      console.log(`   Сигналов: ${data.signals?.length || 0}`);
      console.log(`   Нераспознанных: ${data.unrecognized?.length || 0}`);
    } else if (result.status === 404) {
      console.log('❌ Endpoint /api/email/check не найден');
    } else {
      console.log(`⚠️ Статус: ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Ошибка проверки:', error.message);
  }

  // 5. Тест парсинга заявки
  console.log('\n4️⃣  Тест парсинга заявки из email...');
  const testEmailContent = `
    Заявка на тестирование ССТО
    Судно: Капитан Иванов
    MMSI: 273456789
    Номер стойки: INM-C-123456
    Дата теста: 10 сентября 2025 г.
    Контакт: Петров И.С.
    Телефон: +7 (924) 123-45-67
    Email: petrov@shipping.ru
  `;

  try {
    const parseData = JSON.stringify({
      subject: 'Заявка на тест ССТО',
      from: 'petrov@shipping.ru',
      text: testEmailContent
    });

    const result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/email/parse',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(parseData)
      }
    }, parseData);

    if (result.status === 200) {
      console.log('✅ Парсинг работает');
      const parsed = JSON.parse(result.data);
      console.log('   Извлеченные данные:');
      console.log(`   - Судно: ${parsed.vessel || 'не найдено'}`);
      console.log(`   - MMSI: ${parsed.mmsi || 'не найден'}`);
      console.log(`   - Терминал: ${parsed.terminal || 'не найден'}`);
    } else if (result.status === 404) {
      console.log('⚠️ Endpoint /api/email/parse не найден');
    }
  } catch (error) {
    console.log('❌ Ошибка парсинга:', error.message);
  }

  // Итоги
  console.log('\n' + '='.repeat(60));
  console.log('📊 ИТОГИ ТЕСТИРОВАНИЯ:\n');
  console.log('💡 Проверьте настройки SMTP в .env:');
  console.log('   SMTP_HOST=smtp.gmail.com');
  console.log('   SMTP_PORT=587');
  console.log('   SMTP_USER=your-email@gmail.com');
  console.log('   SMTP_PASS=your-app-password');
  
  console.log('\n💡 Для Gmail:');
  console.log('   1. Включите 2FA в аккаунте Google');
  console.log('   2. Создайте пароль приложения');
  console.log('   3. Используйте этот пароль в SMTP_PASS');
  
  console.log('\n✅ Тестирование завершено!\n');
}

// Запуск тестов
runTests().catch(console.error);