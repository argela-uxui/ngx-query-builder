import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathPattern: ['projects/ngx-query-builder/src/.*\\.spec\\.ts$'],
  transform: {
    '^.+\\.(ts|js|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/projects/ngx-query-builder/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
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
  ],
};

export default config;
