const fs = require('node:fs');
const path = require('node:path');
const { ARTIFACTS_DIR, REPORTS_DIR } = require('./config');

beforeAll(() => {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
});

afterAll(() => {
  const marker = path.join(ARTIFACTS_DIR, 'README.txt');
  if (!fs.existsSync(marker)) {
    fs.writeFileSync(
      marker,
      'Артефакты автотестов складываются сюда (PDF, MailHog summary, логи).\n',
      'utf8',
    );
  }
});
