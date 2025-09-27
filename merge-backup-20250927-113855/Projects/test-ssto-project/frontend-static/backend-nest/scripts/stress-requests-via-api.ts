// backend-nest/scripts/stress-requests-via-api.ts
// Запуск: npx ts-node backend-nest/scripts/stress-requests-via-api.ts http://localhost:3001/requests 100
import axios from 'axios';

const url = process.argv[2] || 'http://localhost:3001/requests';
const n = Number(process.argv[3] || 50);

function payload(i: number) {
  return {
    vessel_name: `Stress-${i}`,
    mmsi: `273${String(100000 + i).padStart(6, '0')}`,
    contact_person: 'Stress Bot',
    contact_phone: '+79990000000',
    contact_email: `stress${i}@example.com`,
    status: 'SUBMITTED',
    // request_number НЕ передаём: его ставит триггер в БД
  };
}

(async () => {
  const tasks = Array.from({ length: n }, (_, i) =>
    axios.post(url, payload(i)).then(r => r.data).catch(e => ({ error: e?.message || String(e) }))
  );
  const res = await Promise.all(tasks);

  // Попробуем собрать request_number из ответов
  const numbers: string[] = [];
  for (const x of res) {
    const rn =
      (x && x.data && (x.data.request_number || x.data.requestNumber)) ||
      x?.request_number ||
      x?.requestNumber;
    if (typeof rn === 'string') numbers.push(rn);
  }
  const uniq = new Set(numbers);

  console.log(`Создано ответов: ${res.length}`);
  console.log(`Получено номеров request_number: ${numbers.length}`);
  console.log(`Уникальных номеров: ${uniq.size}`);

  if (numbers.length && uniq.size !== numbers.length) {
    console.error('❌ Найдены дубликаты в ответах API');
    process.exit(1);
  } else {
    console.log('✅ Дубликатов в ответах API не обнаружено (или сервер не возвращает номер)');
  }
})();
