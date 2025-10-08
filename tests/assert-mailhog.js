#!/usr/bin/env node
const fs = require('node:fs');

const snapshotPath = process.argv[2] || 'tests/mailhog-snapshot.json';
const expectedAddress = process.env.MAILHOG_EXPECTED_RECIPIENT || 'od_smrcc@morflot.ru';

if (!fs.existsSync(snapshotPath)) {
  console.error('[assert-mailhog] snapshot not found:', snapshotPath);
  process.exit(1);
}

const raw = fs.readFileSync(snapshotPath, 'utf8');
const payload = JSON.parse(raw);
const items = payload?.items ?? payload ?? [];

const normalized = Array.isArray(items) ? items : [];
const found = normalized.some((item) => {
  const headers = item?.Content?.Headers ?? {};
  const toHeader = headers?.To ?? headers?.to ?? [];
  const allRecipients = Array.isArray(toHeader) ? toHeader.join(',') : String(toHeader ?? '');
  if (allRecipients.toLowerCase().includes(expectedAddress.toLowerCase())) {
    return true;
  }

  const body = item?.Content?.Body ? String(item.Content.Body) : '';
  return body.toLowerCase().includes(expectedAddress.toLowerCase());
});

if (!found) {
  console.error('[assert-mailhog] no message delivered to %s', expectedAddress);
  process.exit(2);
}

console.log('[assert-mailhog] OK – message to %s detected', expectedAddress);
