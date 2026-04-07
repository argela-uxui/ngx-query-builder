import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['**/projects/ngx-query-builder/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/projects/ngx-query-builder/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    'ngx-query-builder': '<rootDir>/projects/ngx-query-builder/src/public-api.ts',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'projects/ngx-query-builder/src/**/*.ts',
    '!projects/ngx-query-builder/src/public-api.ts',
    '!**/index.ts',
    '!**/ngx-query-builder.module.ts',  // backward-compat barrel, no logic
  ],
};

export default config;
