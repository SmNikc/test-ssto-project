import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Ищем тесты только в каталоге test, чтобы случайные файлы в src не подхватывались
  roots: ['<rootDir>/test'],

  moduleFileExtensions: ['ts', 'tsx', 'js'],

  // Компиляция тестов TypeScript через ts-jest по основному tsconfig
  transform: { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },

  // Игнорируем node_modules
  transformIgnorePatterns: ['/node_modules/'],

  // Ищем только спецификации в папке test
  testMatch: ['**/test/**/*.spec.(ts|tsx|js)'],

  // Не сканируем артефакты сборки
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
};

export default config;
