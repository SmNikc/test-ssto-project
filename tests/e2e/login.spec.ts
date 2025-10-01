import { test, expect } from '@playwright/test';

test.describe('Login page smoke (CI S1/S2)', () => {
  test('renders login form with regulatory caption', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Система ССТО' })).toBeVisible();
    await expect(page.getByText('Судовая система тревожного оповещения')).toBeVisible();
    await expect(page.getByText('ФГБУ "Морская спасательная служба"')).toBeVisible();
    await expect(page.getByLabel('Email или логин')).toBeVisible();
    await expect(page.getByLabel('Пароль')).toBeVisible();
  });

  test('accepts operator credentials and navigates to dashboard shell', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email или логин').fill(process.env.E2E_OPERATOR_LOGIN || 'operator@test.com');
    await page.getByLabel('Пароль').fill(process.env.E2E_OPERATOR_PASSWORD || 'operator');
    await page.getByRole('button', { name: 'Войти в систему' }).click();
    await expect(page).toHaveURL(/dashboard|client/i, { timeout: 30_000 });
  });
});
