// How can I test a rule that emits a warning/error message, but makes no changes in the code?
// Is there an Assert for ESLint?

import type { RuleTester } from 'eslint';

import { typeScriptTester as tester } from '../../../test-utils';
import { noStyledEmptyExpressionRule } from '../index';

// Omitting errors in this type so createInvalidTestCases can be used to automatically add them
type InvalidTestCase = Omit<RuleTester.InvalidTestCase, 'errors'>;

const createInvalidTestCases = (tests: InvalidTestCase[]) =>
  tests.map((t) => ({
    ...t,
    errors: [{ messageId: 'unexpected' }],
  }));

tester.run('no-styled-tagged-template-expression', noStyledEmptyExpressionRule, {
  valid: [
    `
      import { styled } from 'styled';

      styled.div\`color: blue\`;
    `,
    `
      import { styled } from '@compiled/react-clone';

      styled.div\`color: blue\`;
    `,
  ],
  invalid: createInvalidTestCases([
    {
      name: 'styled.div({}) is passed an empty object',
      code: `
            import { styled } from '@compiled/react';

            styled.div({});
        `,
    },
    {
      name: 'styled.div({}) is passed no arguments',
      code: `
            import { styled } from '@compiled/react';

            styled.div();
        `,
    },
    {
      name: 'styled.span({}) is passed an empty object',
      code: `
            import { styled } from '@compiled/react';

            styled.span({});
        `,
    },
    {
      name: 'styled.span({}) is passed no arguments',
      code: `
            import { styled } from '@compiled/react';

            styled.span();
        `,
    },
  ]),
});
