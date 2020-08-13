module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/src/**/*.test.ts*'],
  setupFilesAfterEnv: ['jest-extended', './test/setup.tsx'],
  moduleNameMapper: {
    '^@compiled/core$': '<rootDir>/packages/core/src/index.tsx',
  },
  transformIgnorePatterns: ['node_modules/(?!@compiled)'],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
};
