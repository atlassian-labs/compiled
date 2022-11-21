import { basename } from 'path';

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

const baseTesterConfig = {
  parser: require.resolve('babel-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
};

export const tester = new RuleTester(baseTesterConfig);

export const typeScriptTester = new RuleTester({ ...baseTesterConfig, parser: require.resolve('@typescript-eslint/parser')});

export const createAliasedInvalidTestCase = (
  test: RuleTester.InvalidTestCase,
  replaceCode: (code: string) => string,
  replaceOutput: (output: string) => string
): RuleTester.InvalidTestCase => ({
  ...test,
  filename: `aliased-${basename(test.filename!)}.ts`,
  code: replaceCode(test.code),
  output: replaceOutput(test.output!),
});

export const createDeclarationInvalidTestCases = (
  test: RuleTester.InvalidTestCase,
  name: string,
  replaceCode: (code: string, prefix: string) => string,
  replaceOutput: (output: string, prefix: string) => string
): RuleTester.InvalidTestCase[] => {
  const filename = basename(test.filename!);
  const exportDefaultPrefix = 'export default ';
  const exportNamedPrefix = `export const ${name} = `;
  const namedPrefix = `const ${name} = `;

  return [
    {
      ...test,
      filename: `${filename}-export-default-declaration.ts`,
      code: replaceCode(test.code, exportDefaultPrefix),
      output: replaceOutput(test.output!, exportDefaultPrefix),
    },
    {
      ...test,
      filename: `${filename}-export-named-declaration.ts`,
      code: replaceCode(test.code, exportNamedPrefix),
      output: replaceOutput(test.output!, exportNamedPrefix),
    },
    {
      ...test,
      filename: `${filename}-named-declaration.ts`,
      code: replaceCode(test.code, namedPrefix),
      output: replaceOutput(test.output!, namedPrefix),
    },
  ];
};

export const createTypedInvalidTestCase = (
  test: RuleTester.InvalidTestCase,
  replaceCode: (code: string) => string,
  replaceOutput: (output: string) => string
): RuleTester.InvalidTestCase => ({
  ...test,
  filename: `typed-${basename(test.filename!)}.ts`,
  code: replaceCode(test.code),
  output: replaceOutput(test.output!),
});