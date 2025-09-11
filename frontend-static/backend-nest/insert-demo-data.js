// C:\Projects\test-ssto-project\backend-nest\insert-demo-data-fixed.js
// Скрипт для вставки демонстрационных данных в БД

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Подключение к БД
const dbPath = path.join(__dirname, 'ssto.db');
const db = new sqlite3.Database(dbPath);

console.log('📝 Вставка демонстрационных заявок...');

// Демо-данные с правильными полями
const demoRequests = [
  {
    request_id: 'REQ-2025-001',
    vessel_name: 'Капитан Крузенштерн',
    mmsi: '273456000',
    ssas_number: 'SSAS-001',
    owner_organization: 'Дальневосточное морское пароходство',
    contact_person: 'Иванов И.И.',
    contact_phone: '+7 (423) 222-33-44',
    email: 'ivanov@fesco.ru',
    test_date: '2025-01-20',
    start_time: '10:00',
    end_time: '11:00',
    notes: 'Плановая проверка ССТО',
    status: 'PENDING'
  },
  {
    request_id: 'REQ-2025-002', 
    vessel_name: 'Адмирал Макаров',
    mmsi: '273456100',
    ssas_number: 'SSAS-002',
    owner_organization: 'Совкомфлот',
    contact_person: 'Петров П.П.',
    contact_phone: '+7 (495) 660-40-00',
    email: 'petrov@scf-group.ru',
    test_date: '2025-01-21',
    start_time: '14:00',
    end_time: '15:00',
    notes: 'Подготовка к рейсу',
    status: 'PENDING'
  },
  {
    request_id: 'REQ-2025-003',
    vessel_name: 'Находка',
    mmsi: '273456200',
    ssas_number: 'SSAS-003',
    owner_organization: 'Приморское морское пароходство',
    contact_person: 'Сидоров С.С.',
    contact_phone: '+7 (423) 249-90-00',
    email: 'sidorov@prisco.ru',
    test_date: '2025-01-22',
    start_time: '09:00',
    end_time: '10:00',
    notes: 'Внеплановая проверка после ремонта',
    status: 'COMPLETED',
    signal_received_time: '09:15:30',
    signal_coordinates: '42.7339° N, 132.8735° E',
    signal_strength: 'Хороший'
  },
  {
    request_id: 'REQ-2025-004',
    vessel_name: 'С