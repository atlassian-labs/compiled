module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/src/**/*.test.ts*'],
  setupFilesAfterEnv: ['jest-extended', './test/matchers.tsx'],
  moduleNameMapper: {
    '^@compiled/css-in-js$': '<rootDir>/src/index.tsx',
  },
  globals: {
    'ts-jest': {
      compiler: 'ttypescript',
    },
  },
};
