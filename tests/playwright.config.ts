import { defineConfig } from '@playwright/test';
import path from 'node:path';

const artifactsDir = process.env.TEST_SSTO_ARTIFACTS_DIR || path.resolve(__dirname, 'artifacts');
const baseURL = process.env.TEST_SSTO_WEB_URL || 'http://localhost';

export default defineConfig({
  testDir: './e2e',
  timeout: 120000,
  retries: 1,
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  reporter: [
    ['list'],
    ['junit', { outputFile: path.join(artifactsDir, 'playwright-results.xml') }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  outputDir: path.join(artifactsDir, 'playwright-output'),
});
