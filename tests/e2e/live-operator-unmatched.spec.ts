// tests/e2e/live-operator-unmatched.spec.ts
import { test, expect } from '@playwright/test';

function apiBase() {
  // Frontend dev server proxies /api to backend (see vite.config.ts)
  return '/api';
}

test('LIVE: seed unmatched, see them in UI, link first suggestion', async ({ page }) => {
  // 1) Health check backend through proxy
  const health = await page.request.get(`${apiBase()}/health`);
  expect(health.status()).toBe(200);

  // 2) Seed data (requires ENABLE_TEST_SEED=1 on backend)
  const seedRes = await page.request.post(`${apiBase()}/_dev/seed/unmatched`, {
    data: { count: 3, withSuggestions: true, tag: 'e2e-fixture' },
  });
  expect(seedRes.status()).toBe(200);

  // 3) Load operator panel
  await page.goto('/operator');

  // Panel exists
  const panel = page.getByTestId('unmatched-panel');
  await expect(panel).toBeVisible({ timeout: 30_000 });

  // 4) Fetch unmatched feed (live, no mocks)
  const feedRes = await page.request.get(`${apiBase()}/signals/unmatched?sort=score&dir=desc&limit=10`);
  expect(feedRes.status()).toBe(200);
  const feed = await feedRes.json();
  expect(feed.count).toBeGreaterThan(0);

  const first = feed.items[0];
  const row = page.getByTestId(`signal-${first.id}`);
  // Fallback if testids differ: locate by vessel name text
  const visibleRow = (await row.isVisible().catch(() => false)) ? row : page.getByText(first.vessel_name ?? '', { exact: false });
  await expect(visibleRow).toBeVisible();

  // 5) Try to link via data-testid button; fallback to generic "Связать"
  const linkBtn = page.getByTestId(`link-${first.id}-${(first.suggestions?.[0]?.requestId) ?? ''}`);
  if (await linkBtn.isVisible().catch(() => false)) {
    await linkBtn.click();
  } else {
    await visibleRow.locator('button:has-text("Связать"), button:has-text("Link")').first().click();
  }

  // 6) Verify the item eventually disappears from unmatched
  await expect.poll(async () => {
    const res = await page.request.get(`${apiBase()}/signals/unmatched?limit=100`);
    const json = await res.json();
    return json.items.some((s: any) => s.id === first.id);
  }, { message: 'Signal should be removed from unmatched after linking' }).toBeFalsy();
});
