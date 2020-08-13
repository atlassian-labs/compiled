module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/src/**/*.test.ts*'],
  setupFilesAfterEnv: ['jest-extended', './test/setup.tsx'],
  moduleNameMapper: {
    '^@compiled/core$': '<rootDir>/packages/core/src/index.tsx',
  },
  transform: {
    '\\.m?jsx?$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!@compiled)'],
  globals: {
    'ts-jest': {
      compiler: 'ttypescript',
    },
  },
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
};
