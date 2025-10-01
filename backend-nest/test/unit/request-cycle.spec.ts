import { RequestService } from '../../src/request/request.service';

describe('RequestService cycle helpers', () => {
  const service = new RequestService({} as any);

  it('calculates next test date exactly after 12 months', () => {
    const base = new Date('2024-05-15T00:00:00Z');
    const next = service.calculateNextTestDate(base);
    expect(next.getUTCFullYear()).toBe(2025);
    expect(next.getUTCMonth()).toBe(4); // May (0-based)
    expect(next.getUTCDate()).toBe(15);
  });

  it('returns reminder window for T-30 and T-0', () => {
    const next = new Date('2025-10-01T00:00:00Z');
    const { remind30, remind0 } = service.getReminderWindow(next);
    expect(remind0.toISOString()).toContain('2025-10-01');
    expect(remind30.toISOString()).toContain('2025-09-01');
  });

  it('flags T-30 reminder when within window', () => {
    const next = new Date('2025-10-01T00:00:00Z');
    const result = service.shouldSendReminder(next, new Date('2025-09-05T00:00:00Z'));
    expect(result.type).toBe('T-30');
    expect(result.overdue).toBe(false);
  });

  it('flags overdue when next test already in the past', () => {
    const next = new Date('2025-01-01T00:00:00Z');
    const result = service.shouldSendReminder(next, new Date('2025-02-15T00:00:00Z'));
    expect(result.type).toBe('T-0');
    expect(result.overdue).toBe(true);
  });

  it('blocks submissions when last completed test is older than 12 months', () => {
    const last = new Date('2023-05-01T00:00:00Z');
    const now = new Date('2024-06-01T00:00:00Z');
    expect(service.isBlockedByCycle(last, now)).toBe(true);
  });

  it('allows submissions when last test is within 12 months', () => {
    const last = new Date('2024-12-10T00:00:00Z');
    const now = new Date('2025-09-01T00:00:00Z');
    expect(service.isBlockedByCycle(last, now)).toBe(false);
  });
});
