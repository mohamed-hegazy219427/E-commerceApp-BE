import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@models/(.*)$': '<rootDir>/DB/Models/$1',
    '^@utils/(.*)$': '<rootDir>/src/shared/utils/$1',
    '^@services/(.*)$': '<rootDir>/src/shared/services/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@i18n/(.*)$': '<rootDir>/src/i18n/$1',
    '^@types-app/(.*)$': '<rootDir>/src/shared/types/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterFramework: [],
};

export default config;
