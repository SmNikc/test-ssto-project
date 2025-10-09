const path = require('node:path');

const BASE_URL = process.env.TEST_SSTO_BASE_URL || 'http://localhost:3001';
const WEB_URL = process.env.TEST_SSTO_WEB_URL || 'http://localhost';
const MAILHOG_URL = process.env.TEST_SSTO_MAILHOG_URL || 'http://localhost:8025';
const ARTIFACTS_DIR = path.resolve(__dirname, 'artifacts');
const REPORTS_DIR = path.resolve(__dirname, 'reports');

module.exports = {
  BASE_URL,
  WEB_URL,
  MAILHOG_URL,
  ARTIFACTS_DIR,
  REPORTS_DIR,
};
