import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  transformIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageProvider: 'v8',
  coverageReporters: ['lcov', 'text-summary'],
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 35,
      functions: 45,
      lines: 60,
    },
  },
};

export default config;
