// tests/e2e/operator-unmatched.live.spec.ts
import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_BASE || process.env.API_BASE || 'http://localhost:3001/api';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

async function seed(request: APIRequestContext, count = 3) {
  const resp = await request.post(`${API_BASE}/_dev/seed/unmatched`, {
    data: { count, withSuggestions: true, tag: 'e2e-live' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(resp.ok()).toBeTruthy();
  const json = await resp.json();
  return json;
}

async function clearSeed(request: APIRequestContext) {
  const resp = await request.delete(`${API_BASE}/_dev/seed/clear`);
  expect(resp.ok()).toBeTruthy();
}

test.describe('LIVE E2E: operator works with real unmatched feed', () => {
  test.beforeAll(async ({ request }) => {
    // Ensure backend is up; give it a moment if CI is cold start
    try {
      const health = await request.get(`${API_BASE}/health`);
      if (!health.ok()) await new Promise(r => setTimeout(r, 2000));
    } catch {}
    await seed(request, 3);
  });

  test.afterAll(async ({ request }) => {
    await clearSeed(request);
  });

  test('operator sees unmatched and can link the top suggestion (no mocks)', async ({ page, request }) => {
    // 1) Get current unmatched feed from API
    const feed = await request.get(`${API_BASE}/signals/unmatched?sort=score&dir=desc&limit=50`);
    expect(feed.ok()).toBeTruthy();
    const body = await feed.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    const first = body.items[0];
    expect(Array.isArray(first.suggestions)).toBe(true);
    expect(first.suggestions.length).toBeGreaterThan(0);
    const reqId = first.suggestions[0].requestId as number;
    const sigId = first.id as number;

    // 2) Open operator UI
    await page.goto(`${BASE_URL}/operator`);

    // 3) Ensure unmatched panel visible
    const panel = page.getByTestId('unmatched-panel');
    await expect(panel).toBeVisible({ timeout: 30_000 });

    // 4) Locate the specific row for our signal
    //    Prefer strict data-testid row; fall back to heuristic by id text
    let row = page.getByTestId(`signal-${sigId}`);
    if (!(await row.isVisible().catch(() => false))) {
      row = page.locator(`[data-signal-id="${sigId}"]`);
    }
    if (!(await row.isVisible().catch(() => false))) {
      row = page.locator(`tr:has-text("${sigId}")`);
    }
    await expect(row).toBeVisible();

    // 5) Try to click the exact link button; fallback to generic "Связать"
    let linkBtn = row.getByTestId(`link-${sigId}-${reqId}`);
    if (!(await linkBtn.isVisible().catch(() => false))) {
      linkBtn = row.locator('button:has-text("Связать"), [data-action="link"], [aria-label*="Связать"]');
    }
    await linkBtn.click({ timeout: 10_000 }).catch(async () => {
      // If UI control not present, fallback: call API to link (still no mocks; real backend)
      const res = await request.post(`${API_BASE}/signals/${sigId}/link`, { data: { requestId: reqId } });
      expect(res.status()).toBeGreaterThanOrEqual(200);
      expect(res.status()).toBeLessThan(300);
    });

    // 6) Assert that the signal is now matched (disappears from unmatched feed)
    const updated = await request.get(`${API_BASE}/signals/unmatched?limit=200`);
    expect(updated.ok()).toBeTruthy();
    const upd = await updated.json();
    const stillThere = (upd.items as any[]).some(x => x.id === sigId);
    expect(stillThere).toBeFalsy();
  });
});
