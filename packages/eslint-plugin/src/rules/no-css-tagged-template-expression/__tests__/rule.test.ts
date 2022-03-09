import type { RuleTester } from 'eslint';

import {
  createAliasedInvalidTestCase,
  createDeclarationInvalidTestCases,
  tester,
} from '../../../test-utils';
import { noCssTaggedTemplateExpressionRule } from '../index';

type InvalidTestCase = Omit<RuleTester.InvalidTestCase, 'errors'>;

const lastCssCallExpressionRe = /css\((?![\s\S]*css\()/g;

const createInvalidTestCases = (tests: InvalidTestCase[]) =>
  tests
    .map((t) => ({
      ...t,
      errors: [{ messageId: 'noCssTaggedTemplateExpression' }],
    }))
    .flatMap((t) => [
      t,
      ...createDeclarationInvalidTestCases(
        t,
        'styles',
        (code, prefix) => code.replace('css`', prefix + 'css`'),
        (output, prefix) => output.replace(lastCssCallExpressionRe, prefix + 'css(')
      ),
    ])
    .flatMap((t) => [
      t,
      createAliasedInvalidTestCase(
        t,
        (code) =>
          code
            .replace('{ css }', '{ css as css2 }')
            .replace('css`', 'css2`')
            .replace(/css\(/g, 'css2('),
        (output) => output.replace('{ css }', '{ css as css2 }').replace(/css\(/g, 'css2(')
      ),
    ]);

// TODO Handle comments
tester.run('no-css-tagged-template-expression', noCssTaggedTemplateExpressionRule, {
  valid: [
    `
      import { css } from 'css';

      css\`color: blue\`;
    `,
    `
      import { css } from '@compiled/react-clone';

      css\`color: blue\`;
    `,
  ],
  invalid: createInvalidTestCases([
    {
      filename: 'single-line-static-rule.ts',
      code: `
        import { css } from '@compiled/react';

        css\`color: blue\`;
      `,
      output: `
        import { css } from '@compiled/react';

        css({
          color: "blue"
        });
      `,
    },
    {
      filename: 'multiline-static-rules.ts',
      code: `
        import { css } from '@compiled/react';

        css\`
          color: blue;
          font-weight: 500;
          opacity: 0.8;
          :hover { opacity: 1; text-decoration: underline; }
          :visited { color: indigo; }
          :focus {
            color: darkblue;
            opacity: 1;
          }
          display: block;
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        css({
          color: "blue",
          fontWeight: 500,
          opacity: 0.8,
          ":hover": {
            opacity: 1,
            textDecoration: "underline"
          },
          ":visited": {
            color: "indigo"
          },
          ":focus": {
            color: "darkblue",
            opacity: 1
          },
          display: "block"
        });
      `,
    },
    {
      filename: 'no-trailing-semicolon-multiline-static-rules.ts',
      code: `
        import { css } from '@compiled/react';

        css\`
          color: blue;
          font-weight: 500;
          opacity: 0.8;
          :hover { opacity: 1; text-decoration: underline }
          :visited { color: indigo }
          :focus {
            color: darkblue;
            opacity: 1
          }
          display: block
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        css({
          color: "blue",
          fontWeight: 500,
          opacity: 0.8,
          ":hover": {
            opacity: 1,
            textDecoration: "underline"
          },
          ":visited": {
            color: "indigo"
          },
          ":focus": {
            color: "darkblue",
            opacity: 1
          },
          display: "block"
        });
      `,
    },
    {
      filename: 'nested-selectors.ts',
      code: `
        import { css } from '@compiled/react';

        css\`
          color: blue;
          #foo {
            .bar {
              [data-testid="baz"] {
                :hover {
                  text-decoration: underline;
                }
              }
            }
          }
          @media screen and (max-width: 600px) {
            #foo {
              .bar {
                opacity: 0;
              }
            }
          }
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        css({
          color: "blue",
          "#foo": {
            ".bar": {
              [\`[data-testid="baz"]\`]: {
                ":hover": {
                  textDecoration: "underline"
                }
              }
            }
          },
          "@media screen and (max-width: 600px)": {
            "#foo": {
              ".bar": {
                opacity: 0
              }
            }
          }
        });
      `,
    },
    {
      filename: 'interpolated-declaration-values.ts',
      code: `
        import { css } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        css\`
          color: \${color};
          opacity: \${opacity};
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        css({
          color: color,
          opacity: opacity
        });
      `,
    },
    {
      filename: 'affixed-declaration-values.ts',
      code: `
        import { css } from '@compiled/react';

        const size = 8;

        css\`
          margin: \${size}px \${size * 3}px;
          padding: calc(\${size} * 2);
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        const size = 8;

        css({
          margin: \`\${size}px \${size * 3}px\`,
          padding: \`calc(\${size} * 2)\`
        });
      `,
    },
    {
      filename: 'mixins.ts',
      code: `
        import { css } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        css\`
          \${primary};
          opacity: 0.8;
          :hover {
            \${hover};
            opacity: 1;
          }
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        css(
          primary,
          {
            opacity: 0.8,
            ":hover": [
              hover,
              {
                opacity: 1
              }
            ]
          }
        );
      `,
    },
    {
      filename: 'no-trailing-semicolon-mixins.ts',
      code: `
        import { css } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        css\`
          \${primary}
          opacity: 0.8;
          :hover {
            \${hover}
            opacity: 1
          }
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        css(
          primary,
          {
            opacity: 0.8,
            ":hover": [
              hover,
              {
                opacity: 1
              }
            ]
          }
        );
      `,
    },
  ]),
});
