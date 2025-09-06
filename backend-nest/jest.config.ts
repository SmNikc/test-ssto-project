import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'], // держим тесты только здесь
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  transformIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/test/**/*.spec.(ts|tsx|js)'], // единый шаблон
  testPathIgnorePatterns: ['/node_modules/', '/dist/'], // не трогаем сборку
  // (опционально) покрытие:
  // collectCoverageFrom: ['src/**/*.{ts,tsx,js}'],
  // coverageDirectory: 'coverage'
};

export default config;
