import { RuleTester } from 'eslint';

(RuleTester as any).describe = (text: string, method: (...args: any[]) => void) => {
  const origHasAssertions = expect.hasAssertions;
  describe(text, () => {
    beforeAll(() => {
      // Stub out expect.hasAssertions beforeEach from jest-presetup.js
      expect.hasAssertions = () => {};
    });
    afterAll(() => {
      expect.hasAssertions = origHasAssertions;
    });

    method();
  });
};

export const tester = new RuleTester({
  parser: require.resolve('babel-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});
