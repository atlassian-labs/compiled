import type { RuleTester } from 'eslint';

import {
  createAliasedInvalidTestCase,
  createDeclarationInvalidTestCases,
  tester,
} from '../../../test-utils';
import { noKeyframesTaggedTemplateExpressionRule } from '../index';

type InvalidTestCase = Omit<RuleTester.InvalidTestCase, 'errors'>;

const replaceAlias = (str: string) =>
  str
    .replace('{ keyframes }', '{ keyframes as keyframes2 }')
    .replace('keyframes`', 'keyframes2`')
    .replace('keyframes(', 'keyframes2(');

const createInvalidTestCases = (tests: InvalidTestCase[]) =>
  tests
    .map((t) => ({
      ...t,
      errors: [{ messageId: 'noKeyframesTaggedTemplateExpression' }],
    }))
    .flatMap((t) => [
      t,
      ...createDeclarationInvalidTestCases(
        t,
        'fadeOut',
        (code, prefix) => code.replace('keyframes`', prefix + 'keyframes`'),
        (output, prefix) => output.replace('keyframes(', prefix + 'keyframes(')
      ),
    ])
    .flatMap((t) => [t, createAliasedInvalidTestCase(t, replaceAlias, replaceAlias)]);

// TODO Handle comments
tester.run('no-keyframes-tagged-template-expression', noKeyframesTaggedTemplateExpressionRule, {
  valid: [
    `
      import { keyframes } from 'keyframes';

      keyframes\`from { opacity: 1 } to { opacity: 0 }\`;
    `,
    `
      import { keyframes } from '@compiled/react-clone';

      keyframes\`from { opacity: 1 } to { opacity: 0 }\`;
    `,
  ],
  invalid: createInvalidTestCases([
    {
      filename: 'single-line-static-rule.ts',
      code: `
        import { keyframes } from '@compiled/react';

        keyframes\`from, 25% { opacity: 1 } to { opacity: 0 }\`;
      `,
      output: `
        import { keyframes } from '@compiled/react';

        keyframes({
          "from, 25%": {
            opacity: 1
          },
          to: {
            opacity: 0
          }
        });
      `,
    },
    {
      filename: 'multiline-static-rules.ts',
      code: `
        import { keyframes } from '@compiled/react';

        keyframes\`
          from, 25% {
            color: darkblue;
            opacity: 1;
          }
          25% {
            color: darkblue;
            opacity: 0.75;
          }
          50% {
            color: blue;
            opacity: 0.5;
          }
          to {
            color: blue;
            opacity: 0;
          }
        \`;
      `,
      output: `
        import { keyframes } from '@compiled/react';

        keyframes({
          "from, 25%": {
            color: "darkblue",
            opacity: 1
          },
          "25%": {
            color: "darkblue",
            opacity: 0.75
          },
          "50%": {
            color: "blue",
            opacity: 0.5
          },
          to: {
            color: "blue",
            opacity: 0
          }
        });
      `,
    },
    {
      filename: 'no-trailing-semicolon-multiline-static-rules.ts',
      code: `
        import { keyframes } from '@compiled/react';

        keyframes\`
          from, 25% {
            color: darkblue;
            opacity: 1
          }
          25% {
            color: darkblue;
            opacity: 0.75
          }
          50% {
            color: blue;
            opacity: 0.5
          }
          to {
            color: blue;
            opacity: 0
          }
        \`;
      `,
      output: `
        import { keyframes } from '@compiled/react';

        keyframes({
          "from, 25%": {
            color: "darkblue",
            opacity: 1
          },
          "25%": {
            color: "darkblue",
            opacity: 0.75
          },
          "50%": {
            color: "blue",
            opacity: 0.5
          },
          to: {
            color: "blue",
            opacity: 0
          }
        });
      `,
    },
    {
      filename: 'interpolated-declaration-values.ts',
      code: `
        import { keyframes } from '@compiled/react';

        const from = {
          color: 'darkblue',
          opacity: 1
        };

        const toColor = 'blue';
        const toOpacity = 0;

        keyframes\`
          from {
            color: \${from.color};
            opacity: \${from.opacity};
          }
          to {
            color: \${toColor};
            opacity: \${toOpacity};
          }
        \`;
      `,
      output: `
        import { keyframes } from '@compiled/react';

        const from = {
          color: 'darkblue',
          opacity: 1
        };

        const toColor = 'blue';
        const toOpacity = 0;

        keyframes({
          from: {
            color: from.color,
            opacity: from.opacity
          },
          to: {
            color: toColor,
            opacity: toOpacity
          }
        });
      `,
    },
    {
      filename: 'affixed-rules.ts',
      code: `
        import { keyframes } from '@compiled/react';

        const size = 8;

        keyframes\`
          from {
            margin: \${size}px \${size * 3}px;
            padding: calc(\${size} * 2);
          }
          to {
            margin: \${size}px \${size * 6}px;
            padding: calc(\${size} * 4);
          }
        \`;
      `,
      output: `
        import { keyframes } from '@compiled/react';

        const size = 8;

        keyframes({
          from: {
            margin: \`\${size}px \${size * 3}px\`,
            padding: \`calc(\${size} * 2)\`
          },
          to: {
            margin: \`\${size}px \${size * 6}px\`,
            padding: \`calc(\${size} * 4)\`
          }
        });
      `,
    },
  ]),
});
