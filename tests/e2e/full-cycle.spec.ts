import { test, expect, APIRequestContext } from '@playwright/test';

const apiBase = process.env.API_BASE_URL || 'http://localhost:3001/api';
const mailhogBase = process.env.MAILHOG_URL || 'http://localhost:8025';

async function createRequest(request: APIRequestContext, token: string) {
  const response = await request.post(`${apiBase}/requests`, {
    data: {
      vessel_name: 'M/V TESTER',
      mmsi: '273123456',
      contact_person: 'Автотест',
      contact_email: 'owner@example.com',
      contact_phone: '+7 (999) 123-45-67',
      planned_test_date: '2025-09-25',
      status: 'APPROVED',
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.data.request_number).toMatch(/^REQ-\d{4}-\d{4}$/);
  return body.data;
}

test('Полный цикл оператора: авторизация, заявка, проверка', async ({ page, request }) => {
  const loginResponse = await request.post(`${apiBase}/auth/login`, {
    data: { email: 'operator@test.com', password: 'any-password' },
  });
  expect(loginResponse.ok()).toBeTruthy();
  const loginBody = await loginResponse.json();
  const token = loginBody.accessToken || loginBody.access_token;
  expect(token).toBeTruthy();

  const created = await createRequest(request, token);

  await page.goto('/login');
  await page.getByLabel('Email или логин').fill('operator@test.com');
  await page.getByLabel('Пароль').fill('any-password');
  await page.getByRole('button', { name: 'Войти в систему' }).click();
  await page.waitForURL('**/operator');

  // Переходим к списку заявок и убеждаемся, что заявка отображается
  await page.goto('/operator/requests');
  await expect(page.getByText(created.request_number)).toBeVisible();
  await expect(page.getByText('M/V TESTER')).toBeVisible();

  // Проверяем, что MailHog доступен и отдает JSON (Smoke по S4/S5)
  const mailhogResponse = await request.get(`${mailhogBase}/api/v2/messages`);
  expect(mailhogResponse.ok()).toBeTruthy();
});
