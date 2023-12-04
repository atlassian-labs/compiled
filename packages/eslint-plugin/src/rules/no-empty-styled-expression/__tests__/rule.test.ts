import type { RuleTester } from 'eslint';

import { typeScriptTester as tester } from '../../../test-utils';
import { noEmptyStyledExpressionRule } from '../index';

type InvalidTestCase = Omit<RuleTester.InvalidTestCase, 'errors'>;

const createInvalidTestCases = (tests: InvalidTestCase[]) =>
  tests.map((t) => ({
    ...t,
    errors: [{ messageId: 'unexpected' }],
  }));

tester.run('no-styled-tagged-template-expression', noEmptyStyledExpressionRule, {
  valid: [
    `
        import { styled } from 'styled';

        styled.div({
            color: blue
        });
    `,
    `
        import { styled } from 'styled';

        styled.span({
            color: blue
        });
    `,
    `
        import { styled } from '@compiled/react';

        // Considered valid due to the scope of this rule only checking for empty objects and arrays
        styled.span("hello world");
    `,
    ` 
        import { styled } from '@compiled/react';

        // Considered valid due to the scope of this rule only covering arguments of length 0 and 1.
        styled.span({}, {});
    `,
    ` 
        import { styled } from '@compiled/react';

        // Considered valid (not checking) due to boolean operations within styled calls not being used with empty objects
        styled.span(true && {});
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
      name: 'styled.div() is passed no arguments',
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
      name: 'styled.span() is passed no arguments',
      code: `
            import { styled } from '@compiled/react';

            styled.span();
        `,
    },
    {
      name: 'styled.div() passed empty array as argument',
      code: `
            import { styled } from '@compiled/react';

            styled.div([]);
        `,
    },
  ]),
});
