module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.rs',  // This won't actually collect coverage from Rust files, but shows intent
  ],
  verbose: true,
  // Increase timeout for WASM compilation/loading
  testTimeout: 30000,
};