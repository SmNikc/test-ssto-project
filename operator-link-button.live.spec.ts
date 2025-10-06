// tests/e2e/operator-link-button.live.spec.ts
import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_BASE || process.env.API_BASE || 'http://localhost:3001/api';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

/**
 * LIVE E2E: ручная привязка через UI именно кнопкой в таблице.
 * Предусловие: backend поднят, ENABLE_TEST_SEED=1. Тест сам посеет фикстуры.
 */
test.describe('LIVE E2E: manual link via UI button', () => {
  test.beforeAll(async ({ request }) => {
    // Прогреть /health
    const h = await request.get(`${API_BASE}/health`);
    if (!h.ok()) await new Promise(r => setTimeout(r, 1500));

    // Посеять 2 UNMATCHED-сигнала с подсказками
    const seed = await request.post(`${API_BASE}/_dev/seed/unmatched`, {
      data: { count: 2, withSuggestions: true, tag: 'e2e-live-ui' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(seed.ok()).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    const clr = await request.delete(`${API_BASE}/_dev/seed/clear`);
    expect(clr.ok()).toBeTruthy();
  });

  test('click link-<sig>-<req> and see success toast/notification', async ({ page, request }) => {
    // 1) Возьмём топ-элемент из живой ленты
    const feed = await request.get(`${API_BASE}/signals/unmatched?sort=score&dir=desc&limit=20`);
    expect(feed.ok()).toBeTruthy();
    const body = await feed.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    const first = body.items[0];
    const sigId = first.id as number;
    const reqId = first.suggestions?.[0]?.requestId as number;
    expect(typeof sigId).toBe('number');
    expect(typeof reqId).toBe('number');

    // 2) Откроем панель оператора
    await page.goto(`${BASE_URL}/operator`);
    const panel = page.getByTestId('unmatched-panel');
    await expect(panel).toBeVisible({ timeout: 30_000 });

    // 3) Найдём строку по data-testid/атрибутам/фолбэкам
    let row = page.getByTestId(`signal-${sigId}`);
    if (!(await row.isVisible().catch(() => false))) row = page.locator(`[data-signal-id="${sigId}"]`);
    if (!(await row.isVisible().catch(() => false))) row = page.locator(`tr:has-text("${sigId}")`);
    await expect(row).toBeVisible();

    // 4) Кнопка линка: link-<sig>-<req> (fallback — кнопка с текстом/aria)
    let linkBtn = row.getByTestId(`link-${sigId}-${reqId}`);
    if (!(await linkBtn.isVisible().catch(() => false))) {
      linkBtn = row.locator('button:has-text("Связать"), [data-action="link"], [aria-label*="Связать"]');
    }
    await expect(linkBtn).toBeVisible();
    await linkBtn.click();

    // 5) Ожидаем тост/уведомление (несколько вариантов селекторов)
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
      // ждём до 5с на любой вариант
      try { await expect(c).toBeVisible({ timeout: 5000 }); seen = true; break; } catch {}
    }
    expect(seen).toBeTruthy();

    // 6) Проверяем, что сигнала больше нет в unmatched
    const updated = await request.get(`${API_BASE}/signals/unmatched?limit=200`);
    expect(updated.ok()).toBeTruthy();
    const upd = await updated.json();
    const stillThere = (upd.items as any[]).some((x: any) => x.id === sigId);
    expect(stillThere).toBeFalsy();
  });
});
