--- FILE: jest.config.ts ---
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: { 
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] 
  },
  transformIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  
  // Reporters - объединяем из обеих веток
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports/junit',
        outputName: 'backend-tests.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}'
      },
    ],
  ],
  
  // Coverage настройки - объединяем лучшее из обеих веток
  collectCoverage: true,
  coverageDirectory: 'reports/coverage',
  coverageProvider: 'v8', // из main ветки
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/main.ts',
    '!<rootDir>/src/**/*.module.ts',
    '!<rootDir>/src/**/index.ts',
  ],
  coverageReporters: ['text', 'lcov', 'text-summary'], // объединено
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  
  // Timeout из codex ветки
  testTimeout: 30000,
};

export default config;