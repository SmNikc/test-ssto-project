import test from 'node:test';
import assert from 'node:assert/strict';
import { extractSignalIdentifiers, selectBestMatch } from '../../src/signal/signal-matcher.js';

test('prefers IMN over fuzzy name', () => {
  const sig = {
    mmsi: null, terminal_number: '427315936', vessel_name: 'СВАРОГ', received_at: new Date('2025-09-02T10:00:00Z'),
    metadata: { subject: 'SSAS TEST ALERT' }
  };
  const reqs = [
    { id: 11, vessel_name: 'Swarog', ssas_number: '999999999', mmsi: null, imo_number: null, planned_test_date: '2025-09-02T09:30:00Z' },
    { id: 10, vessel_name: 'Святогор', ssas_number: '427315936', mmsi: null, imo_number: null, planned_test_date: '2025-09-02T09:45:00Z' },
  ];
  const ids = extractSignalIdentifiers(sig);
  const best = selectBestMatch(ids, reqs);
  assert.ok(best);
  assert.equal(best.request.id, 10);
});
