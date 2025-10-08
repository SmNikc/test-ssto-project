// tests/e2e/operator-link-button.live.spec.ts
import { test, expect } from '@playwright/test';
const API_BASE = process.env.PLAYWRIGHT_API_BASE || process.env.API_BASE || 'http://localhost:3001/api';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('LIVE E2E: manual link via UI button', () => {
  test.beforeAll(async ({ request }) => {
    const seed = await request.post(`${API_BASE}/_dev/seed/unmatched`, {
      data: { count: 2, withSuggestions: true, tag: 'e2e-live-ui' }, headers: { 'Content-Type': 'application/json' },
    });
    expect(seed.ok()).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    const clr = await request.delete(`${API_BASE}/_dev/seed/clear`);
    expect(clr.ok()).toBeTruthy();
  });

  test('click link-<sig>-<req> and see success toast/notification', async ({ page, request }) => {
    const feed = await request.get(`${API_BASE}/signals/unmatched?sort=score&dir=desc&limit=20`);
    expect(feed.ok()).toBeTruthy();
    const body = await feed.json();
    const first = body.items[0];
    const sigId = first.id as number;
    const reqId = first.suggestions?.[0]?.requestId as number;

    await page.goto(`${BASE_URL}/operator`);
    const panel = page.getByTestId('unmatched-panel');
    await expect(panel).toBeVisible({ timeout: 30_000 });

    let row = page.getByTestId(`signal-${sigId}`);
    if (!(await row.isVisible().catch(() => false))) row = page.locator(`[data-signal-id="${sigId}"]`);
    if (!(await row.isVisible().catch(() => false))) row = page.locator(`tr:has-text("${sigId}")`);
    await expect(row).toBeVisible();

    let linkBtn = row.getByTestId(`link-${sigId}-${reqId}`);
    if (!(await linkBtn.isVisible().catch(() => false))) {
      linkBtn = row.locator('button:has-text("Связать"), [data-action="link"], [aria-label*="Связать"]');
    }
    await expect(linkBtn).toBeVisible();
    await linkBtn.click();

    const candidates = [
      page.getByTestId('toast-success'),
      page.locator('[role="status"]:has-text("Успешно")'),
      page.locator('[role="alert"]:has-text("Успешно")'),
      page.locator('.Toastify__toast--success'),
      page.locator('text=/Привязан|Связано|Связь установлена|Linked|Привязка выполнена/i'),
    ];
    let seen = false;
    for (const c of candidates) {
      if (await c.isVisible().catch(() => false)) { seen = true; break; }
      try { await expect(c).toBeVisible({ timeout: 5000 }); seen = true; break; } catch {}
    }
    expect(seen).toBeTruthy();

    const updated = await request.get(`${API_BASE}/signals/unmatched?limit=200`);
    expect(updated.ok()).toBeTruthy();
    const upd = await updated.json();
    const stillThere = (upd.items as any[]).some((x: any) => x.id === sigId);
    expect(stillThere).toBeFalsy();
  });
});
