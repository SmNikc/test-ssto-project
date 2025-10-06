// backend-nest/test/unit/signal-matcher.spec.ts
import { buildSuggestions, selectBestMatchStrictByTerminal, extractSignalIdentifiers } from '../../src/signal/signal-matcher';

describe('SignalMatcher (IMN-only & suggestions)', () => {
  const sigBase = {
    id: 1,
    terminal_number: '427315936',
    mmsi: '273345000',
    vessel_name: 'ВИТУС БЕРИНГ',
    received_at: new Date('2025-10-05T10:00:00Z'),
    metadata: {},
  } as any;

  const req = (id: number, o: Partial<any> = {}) => ({
    id,
    ssas_number: o.ssas_number ?? '427315936',
    mmsi: o.mmsi ?? '273345000',
    imo_number: o.imo_number ?? '9123456',
    vessel_name: o.vessel_name ?? 'Vitus Bering',
    planned_test_date: o.planned_test_date ?? new Date('2025-10-05T09:30:00Z'),
    status: 'pending',
  });

  it('selectBestMatchStrictByTerminal: matches only when IMN equals', () => {
    const sig = extractSignalIdentifiers(sigBase);
    const candidates = [req(1), req(2, { ssas_number: '111111111' })] as any;
    const best = selectBestMatchStrictByTerminal(sig, candidates);
    expect(best?.request.id).toBe(1);
  });

  it('selectBestMatchStrictByTerminal: returns null when IMN differs', () => {
    const sig = extractSignalIdentifiers({ ...sigBase, terminal_number: '999999999' });
    const candidates = [req(1)] as any;
    const best = selectBestMatchStrictByTerminal(sig, candidates);
    expect(best).toBeNull();
  });

  it('buildSuggestions: uses MMSI/IMO/NAME/TIME as hints when IMN strict match is not found', () => {
    const sig = extractSignalIdentifiers({ ...sigBase, terminal_number: 'NO_MATCH' });
    const candidates = [
      req(3, { ssas_number: 'NO_MATCH', mmsi: '273345000', vessel_name: 'VITUS BERING', planned_test_date: new Date('2025-10-05T10:30:00Z') }),
      req(4, { ssas_number: 'NO_MATCH', mmsi: '111222333', vessel_name: 'OTHER', planned_test_date: new Date('2025-10-07T10:30:00Z') }),
    ] as any;
    const suggestions = buildSuggestions(sig, candidates, 5);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(suggestions[0].reasons.join(',')).toMatch(/MMSI|NAME|TIME/);
  });
});
