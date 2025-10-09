// tests/e2e/operator-login.spec.ts
import { test, expect } from '@playwright/test';

test('login -> operator panel is reachable and shows unmatched table', async ({ page }) => {
  // Mock /api/auth/login
  await page.route('**/api/auth/login', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, token: 'test' }) });
  });
  // Mock unmatched feed
  await page.route('**/api/signals/unmatched**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 0, items: [] })
    });
  });

  await page.goto('/login');
  // These selectors are conventional; adapt if your login form differs.
  const user = page.getByTestId('login-username');
  const pass = page.getByTestId('login-password');
  const submit = page.getByTestId('login-submit');

  // Fallback if data-testids are not present: try common selectors
  if (!(await user.isVisible().catch(() => false))) {
    await page.fill('input[name="username"], input[type="email"]', 'operator');
  } else {
    await user.fill('operator');
  }
  if (!(await pass.isVisible().catch(() => false))) {
    await page.fill('input[name="password"], input[type="password"]', 'operator');
  } else {
    await pass.fill('operator');
  }
  if (!(await submit.isVisible().catch(() => false))) {
    await page.click('button[type="submit"], button:has-text("Войти"), button:has-text("Login")');
  } else {
    await submit.click();
  }

  // After login, open operator panel
  await page.goto('/operator');
  await expect(page.getByTestId('unmatched-panel')).toBeVisible();
});
