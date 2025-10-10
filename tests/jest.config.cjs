const { REPORTS_DIR } = require('./config');
const path = require('node:path');
const fs = require('node:fs');

fs.mkdirSync(path.join(REPORTS_DIR, 'junit'), { recursive: true });

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.js'],
  reporters: [
    'default',
    [
      path.join(__dirname, '..', 'tools', 'junit-reporter.js'),
      {
        outputDirectory: path.join(REPORTS_DIR, 'junit'),
        outputName: 'functional-tests.xml',
        suiteName: 'functional-tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],
  setupFilesAfterEnv: [path.join(__dirname, 'jest.setup.js')],
  verbose: true,
  testTimeout: 240000,
};
