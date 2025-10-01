import { buildRecipientList, PRIMARY_SSTO_RECIPIENT } from '../../src/email/recipient.policy';

describe('recipient.policy', () => {
  it('adds primary SSTO recipient even if not provided', () => {
    const result = buildRecipientList('owner@example.com');
    expect(result).toContain(PRIMARY_SSTO_RECIPIENT);
    expect(result).toContain('owner@example.com');
  });

  it('deduplicates addresses and normalises case', () => {
    const result = buildRecipientList(['OWNER@example.com', 'owner@example.com']);
    const occurrences = result.filter((item) => item === 'owner@example.com');
    expect(occurrences).toHaveLength(1);
  });

  it('merges to/cc lists', () => {
    const result = buildRecipientList('owner@example.com', ['cc@example.com']);
    expect(result).toEqual(expect.arrayContaining(['owner@example.com', 'cc@example.com', PRIMARY_SSTO_RECIPIENT]));
  });
});
