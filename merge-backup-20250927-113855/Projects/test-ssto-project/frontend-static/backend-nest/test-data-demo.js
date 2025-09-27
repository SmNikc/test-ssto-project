// test-demo-data.js
// Полный набор тестовых данных для демонстрации

// ================== 6 ЗАЯВОК ЧЕРЕЗ ФОРМУ ==================
const formRequests = [
  {
    vessel_name: "Капитан Крузенштерн",
    mmsi: "273456789",
    imo: "9156789",
    terminal_id: "432198765",
    terminal_type: "INMARSAT",
    contact_person: "Иванов Петр Сергеевич",
    contact_email: "ivanov@shipping.ru",
    contact_phone: "+7 (924) 123-45-67",
    test_date: "2025-01-16T10:00:00",
    organization: "ООО Дальневосточное морское пароходство",
    notes: "Плановое тестирование ССТО перед рейсом в Японию"
  },
  {
    vessel_name: "Адмирал Макаров",
    mmsi: "273567890",
    imo: "9267890",
    terminal_id: "432287654",
    terminal_type: "INMARSAT",
    contact_person: "Сидоров Александр Викторович",
    contact_email: "sidorov@fareast.ru",
    contact_phone: "+7 (914) 234-56-78",
    test_date: "2025-01-16T14:00:00",
    organization: "АО Тихоокеанская судоходная компания",
    notes: "Ежегодная проверка системы ССТО"
  },
  {
    vessel_name: "Находка",
    mmsi: "273678901",
    imo: "9378901",
    terminal_id: "432376543",
    terminal_type: "IRIDIUM",
    contact_person: "Козлов Михаил Дмитриевич",
    contact_email: "kozlov@nakhodka-port.ru",
    contact_phone: "+7 (904) 345-67-89",
    test_date: "2025-01-17T09:00:00",
    organization: "Находкинский морской торговый порт",
    notes: "Проверка после ремонта оборудования"
  },
  {
    vessel_name: "Владивосток",
    mmsi: "273789012",
    imo: "9489012",
    terminal_id: "432465432",
    terminal_type: "INMARSAT",
    contact_person: "Морозов Андрей Иванович",
    contact_email: "morozov@vladport.ru",
    contact_phone: "+7 (984) 456-78-90",
    test_date: "2025-01-17T11:00:00",
    organization: "Владивостокский морской торговый порт",
    notes: "Проверка перед началом навигации"
  },
  {
    vessel_name: "Приморье",
    mmsi: "273890123",
    imo: "9590123",
    terminal_id: "432554321",
    terminal_type: "INMARSAT",
    contact_person: "Николаев Сергей Павлович",
    contact_email: "nikolaev@primorship.ru",
    contact_phone: "+7 (924) 567-89-01",
    test_date: "2025-01-17T15:00:00",
    organization: "Приморское морское пароходство",
    notes: "Квартальное тестирование"
  },
  {
    vessel_name: "Сахалин",
    mmsi: "273901234",
    imo: "9601234",
    terminal_id: "432643210",
    terminal_type: "IRIDIUM",
    contact_person: "Петров Владимир Олегович",
    contact_email: "petrov@sakhalin-shipping.ru",
    contact_phone: "+7 (914) 678-90-12",
    test_date: "2025-01-18T10:00:00",
    organization: "Сахалинское морское пароходство",
    notes: "Тестирование новой стойки ССТО"
  }
];

// ================== 4 ЗАЯВКИ ЧЕРЕЗ EMAIL ==================
const emailRequests = [
  {
    from: "NNSMETANIN@GMAIL.COM",
    to: "od_smrcc@morflot.ru",
    subject: "Заявка на тестирование ССТО - т/х Амур",
    body: `Добрый день!

Прошу провести тестирование системы ССТО на судне.

Данные судна:
Название: т/х Амур
MMSI: 273111222
IMO: 9711222
Номер стойки ССТО: 432732109

Планируемая дата тестирования: 20 января 2025 г. в 10:00 по местному времени.

Контактное лицо: Капитан Семенов В.И.
Телефон: +7 (924) 111-22-33
Email: semenov@amur-shipping.ru

С уважением,
Н.Н. Сметанин
Старший помощник капитана`
  },
  {
    from: "SMENANINNN@HOTMAIL.COM",
    to: "od_smrcc@morflot.ru",
    subject: "Тест ССТО судна Восток",
    body: `Уважаемые коллеги!

Направляю заявку на проведение теста охранной системы.

Судно "Восток"
MMSI: 273222333
Терминал ИНМАРСАТ: 432821098
IMO номер: 9722333

Дата проверки: 21.01.2025
Время: 14:30 МСК

Ответственный: Старпом Иванов А.А.
Тел: 8-914-222-33-44

Организация: ООО "Восточное пароходство"`
  },
  {
    from: "GEOPALLADA@MAIL.RU",
    to: "od_smrcc@morflot.ru",
    subject: "Проверка ССТО - МВ Паллада",
    body: `Главный морской спасательно-координационный центр

Просим провести тестирование системы судовой охранной тревожной сигнализации.

М/В "Паллада"
MMSI судна: 273333444
Номер IMO: 9733444
Стойка ССТО (IRIDIUM): IR-876543

Планируемое время теста: 22 января 2025 года, 09:00 по Владивостоку

Контакты для связи:
КШМ Петренко И.С.
Email: petrenko@pallada-ship.ru
Моб: +7(904)333-44-55

ГеоПаллада Шиппинг`
  },
  {
    from: "NNSMETANIN@GMAIL.COM",
    to: "od_smrcc@morflot.ru",
    subject: "СРОЧНО - Тестирование ССТО Камчатка",
    body: `СРОЧНАЯ ЗАЯВКА

Необходимо провести внеплановое тестирование ССТО.

Судно: Камчатка
MMSI: 273444555
IMO: 9744555
Терминал: 432910987

Дата: 23.01.2025
Время: 16:00

Причина: Замена оборудования

Контакт: +7-924-444-55-66
Email: kamchatka@fleet.ru

Прошу подтвердить получение заявки.`
  }
];

// ================== 15 СИГНАЛОВ ССТО ==================
const signals = [
  // 10 сигналов под существующие заявки
  {
    terminal_id: "432198765",
    mmsi: "273456789",
    vessel_name: "Капитан Крузенштерн",
    signal_time: "2025-01-16T10:05:00",
    latitude: 43.115,
    longitude: 131.885,
    signal_type: "TEST_406",
    message: "TEST SSAS ALERT - Capt. Kruzenshtern - Position: 43°06.9'N 131°53.1'E"
  },
  {
    terminal_id: "432287654",
    mmsi: "273567890",
    vessel_name: "Адмирал Макаров",
    signal_time: "2025-01-16T14:03:00",
    latitude: 42.875,
    longitude: 132.715,
    signal_type: "TEST_406",
    message: "TEST SIGNAL - Admiral Makarov - MMSI 273567890"
  },
  {
    terminal_id: "432376543",
    mmsi: "273678901",
    vessel_name: "Находка",
    signal_time: "2025-01-17T09:02:00",
    latitude: 42.815,
    longitude: 132.890,
    signal_type: "TEST_IRIDIUM",
    message: "IRIDIUM TEST - MV Nakhodka - Terminal IR-376543"
  },
  {
    terminal_id: "432465432",
    mmsi: "273789012",
    vessel_name: "Владивосток",
    signal_time: "2025-01-17T11:07:00",
    latitude: 43.125,
    longitude: 131.905,
    signal_type: "TEST_406",
    message: "SSAS TEST - Vladivostok - 43°07.5'N 131°54.3'E"
  },
  {
    terminal_id: "432732109",
    mmsi: "273111222",
    vessel_name: "Амур",
    signal_time: "2025-01-20T10:03:00",
    latitude: 43.095,
    longitude: 131.865,
    signal_type: "TEST_406",
    message: "Test activation SSAS - T/V Amur"
  },
  {
    terminal_id: "432821098",
    mmsi: "273222333",
    vessel_name: "Восток",
    signal_time: "2025-01-21T14:31:00",
    latitude: 42.955,
    longitude: 132.445,
    signal_type: "TEST_406",
    message: "SSAS TEST SIGNAL - MV Vostok - INMARSAT"
  },
  {
    terminal_id: "IR-876543",
    mmsi: "273333444",
    vessel_name: "Паллада",
    signal_time: "2025-01-22T09:05:00",
    latitude: 43.185,
    longitude: 132.025,
    signal_type: "TEST_IRIDIUM",
    message: "IRIDIUM SSAS TEST - M/V Pallada"
  },
  {
    terminal_id: "432910987",
    mmsi: "273444555",
    vessel_name: "Камчатка",
    signal_time: "2025-01-23T16:02:00",
    latitude: 52.975,
    longitude: 158.655,
    signal_type: "TEST_406",
    message: "URGENT TEST - Kamchatka - New equipment test"
  },
  {
    terminal_id: "432554321",
    mmsi: "273890123",
    vessel_name: "Приморье",
    signal_time: "2025-01-17T15:04:00",
    latitude: 42.635,
    longitude: 131.125,
    signal_type: "TEST_406",
    message: "Quarterly test SSAS - Primorye"
  },
  {
    terminal_id: "432643210",
    mmsi: "273901234",
    vessel_name: "Сахалин",
    signal_time: "2025-01-18T10:06:00",
    latitude: 46.965,
    longitude: 142.735,
    signal_type: "TEST_IRIDIUM",
    message: "New SSAS test - MV Sakhalin - IRIDIUM"
  },
  
  // 5 ложных сигналов без заявок
  {
    terminal_id: "432999888",
    mmsi: "273999888",
    vessel_name: "Unknown Vessel 1",
    signal_time: "2025-01-16T03:15:00",
    latitude: 41.225,
    longitude: 134.115,
    signal_type: "REAL_ALERT",
    message: "DISTRESS ALERT - Unknown vessel - No test scheduled"
  },
  {
    terminal_id: "432888777",
    mmsi: "273888777",
    vessel_name: "Fishing Vessel",
    signal_time: "2025-01-17T22:45:00",
    latitude: 44.565,
    longitude: 136.925,
    signal_type: "FALSE_ALERT",
    message: "FALSE ACTIVATION - Accidental trigger"
  },
  {
    terminal_id: "432777666",
    mmsi: "273777666",
    vessel_name: "Cargo Ship X",
    signal_time: "2025-01-18T05:30:00",
    latitude: 40.875,
    longitude: 139.445,
    signal_type: "REAL_ALERT",
    message: "SECURITY ALERT - Unscheduled activation"
  },
  {
    terminal_id: "432666555",
    mmsi: "273666555",
    vessel_name: "Tanker Y",
    signal_time: "2025-01-19T18:20:00",
    latitude: 45.335,
    longitude: 138.665,
    signal_type: "FALSE_ALERT",
    message: "System malfunction - False positive"
  },
  {
    terminal_id: "432555444",
    mmsi: "273555444",
    vessel_name: "Container Z",
    signal_time: "2025-01-20T01:10:00",
    latitude: 42.445,
    longitude: 135.775,
    signal_type: "UNKNOWN",
    message: "Unidentified signal - Investigation required"
  }
];

console.log('📋 Тестовые данные подготовлены:');
console.log(`   - ${formRequests.length} заявок через форму`);
console.log(`   - ${emailRequests.length} заявок через email`);
console.log(`   - ${signals.length} сигналов ССТО (10 тестовых, 5 ложных)`);
console.log('\nИспользуйте эти данные для демонстрации системы.');