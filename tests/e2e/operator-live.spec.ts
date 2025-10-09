// tests/e2e/operator-live.spec.ts
import { test, expect, request as pwRequest } from '@playwright/test';

const API_BASE = process.env.API_BASE || process.env.PLAYWRIGHT_API_BASE || 'http://localhost:3001/api';
const UI_BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test('LIVE: seed -> see unmatched -> link -> verify (no mocks)', async ({ page, request }) => {
  // 1) Seed UNMATCHED signals with suggestions
  const seedRes = await request.post(`${API_BASE}/_dev/seed/unmatched`, {
    data: { count: 3, withSuggestions: true, tag: 'e2e-fixture' },
  });
  expect(seedRes.ok()).toBeTruthy();

  // 2) Read /signals/unmatched (top 1)
  const feedRes = await request.get(`${API_BASE}/signals/unmatched?sort=score&dir=desc&limit=1`);
  expect(feedRes.ok()).toBeTruthy();
  const feed = await feedRes.json();
  expect(Array.isArray(feed.items)).toBeTruthy();
  expect(feed.items.length).toBeGreaterThan(0);

  const first = feed.items[0];
  const sigId = first.id;
  const reqId = first.suggestions?.[0]?.requestId;
  expect(sigId).toBeTruthy();
  expect(reqId).toBeTruthy();

  // 3) Try UI flow (best effort): open /operator and click link button if present
  await page.goto(`${UI_BASE}/operator`);
  // Wait for panel or tolerate absence
  await page.waitForTimeout(1000);

  const linkBtn = page.locator(`[data-testid="link-${sigId}-${reqId}"], [data-testid^="link-${sigId}-"]`).first();
  if (await linkBtn.isVisible().catch(() => false)) {
    await linkBtn.click();
  } else {
    // Fallback: call API to link manually
    const linkRes = await request.post(`${API_BASE}/signals/${sigId}/link`, { data: { requestId: reqId } });
    expect(linkRes.ok()).toBeTruthy();
  }

  // 4) Verify via API: signal not present in /signals/unmatched anymore
  const afterRes = await request.get(`${API_BASE}/signals/unmatched?sort=score&dir=desc&limit=100`);
  expect(afterRes.ok()).toBeTruthy();
  const after = await afterRes.json();
  const stillThere = (after.items || []).some((x: any) => x.id === sigId);
  expect(stillThere).toBeFalsy();
});
