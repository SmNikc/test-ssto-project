// test-api.js - Тестирование CRUD операций Day 2
const http = require('http');

const API_URL = 'http://localhost:3000';

// Проверка здоровья сервера
function checkHealth() {
    return new Promise((resolve) => {
        http.get(`${API_URL}/health`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Сервер работает:', data);
                    resolve(true);
                } else {
                    console.log('❌ Сервер недоступен');
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.log('❌ Ошибка подключения:', err.message);
            resolve(false);
        });
    });
}

// Создание тестовой заявки
function createTestRequest() {
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            vesselName: 'Test Vessel Day 2',
            requesterName: 'Test User',
            requesterEmail: 'test@example.com',
            testDate: '2025-01-20',
            testType: 'combined'
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/requests',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 201 || res.statusCode === 200) {
                    console.log('✅ Заявка создана:', data);
                    resolve(true);
                } else {
                    console.log('❌ Ошибка создания заявки:', res.statusCode, data);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.log('❌ Ошибка запроса:', err.message);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Тестирование Day 2 API...\n');
    
    const healthOk = await checkHealth();
    if (!healthOk) {
        console.log('\n⚠️ Сервер не запущен. Запустите: npm run start:dev');
        process.exit(1);
    }

    const requestCreated = await createTestRequest();
    
    if (requestCreated) {
        console.log('\n✨ Все тесты пройдены успешно!');
    } else {
        console.log('\n⚠️ Некоторые тесты не прошли. Проверьте файлы.');
    }
}

runTests();