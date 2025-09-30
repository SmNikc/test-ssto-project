import { test, expect } from '@playwright/test';

test.describe('UI: операторский сценарий', () => {
  test('Авторизация и переход к списку заявок', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Вход в систему ССТО' })).toBeVisible();

    await page.getByLabel('Email').fill('operator@test.com');
    await page.getByLabel('Пароль').fill('secret');
    await page.getByRole('button', { name: 'Войти' }).click();

    await page.waitForURL('**/operator', { timeout: 30000 });
    await expect(page.getByRole('heading', { name: 'Панель оператора ССТО' })).toBeVisible();

    await page.getByRole('button', { name: 'Открыть заявки' }).click();
    await page.waitForURL('**/operator/requests', { timeout: 30000 });
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th', { hasText: 'Судно' })).toBeVisible();
  });
});
