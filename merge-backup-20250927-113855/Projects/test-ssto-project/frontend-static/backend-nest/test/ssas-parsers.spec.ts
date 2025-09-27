import { parseEmail, parseTextPayload } from '../src/utils/ssas-parsers';

describe('SSAS parsers', () => {
  it('parseEmail: extracts MMSI, classification TEST, coords', () => {
    const subject = 'SSAS TEST: MMSI 123456789';
    const body = 'Vessel: KAPITAN IVANOV\nLat 59°56\'30"N Lon 030°18\'20"E\n406 MHz';
    const p = parseEmail(subject, body);
    expect(p.mmsi).toBe('123456789');
    expect(p.classification).toBe('TEST');
    expect(p.latitude).toBeDefined();
    expect(p.longitude).toBeDefined();
  });

  it('parseTextPayload: extracts hex id', () => {
    const raw = 'ALERT SSAS HEXID A1B2C3D4E5F6A7B at 2025-09-01 10:30Z';
    const p = parseTextPayload(raw);
    expect(p.beacon_hex_id).toBe('A1B2C3D4E5F6A7B');
  });
});
