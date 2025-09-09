const path = require('path');

const base = require('../../jest.config.json');

module.exports = {
  ...base,
  rootDir: __dirname,
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended'],
  testMatch: ['**/tests/**/*.test.{js,ts,tsx}'],
  moduleNameMapper: {
    '^@compiled/react/runtime$': '<rootDir>/../react/src/runtime.ts',
    '^@compiled/react/(.*)$': '<rootDir>/../react/src/jsx/$1.ts',
    '^@compiled/(.*)$': '<rootDir>/../$1/src/index.ts',
  },
  transform: {
    '^.+\\.(t|j)sx?$': [
      require.resolve('babel-jest'),
      { configFile: path.join(__dirname, '../../babel.config.json') },
    ],
  },
};
