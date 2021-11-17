module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/src/**/*.test.(ts|tsx)'],
  setupFilesAfterEnv: ['jest-extended', './test/setup.tsx'],
  moduleNameMapper: {
    '^@compiled/react$': '<rootDir>/packages/react/src/index.tsx',
  },
  transformIgnorePatterns: ['node_modules/(?!@compiled)'],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
};
