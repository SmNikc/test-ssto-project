import { test, expect } from '@playwright/test';

const MOCK_TOKEN = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxIiwiZW1haWwiOiJvcGVyYXRvckBtb3JzcGFzLnJ1IiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9wZXJhdG9yIl19fQ.';

test.describe('Сценарий оператора ССТО', () => {
  test('успешный вход и переход на /operator', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: MOCK_TOKEN }),
      });
    });

    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Система ССТО' })).toBeVisible();

    await page.getByLabel('Email или логин').fill('operator@morspas.ru');
    await page.getByLabel('Пароль').fill('P@ssw0rd!');
    await Promise.all([
      page.waitForURL('**/operator', { timeout: 5000 }),
      page.getByRole('button', { name: 'Войти в систему' }).click(),
    ]);

    await expect(page.getByRole('heading', { name: 'Панель оператора ССТО' })).toBeVisible();
  });
});
