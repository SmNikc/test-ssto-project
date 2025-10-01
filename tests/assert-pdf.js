#!/usr/bin/env node
const fs = require('node:fs');
const zlib = require('node:zlib');

const file = process.argv[2] || '/tmp/report.pdf';
const requiredHex = process.argv[3] || '<41c41841d42242041041d4212042041e421421418418>';

if (!fs.existsSync(file)) {
  console.error('[assert-pdf] PDF not found:', file);
  process.exit(1);
}

const binary = fs.readFileSync(file).toString('binary');
const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
let match;
let decoded = '';

while ((match = streamRegex.exec(binary))) {
  const chunk = Buffer.from(match[1], 'binary');
  try {
    decoded += zlib.inflateSync(chunk).toString('binary');
  } catch (err) {
    decoded += chunk.toString('binary');
  }
}

if (!decoded.includes(requiredHex)) {
  console.error('[assert-pdf] Expected hex sequence not found:', requiredHex);
  process.exit(2);
}

console.log('[assert-pdf] OK – found sequence', requiredHex);
