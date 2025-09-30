const request = require('supertest');
const { BASE_URL } = require('../config');

const client = request(BASE_URL);

describe('Негативные сценарии API', () => {
  test('Создание заявки без MMSI отклоняется', async () => {
    const res = await client.post('/requests').send({ vessel_name: 'INVALID' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(res.body).toHaveProperty('message');
  });

  test('Линковка несуществующего сигнала к заявке возвращает ошибку', async () => {
    const res = await client.post('/signals/999999/link/999998').send();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('Отправка подтверждения по отсутствующей заявке даёт 404', async () => {
    const res = await client
      .post('/api/requests/999999/send-confirmation')
      .send({ send_email: false, generate_pdf: false });
    expect(res.status).toBe(404);
  });
});
