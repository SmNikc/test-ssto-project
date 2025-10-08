// tests/e2e/operator-unmatched-live.spec.ts
import { test, expect, request as pwRequest } from '@playwright/test';

test('operator panel shows seeded unmatched signals (live)', async ({ page, request }) => {
  // Fetch unmatched via API to know what to expect
  const apiBase = process.env.PLAYWRIGHT_API_BASE || 'http://localhost:3001/api';
  const res = await pwRequest.newContext().then(ctx => ctx.get(`${apiBase}/signals/unmatched?limit=50&sort=score&dir=desc`));
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.count).toBeGreaterThan(0);

  const row = data.items.find((it: any) => it.vessel_name === 'АРКТИКА' || it.vessel_name?.includes('АРКТ'));
  expect(row).toBeTruthy();

  // Open operator panel and verify presence
  await page.goto('/operator');
  await expect(page.getByText('АРКТИКА')).toBeVisible();
});
