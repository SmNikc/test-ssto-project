import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Разрешаем тесты как в test/, так и в src/
  roots: ['<rootDir>/test', '<rootDir>/src'],

  moduleFileExtensions: ['ts', 'tsx', 'js'],

  // Компиляция TS-тестов через ts-jest по основному tsconfig
  transform: { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },

  transformIgnorePatterns: ['/node_modules/'],

  // Ищем любые *.(spec|test).(ts|tsx|js) в разрешённых корнях
  testMatch: ['**/?(*.)+(spec|test).(ts|tsx|js)'],

  // Не сканируем артефакты сборки
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
};

export default config;
