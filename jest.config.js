module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/src/**/*.test.ts*'],
  setupFilesAfterEnv: ['jest-extended', './test/setup.tsx'],
  moduleNameMapper: {
    '^@compiled/css-in-js$': '<rootDir>/packages/css-in-js/src/index.tsx',
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
};
