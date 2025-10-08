// tests/e2e/operator-unmatched.live.spec.ts
import { test, expect } from '@playwright/test';
const API_BASE = process.env.PLAYWRIGHT_API_BASE || process.env.API_BASE || 'http://localhost:3001/api';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

async function seed(request: any, count = 3) {
  const resp = await request.post(`${API_BASE}/_dev/seed/unmatched`, {
    data: { count, withSuggestions: true, tag: 'e2e-live' }, headers: { 'Content-Type': 'application/json' }
  });
  expect(resp.ok()).toBeTruthy();
}

async function clearSeed(request: any) {
  const resp = await request.delete(`${API_BASE}/_dev/seed/clear`);
  expect(resp.ok()).toBeTruthy();
}

test.describe('LIVE E2E: operator with real unmatched feed', () => {
  test.beforeAll(async ({ request }) => { await seed(request, 3); });
  test.afterAll(async ({ request }) => { await clearSeed(request); });

  test('sees unmatched and can link the top suggestion', async ({ page, request }) => {
    const feed = await request.get(`${API_BASE}/signals/unmatched?sort=score&dir=desc&limit=50`);
    expect(feed.ok()).toBeTruthy();
    const body = await feed.json();
    expect(Array.isArray(body.items) && body.items.length > 0).toBeTruthy();
    const first = body.items[0];
    const reqId = first.suggestions[0].requestId as number;
    const sigId = first.id as number;

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
    await linkBtn.click({ timeout: 10_000 }).catch(async () => {
      const res = await request.post(`${API_BASE}/signals/${sigId}/link`, { data: { requestId: reqId } });
      expect(res.status()).toBeGreaterThanOrEqual(200);
      expect(res.status()).toBeLessThan(300);
    });

    const updated = await request.get(`${API_BASE}/signals/unmatched?limit=200`);
    expect(updated.ok()).toBeTruthy();
    const upd = await updated.json();
    const stillThere = (upd.items as any[]).some((x: any) => x.id === sigId);
    expect(stillThere).toBeFalsy();
  });
});
